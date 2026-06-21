import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AuthUser } from "@/lib/auth-utils";
import {
  paginationSchema,
  supplierCreateSchema,
  supplierUpdateSchema,
  type PaginationInput,
  type SupplierCreateInput,
  type SupplierUpdateInput,
} from "@/lib/validations";

export async function listSuppliers(input: PaginationInput) {
  const { page, pageSize, search } = paginationSchema.parse(input);
  const skip = (page - 1) * pageSize;

  const where: Prisma.SupplierWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      include: {
        _count: { select: { supplierProducts: true, purchaseOrders: true } },
      },
      orderBy: { name: "asc" },
      skip,
      take: pageSize,
    }),
    prisma.supplier.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getSupplier(id: string) {
  return prisma.supplier.findUnique({
    where: { id },
    include: {
      supplierProducts: { include: { product: true } },
      purchaseOrders: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
}

export async function createSupplier(_user: AuthUser, input: SupplierCreateInput) {
  const data = supplierCreateSchema.parse(input);
  return prisma.supplier.create({ data });
}

export async function updateSupplier(_user: AuthUser, input: SupplierUpdateInput) {
  const { id, ...data } = supplierUpdateSchema.parse(input);
  return prisma.supplier.update({ where: { id }, data });
}

export async function listSuppliersSimple() {
  return prisma.supplier.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}
