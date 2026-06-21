import { Prisma, StockMovementType } from "@prisma/client";
import { prisma, interactiveTransactionOptions } from "@/lib/prisma";
import type { AuthUser } from "@/lib/auth-utils";
import {
  paginationSchema,
  stockAdjustSchema,
  stockTransferSchema,
  type PaginationInput,
  type StockAdjustInput,
  type StockTransferInput,
} from "@/lib/validations";

type TxClient = Prisma.TransactionClient;

function getDatabaseSchema(): string {
  const url = process.env.DATABASE_URL;
  if (!url) return "public";
  try {
    const parsed = new URL(url.replace(/^postgresql:/, "http:"));
    return parsed.searchParams.get("schema") ?? "public";
  } catch {
    return "public";
  }
}

async function lockStockLevel(
  tx: TxClient,
  productId: string,
  locationId: string,
) {
  const schema = getDatabaseSchema();
  const rows = await tx.$queryRaw<
    Array<{
      id: string;
      quantity_on_hand: number;
      quantity_reserved: number;
    }>
  >`
    SELECT id, quantity_on_hand, quantity_reserved
    FROM ${Prisma.raw(`"${schema}"."stock_levels"`)}
    WHERE product_id = ${productId} AND location_id = ${locationId}
    FOR UPDATE
  `;
  return rows[0] ?? null;
}

async function ensureLockedStockLevel(
  tx: TxClient,
  productId: string,
  locationId: string,
  options: { required: boolean },
) {
  let level = await lockStockLevel(tx, productId, locationId);

  if (!level && !options.required) {
    await tx.stockLevel.create({
      data: { productId, locationId, quantityOnHand: 0 },
    });
    level = await lockStockLevel(tx, productId, locationId);
  }

  if (!level && options.required) {
    throw new Error("No stock at source location");
  }

  if (!level) {
    throw new Error("Failed to lock stock level");
  }

  return level;
}

export async function applyStockChange(
  tx: TxClient,
  params: {
    productId: string;
    locationId: string;
    userId: string;
    quantity: number;
    type: StockMovementType;
    reason?: string;
    referenceId?: string;
  },
) {
  const product = await tx.product.findUniqueOrThrow({
    where: { id: params.productId },
  });

  let stockLevel = await lockStockLevel(
    tx,
    params.productId,
    params.locationId,
  );

  if (!stockLevel) {
    await tx.stockLevel.upsert({
      where: {
        productId_locationId: {
          productId: params.productId,
          locationId: params.locationId,
        },
      },
      create: {
        productId: params.productId,
        locationId: params.locationId,
        quantityOnHand: 0,
      },
      update: {},
    });
    stockLevel = await lockStockLevel(
      tx,
      params.productId,
      params.locationId,
    );
    if (!stockLevel) {
      throw new Error("Failed to lock stock level");
    }
  }

  const newQuantity = stockLevel.quantity_on_hand + params.quantity;
  if (newQuantity < 0 && !product.allowBackorder) {
    throw new Error("Insufficient stock");
  }

  await tx.stockLevel.update({
    where: { id: stockLevel.id },
    data: { quantityOnHand: newQuantity },
  });

  await tx.stockMovement.create({
    data: {
      productId: params.productId,
      locationId: params.locationId,
      userId: params.userId,
      type: params.type,
      quantity: params.quantity,
      reason: params.reason,
      referenceId: params.referenceId,
    },
  });

  return newQuantity;
}

export async function listStockLevels(input: PaginationInput) {
  const { page, pageSize, search } = paginationSchema.parse(input);
  const skip = (page - 1) * pageSize;

  const where: Prisma.StockLevelWhereInput = search
    ? {
        product: {
          archivedAt: null,
          OR: [
            { sku: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
          ],
        },
      }
    : { product: { archivedAt: null } };

  const [items, total] = await Promise.all([
    prisma.stockLevel.findMany({
      where,
      include: {
        product: { include: { category: true } },
        location: true,
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.stockLevel.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function listMovements(input: PaginationInput) {
  const { page, pageSize } = paginationSchema.parse(input);
  const skip = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    prisma.stockMovement.findMany({
      include: {
        product: true,
        location: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.stockMovement.count(),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function adjustStock(user: AuthUser, input: StockAdjustInput) {
  const data = stockAdjustSchema.parse(input);
  const type =
    data.quantity > 0
      ? StockMovementType.ADJUSTMENT_IN
      : StockMovementType.ADJUSTMENT_OUT;

  return prisma.$transaction(
    async (tx) => {
    const newQty = await applyStockChange(tx, {
      productId: data.productId,
      locationId: data.locationId,
      userId: user.id,
      quantity: data.quantity,
      type,
      reason: data.reason,
    });
    return { quantityOnHand: newQty };
  },
    interactiveTransactionOptions,
  );
}

export async function transferStock(user: AuthUser, input: StockTransferInput) {
  const data = stockTransferSchema.parse(input);
  const transferId = crypto.randomUUID();

  return prisma.$transaction(
    async (tx) => {
    const product = await tx.product.findFirstOrThrow({
      where: { id: data.productId, archivedAt: null },
    });

    const [fromLocation, toLocation] = await Promise.all([
      tx.location.findUniqueOrThrow({ where: { id: data.fromLocationId } }),
      tx.location.findUniqueOrThrow({ where: { id: data.toLocationId } }),
    ]);

    const lockOrder = [data.fromLocationId, data.toLocationId].sort();
    const levels = new Map<string, Awaited<ReturnType<typeof lockStockLevel>>>();

    for (const locationId of lockOrder) {
      const required = locationId === data.fromLocationId;
      const level = await ensureLockedStockLevel(tx, data.productId, locationId, {
        required,
      });
      levels.set(locationId, level);
    }

    const sourceLevel = levels.get(data.fromLocationId)!;
    const destLevel = levels.get(data.toLocationId)!;

    const newSourceQty = sourceLevel.quantity_on_hand - data.quantity;
    if (newSourceQty < 0 && !product.allowBackorder) {
      throw new Error("Insufficient stock at source location");
    }

    const newDestQty = destLevel.quantity_on_hand + data.quantity;
    const reason =
      data.reason?.trim() ||
      `Transfer from ${fromLocation.name} to ${toLocation.name}`;

    await tx.stockLevel.update({
      where: { id: sourceLevel.id },
      data: { quantityOnHand: newSourceQty },
    });

    await tx.stockLevel.update({
      where: { id: destLevel.id },
      data: { quantityOnHand: newDestQty },
    });

    await tx.stockMovement.create({
      data: {
        productId: data.productId,
        locationId: data.fromLocationId,
        userId: user.id,
        type: StockMovementType.TRANSFER_OUT,
        quantity: -data.quantity,
        reason,
        referenceId: transferId,
      },
    });

    await tx.stockMovement.create({
      data: {
        productId: data.productId,
        locationId: data.toLocationId,
        userId: user.id,
        type: StockMovementType.TRANSFER_IN,
        quantity: data.quantity,
        reason,
        referenceId: transferId,
      },
    });

    return {
      transferId,
      sourceQuantityOnHand: newSourceQty,
      destinationQuantityOnHand: newDestQty,
    };
  },
    interactiveTransactionOptions,
  );
}

export type TransferHistoryItem = {
  id: string;
  product: { id: string; sku: string; name: string };
  fromLocation: { id: string; name: string };
  toLocation: { id: string; name: string };
  quantity: number;
  reason: string | null;
  user: { id: string; name: string | null; email: string } | null;
  createdAt: Date;
};

export async function listTransfers(input: PaginationInput) {
  const { page, pageSize } = paginationSchema.parse(input);
  const skip = (page - 1) * pageSize;

  const where: Prisma.StockMovementWhereInput = {
    type: StockMovementType.TRANSFER_OUT,
    referenceId: { not: null },
  };

  const [outMovements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: {
        product: { select: { id: true, sku: true, name: true } },
        location: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.stockMovement.count({ where }),
  ]);

  const referenceIds = outMovements
    .map((movement) => movement.referenceId)
    .filter((id): id is string => id !== null);

  const inMovements =
    referenceIds.length > 0
      ? await prisma.stockMovement.findMany({
          where: {
            type: StockMovementType.TRANSFER_IN,
            referenceId: { in: referenceIds },
          },
          include: {
            location: { select: { id: true, name: true } },
          },
        })
      : [];

  const destinationByReference = new Map(
    inMovements.map((movement) => [movement.referenceId!, movement.location]),
  );

  const items: TransferHistoryItem[] = outMovements.flatMap((movement) => {
    const toLocation = destinationByReference.get(movement.referenceId!);
    if (!toLocation) {
      return [];
    }

    return [
      {
        id: movement.referenceId!,
        product: movement.product,
        fromLocation: movement.location,
        toLocation,
        quantity: Math.abs(movement.quantity),
        reason: movement.reason,
        user: movement.user,
        createdAt: movement.createdAt,
      },
    ];
  });

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function listLocations() {
  return prisma.location.findMany({ orderBy: { name: "asc" } });
}

export async function listProductsForStock() {
  return prisma.product.findMany({
    where: { archivedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, sku: true, name: true },
  });
}
