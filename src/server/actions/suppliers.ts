"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, requireRole } from "@/lib/auth-utils";
import { Role } from "@prisma/client";
import * as supplierService from "@/server/services/supplierService";
import { parseId, parsePagination } from "@/server/actions/validate";
import type { ActionResult } from "@/server/actions/auth";

function toError(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

export async function getSuppliersAction(params: {
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  await requireAuth();
  return supplierService.listSuppliers(parsePagination(params));
}

export async function getSupplierAction(id: string) {
  await requireAuth();
  return supplierService.getSupplier(parseId(id));
}

export async function createSupplierAction(
  input: Parameters<typeof supplierService.createSupplier>[1],
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireRole(Role.ADMIN, Role.MANAGER);
    const supplier = await supplierService.createSupplier(user, input);
    revalidatePath("/suppliers");
    return { success: true, data: { id: supplier.id } };
  } catch (error) {
    return { success: false, error: toError(error) };
  }
}

export async function updateSupplierAction(
  input: Parameters<typeof supplierService.updateSupplier>[1],
): Promise<ActionResult> {
  try {
    const user = await requireRole(Role.ADMIN, Role.MANAGER);
    await supplierService.updateSupplier(user, input);
    revalidatePath("/suppliers");
    return { success: true };
  } catch (error) {
    return { success: false, error: toError(error) };
  }
}
