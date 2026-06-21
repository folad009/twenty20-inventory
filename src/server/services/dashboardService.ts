import { PurchaseOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  const [
    totalSkus,
    lowStockLevels,
    recentMovements,
    poStatusCounts,
  ] = await Promise.all([
    prisma.product.count({ where: { archivedAt: null } }),
    prisma.stockLevel.findMany({
      where: {
        product: { archivedAt: null },
      },
      include: {
        product: true,
        location: true,
      },
    }),
    prisma.stockMovement.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        product: true,
        location: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.purchaseOrder.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
  ]);

  const lowStock = lowStockLevels.filter(
    (level) =>
      level.product.reorderThreshold > 0 &&
      level.quantityOnHand <= level.product.reorderThreshold,
  );

  const outOfStock = lowStockLevels.filter(
    (level) => level.quantityOnHand === 0,
  );

  const poSummary = Object.values(PurchaseOrderStatus).map((status) => ({
    status,
    count:
      poStatusCounts.find((row) => row.status === status)?._count.status ?? 0,
  }));

  return {
    totalSkus,
    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock.length,
    lowStockItems: lowStock
      .sort((a, b) => a.quantityOnHand - b.quantityOnHand)
      .slice(0, 10),
    recentMovements,
    poSummary,
  };
}
