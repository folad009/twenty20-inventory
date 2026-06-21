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

export async function getStockLevelsAction(params: {
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  await requireAuth();
  return stockService.listStockLevels(parsePagination(params));
}

export async function getMovementsAction(params: {
  page?: number;
  pageSize?: number;
}) {
  await requireAuth();
  return stockService.listMovements(parsePagination(params));
}

export async function getLocationsAction() {
  await requireAuth();
  return stockService.listLocations();
}

export async function getProductsForStockAction() {
  await requireAuth();
  return stockService.listProductsForStock();
}

export async function adjustStockAction(
  input: Parameters<typeof stockService.adjustStock>[1],
): Promise<ActionResult> {
  try {
    const user = await requireRole(Role.ADMIN, Role.MANAGER);
    await stockService.adjustStock(user, input);
    revalidatePath("/stock");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: toError(error) };
  }
}
