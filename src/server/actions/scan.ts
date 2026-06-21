"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, requireRole } from "@/lib/auth-utils";
import { Role } from "@prisma/client";
import { barcodeLookupSchema } from "@/lib/validations";
import * as productService from "@/server/services/productService";
import * as stockService from "@/server/services/stockService";
import type { ActionResult } from "@/server/actions/auth";

function toError(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

export async function lookupByBarcodeAction(barcode: string) {
  await requireAuth();
  const { barcode: normalized } = barcodeLookupSchema.parse({ barcode });
  return productService.findByBarcode(normalized);
}

export async function scanAdjustStockAction(
  input: Parameters<typeof stockService.adjustStock>[1],
): Promise<ActionResult<{ quantityOnHand: number }>> {
  try {
    const user = await requireRole(Role.ADMIN, Role.MANAGER);
    const result = await stockService.adjustStock(user, input);
    revalidatePath("/scan");
    revalidatePath("/stock");
    revalidatePath("/");
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: toError(error) };
  }
}

export async function getScanFormDataAction() {
  await requireAuth();
  return stockService.listLocations();
}
