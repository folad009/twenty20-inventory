import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AuthUser } from "@/lib/auth-utils";
import {
  paginationSchema,
  productCreateSchema,
  productUpdateSchema,
  type PaginationInput,
  type ProductCreateInput,
  type ProductUpdateInput,
} from "@/lib/validations";

export async function listProducts(input: PaginationInput) {
  const { page, pageSize, search } = paginationSchema.parse(input);
  const skip = (page - 1) * pageSize;

  const where: Prisma.ProductWhereInput = {
    archivedAt: null,
    ...(search
      ? {
          OR: [
            { sku: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
            { barcode: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getProduct(id: string) {
  return prisma.product.findFirst({
    where: { id, archivedAt: null },
    include: {
      category: true,
      stockLevels: { include: { location: true } },
      supplierProducts: { include: { supplier: true } },
    },
  });
}

export async function findByBarcode(barcode: string) {
  const normalized = barcode.trim();
  if (!normalized) {
    return null;
  }

  return prisma.product.findFirst({
    where: { barcode: normalized, archivedAt: null },
    include: {
      category: true,
      stockLevels: { include: { location: true } },
    },
  });
}

export async function listCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function createProduct(_user: AuthUser, input: ProductCreateInput) {
  const data = productCreateSchema.parse(input);
  return prisma.product.create({ data });
}

export async function updateProduct(_user: AuthUser, input: ProductUpdateInput) {
  const { id, ...data } = productUpdateSchema.parse(input);
  return prisma.product.update({ where: { id }, data });
}

export async function archiveProduct(_user: AuthUser, id: string) {
  return prisma.product.update({
    where: { id },
    data: { archivedAt: new Date() },
  });
}
