import { Role } from "@prisma/client";
import { auth } from "@/auth";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
};

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    throw new UnauthorizedError();
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name ?? null,
    role: (session.user.role as Role) ?? Role.VIEWER,
  };
}

export async function requireRole(...roles: Role[]): Promise<AuthUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new ForbiddenError("Insufficient permissions");
  }
  return user;
}

export function canMutate(role: Role): boolean {
  return role === Role.ADMIN || role === Role.MANAGER;
}

export function isAdmin(role: Role): boolean {
  return role === Role.ADMIN;
}
