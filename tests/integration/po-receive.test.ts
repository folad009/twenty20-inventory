import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { PurchaseOrderStatus } from "@prisma/client";
import {
  createPurchaseOrder,
  submitPurchaseOrder,
  receivePurchaseOrder,
} from "@/server/services/purchaseOrderService";
import {
  testPrisma,
  resetDatabase,
  seedTestContext,
  getStockQuantity,
  countMovementsForPo,
  getPoStatus,
} from "./helpers";

describe("purchase order receive", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  it("receives stock atomically and rejects over-receive", async () => {
    const ctx = await seedTestContext();

    const po = await createPurchaseOrder(
      {
        id: ctx.user.id,
        email: ctx.user.email,
        name: "Test Manager",
        role: ctx.user.role,
      },
      {
        supplierId: ctx.supplierId,
        locationId: ctx.locationId,
        items: [{ productId: ctx.productId, orderedQuantity: 10, unitCostCents: 100 }],
      },
    );

    await submitPurchaseOrder(
      { id: ctx.user.id, email: ctx.user.email, name: null, role: ctx.user.role },
      po.id,
    );

    const lineId = po.items[0].id;

    await receivePurchaseOrder(
      { id: ctx.user.id, email: ctx.user.email, name: null, role: ctx.user.role },
      {
        purchaseOrderId: po.id,
        items: [{ itemId: lineId, quantity: 6 }],
      },
    );

    expect(await getStockQuantity(ctx.productId, ctx.locationId)).toBe(6);
    expect(await getPoStatus(po.id)).toBe(PurchaseOrderStatus.PARTIALLY_RECEIVED);
    expect(await countMovementsForPo(po.id)).toBe(1);

    await receivePurchaseOrder(
      { id: ctx.user.id, email: ctx.user.email, name: null, role: ctx.user.role },
      {
        purchaseOrderId: po.id,
        items: [{ itemId: lineId, quantity: 4 }],
      },
    );

    expect(await getStockQuantity(ctx.productId, ctx.locationId)).toBe(10);
    expect(await getPoStatus(po.id)).toBe(PurchaseOrderStatus.RECEIVED);
    expect(await countMovementsForPo(po.id)).toBe(2);

    await expect(
      receivePurchaseOrder(
        { id: ctx.user.id, email: ctx.user.email, name: null, role: ctx.user.role },
        {
          purchaseOrderId: po.id,
          items: [{ itemId: lineId, quantity: 1 }],
        },
      ),
    ).rejects.toThrow(/not in a receivable state|Cannot receive more than remaining/);

    expect(await getStockQuantity(ctx.productId, ctx.locationId)).toBe(10);
    expect(await countMovementsForPo(po.id)).toBe(2);
  });
});
