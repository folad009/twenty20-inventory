"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, requireRole } from "@/lib/auth-utils";
import { Role } from "@prisma/client";
import * as purchaseOrderService from "@/server/services/purchaseOrderService";
import { listSuppliersSimple } from "@/server/services/supplierService";
import { parseId, parsePagination } from "@/server/actions/validate";
import type { ActionResult } from "@/server/actions/auth";

function toError(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

export async function getPurchaseOrdersAction(params: {
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  await requireAuth();
  return purchaseOrderService.listPurchaseOrders(parsePagination(params));
}

export async function getPurchaseOrderAction(id: string) {
  await requireAuth();
  return purchaseOrderService.getPurchaseOrder(parseId(id));
}

export async function getPoFormDataAction() {
  await requireAuth();
  const [suppliers, locations, products] = await Promise.all([
    listSuppliersSimple(),
    purchaseOrderService.listLocationsForPo(),
    purchaseOrderService.listProductsForPo(),
  ]);
  return { suppliers, locations, products };
}

export async function createPurchaseOrderAction(
  input: Parameters<typeof purchaseOrderService.createPurchaseOrder>[1],
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireRole(Role.ADMIN, Role.MANAGER);
    const po = await purchaseOrderService.createPurchaseOrder(user, input);
    revalidatePath("/purchase-orders");
    revalidatePath("/");
    return { success: true, data: { id: po.id } };
  } catch (error) {
    return { success: false, error: toError(error) };
  }
}

export async function submitPurchaseOrderAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireRole(Role.ADMIN, Role.MANAGER);
    const poId = parseId(id);
    await purchaseOrderService.submitPurchaseOrder(user, poId);
    revalidatePath("/purchase-orders");
    revalidatePath(`/purchase-orders/${poId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: toError(error) };
  }
}

export async function receivePurchaseOrderAction(
  input: Parameters<typeof purchaseOrderService.receivePurchaseOrder>[1],
): Promise<ActionResult> {
  try {
    const user = await requireRole(Role.ADMIN, Role.MANAGER);
    await purchaseOrderService.receivePurchaseOrder(user, input);
    revalidatePath("/purchase-orders");
    revalidatePath("/stock");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: toError(error) };
  }
}

export async function closePurchaseOrderAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireRole(Role.ADMIN, Role.MANAGER);
    const poId = parseId(id);
    await purchaseOrderService.closePurchaseOrder(user, poId);
    revalidatePath("/purchase-orders");
    revalidatePath(`/purchase-orders/${poId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: toError(error) };
  }
}
