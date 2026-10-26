import { Prisma, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  userCreateSchema,
  userUpdateSchema,
  type UserCreateInput,
  type UserUpdateInput,
} from "@/lib/validations";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: userSelect,
  });
}

async function assertEmailAvailable(email: string, exceptId?: string) {
  const existing = await prisma.user.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      ...(exceptId ? { NOT: { id: exceptId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("A user with this email already exists");
  }
}

function rethrowEmailConflict(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new Error("A user with this email already exists");
  }
  throw error;
}

export async function createUser(input: UserCreateInput) {
  const data = userCreateSchema.parse(input);
  await assertEmailAvailable(data.email);
  const passwordHash = await bcrypt.hash(data.password, 12);

  try {
    return await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        passwordHash,
      },
      select: userSelect,
    });
  } catch (error) {
    rethrowEmailConflict(error);
  }
}

export async function updateUser(input: UserUpdateInput) {
  const data = userUpdateSchema.parse(input);
  await assertEmailAvailable(data.email, data.id);

  const passwordHash = data.password
    ? await bcrypt.hash(data.password, 12)
    : undefined;

  try {
    return await prisma.user.update({
      where: { id: data.id },
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        ...(passwordHash ? { passwordHash } : {}),
      },
      select: userSelect,
    });
  } catch (error) {
    rethrowEmailConflict(error);
  }
}

export async function deleteUser(actorId: string, id: string) {
  if (actorId === id) {
    throw new Error("You cannot delete your own account");
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role === Role.ADMIN) {
    const adminCount = await prisma.user.count({
      where: { role: Role.ADMIN },
    });
    if (adminCount <= 1) {
      throw new Error("Cannot delete the last administrator");
    }
  }

  const purchaseOrderCount = await prisma.purchaseOrder.count({
    where: { createdById: id },
  });
  if (purchaseOrderCount > 0) {
    throw new Error(
      "This user created purchase orders and cannot be deleted",
    );
  }

  await prisma.$transaction([
    prisma.stockMovement.updateMany({
      where: { userId: id },
      data: { userId: null },
    }),
    prisma.user.delete({ where: { id } }),
  ]);
}
