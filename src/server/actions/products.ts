"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, requireRole, canMutate } from "@/lib/auth-utils";
import { Role } from "@prisma/client";
import * as productService from "@/server/services/productService";
import { parseId, parsePagination } from "@/server/actions/validate";
import type { ActionResult } from "@/server/actions/auth";

function toError(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

export async function getProductsAction(params: {
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  await requireAuth();
  return productService.listProducts(parsePagination(params));
}

export async function getProductAction(id: string) {
  await requireAuth();
  return productService.getProduct(parseId(id));
}

export async function getCategoriesAction() {
  await requireAuth();
  return productService.listCategories();
}

export async function createProductAction(
  input: Parameters<typeof productService.createProduct>[1],
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireRole(Role.ADMIN, Role.MANAGER);
    const product = await productService.createProduct(user, input);
    revalidatePath("/products");
    revalidatePath("/");
    return { success: true, data: { id: product.id } };
  } catch (error) {
    return { success: false, error: toError(error) };
  }
}

export async function updateProductAction(
  input: Parameters<typeof productService.updateProduct>[1],
): Promise<ActionResult> {
  try {
    const user = await requireRole(Role.ADMIN, Role.MANAGER);
    await productService.updateProduct(user, input);
    revalidatePath("/products");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: toError(error) };
  }
}

export async function archiveProductAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireRole(Role.ADMIN, Role.MANAGER);
    await productService.archiveProduct(user, parseId(id));
    revalidatePath("/products");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: toError(error) };
  }
}

export async function canMutateProductsAction(): Promise<boolean> {
  const user = await requireAuth();
  return canMutate(user.role);
}
