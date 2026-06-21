"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, requireRole } from "@/lib/auth-utils";
import { Role } from "@prisma/client";
import * as stockService from "@/server/services/stockService";
import { parsePagination } from "@/server/actions/validate";
import type { ActionResult } from "@/server/actions/auth";

function toError(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

export async function getTransfersAction(params: {
  page?: number;
  pageSize?: number;
}) {
  await requireAuth();
  return stockService.listTransfers(parsePagination(params));
}

export async function getTransferFormDataAction() {
  await requireAuth();
  const [products, locations] = await Promise.all([
    stockService.listProductsForStock(),
    stockService.listLocations(),
  ]);
  return { products, locations };
}

export async function createTransferAction(
  input: Parameters<typeof stockService.transferStock>[1],
): Promise<ActionResult<{ transferId: string }>> {
  try {
    const user = await requireRole(Role.ADMIN, Role.MANAGER);
    const result = await stockService.transferStock(user, input);
    revalidatePath("/transfers");
    revalidatePath("/stock");
    revalidatePath("/");
    return { success: true, data: { transferId: result.transferId } };
  } catch (error) {
    return { success: false, error: toError(error) };
  }
}
