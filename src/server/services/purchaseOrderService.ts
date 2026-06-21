import { PurchaseOrderStatus, StockMovementType } from "@prisma/client";
import { prisma, interactiveTransactionOptions } from "@/lib/prisma";
import type { AuthUser } from "@/lib/auth-utils";
import {
  paginationSchema,
  poCreateSchema,
  poReceiveSchema,
  type PaginationInput,
  type PoCreateInput,
  type PoReceiveInput,
} from "@/lib/validations";
import { applyStockChange } from "@/server/services/stockService";

function generateOrderNumber(): string {
  const now = new Date();
  const stamp = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `PO-${stamp}-${rand}`;
}

export async function listPurchaseOrders(input: PaginationInput) {
  const { page, pageSize, search } = paginationSchema.parse(input);
  const skip = (page - 1) * pageSize;

  const where = search
    ? {
        OR: [
          { orderNumber: { contains: search, mode: "insensitive" as const } },
          { supplier: { name: { contains: search, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        location: true,
        createdBy: { select: { name: true, email: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getPurchaseOrder(id: string) {
  return prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      location: true,
      createdBy: { select: { name: true, email: true } },
      items: { include: { product: true } },
    },
  });
}

export async function createPurchaseOrder(user: AuthUser, input: PoCreateInput) {
  const data = poCreateSchema.parse(input);

  return prisma.purchaseOrder.create({
    data: {
      orderNumber: generateOrderNumber(),
      supplierId: data.supplierId,
      locationId: data.locationId,
      notes: data.notes,
      createdById: user.id,
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          orderedQuantity: item.orderedQuantity,
          unitCostCents: item.unitCostCents,
        })),
      },
    },
    include: { items: true },
  });
}

export async function submitPurchaseOrder(user: AuthUser, id: string) {
  const po = await prisma.purchaseOrder.findUniqueOrThrow({ where: { id } });

  if (po.status !== PurchaseOrderStatus.DRAFT) {
    throw new Error("Only draft purchase orders can be submitted");
  }

  return prisma.purchaseOrder.update({
    where: { id },
    data: {
      status: PurchaseOrderStatus.ORDERED,
      orderedAt: new Date(),
    },
  });
}

export async function receivePurchaseOrder(user: AuthUser, input: PoReceiveInput) {
  const data = poReceiveSchema.parse(input);

  return prisma.$transaction(
    async (tx) => {
    const po = await tx.purchaseOrder.findUniqueOrThrow({
      where: { id: data.purchaseOrderId },
      include: { items: true },
    });

    if (
      po.status !== PurchaseOrderStatus.ORDERED &&
      po.status !== PurchaseOrderStatus.PARTIALLY_RECEIVED
    ) {
      throw new Error("Purchase order is not in a receivable state");
    }

    for (const receiveItem of data.items) {
      const line = po.items.find((i) => i.id === receiveItem.itemId);
      if (!line) {
        throw new Error("Invalid line item");
      }

      const remaining = line.orderedQuantity - line.receivedQuantity;
      if (receiveItem.quantity > remaining) {
        throw new Error(
          `Cannot receive more than remaining quantity for ${line.productId}`,
        );
      }

      if (receiveItem.quantity <= 0) {
        continue;
      }

      await tx.purchaseOrderItem.update({
        where: { id: line.id },
        data: { receivedQuantity: line.receivedQuantity + receiveItem.quantity },
      });

      await applyStockChange(tx, {
        productId: line.productId,
        locationId: po.locationId,
        userId: user.id,
        quantity: receiveItem.quantity,
        type: StockMovementType.PO_RECEIVE,
        reason: `Received from PO ${po.orderNumber}`,
        referenceId: po.id,
      });
    }

    const updatedItems = await tx.purchaseOrderItem.findMany({
      where: { purchaseOrderId: po.id },
    });

    const allReceived = updatedItems.every(
      (item) => item.receivedQuantity >= item.orderedQuantity,
    );
    const anyReceived = updatedItems.some((item) => item.receivedQuantity > 0);

    let status: PurchaseOrderStatus = po.status;
    if (allReceived) {
      status = PurchaseOrderStatus.RECEIVED;
    } else if (anyReceived) {
      status = PurchaseOrderStatus.PARTIALLY_RECEIVED;
    }

    return tx.purchaseOrder.update({
      where: { id: po.id },
      data: {
        status,
        receivedAt: allReceived ? new Date() : po.receivedAt,
      },
      include: { items: { include: { product: true } } },
    });
  },
    interactiveTransactionOptions,
  );
}

export async function closePurchaseOrder(_user: AuthUser, id: string) {
  const po = await prisma.purchaseOrder.findUniqueOrThrow({ where: { id } });

  if (
    po.status !== PurchaseOrderStatus.RECEIVED &&
    po.status !== PurchaseOrderStatus.PARTIALLY_RECEIVED
  ) {
    throw new Error("Purchase order must be received before closing");
  }

  return prisma.purchaseOrder.update({
    where: { id },
    data: {
      status: PurchaseOrderStatus.CLOSED,
      closedAt: new Date(),
    },
  });
}

export async function listProductsForPo() {
  return prisma.product.findMany({
    where: { archivedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, sku: true, name: true, unit: true },
  });
}

export async function listLocationsForPo() {
  return prisma.location.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}
