import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { adjustStock } from "@/server/services/stockService";
import {
  testPrisma,
  resetDatabase,
  seedTestContext,
  getStockQuantity,
} from "./helpers";

describe("concurrent stock adjust", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  it("prevents double spend under concurrent decrements", async () => {
    const ctx = await seedTestContext();
    const authUser = {
      id: ctx.user.id,
      email: ctx.user.email,
      name: null as string | null,
      role: ctx.user.role,
    };

    await adjustStock(authUser, {
      productId: ctx.productId,
      locationId: ctx.locationId,
      quantity: 1,
      reason: "Seed stock",
    });

    const results = await Promise.allSettled([
      adjustStock(authUser, {
        productId: ctx.productId,
        locationId: ctx.locationId,
        quantity: -1,
        reason: "Concurrent A",
      }),
      adjustStock(authUser, {
        productId: ctx.productId,
        locationId: ctx.locationId,
        quantity: -1,
        reason: "Concurrent B",
      }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(await getStockQuantity(ctx.productId, ctx.locationId)).toBe(0);

    const movements = await testPrisma.stockMovement.findMany({
      where: { productId: ctx.productId, locationId: ctx.locationId },
      orderBy: { createdAt: "asc" },
    });
    expect(movements).toHaveLength(2);
  });

  it("applies concurrent increments correctly", async () => {
    const ctx = await seedTestContext();
    const authUser = {
      id: ctx.user.id,
      email: ctx.user.email,
      name: null as string | null,
      role: ctx.user.role,
    };

    await adjustStock(authUser, {
      productId: ctx.productId,
      locationId: ctx.locationId,
      quantity: 10,
      reason: "Seed stock",
    });

    await Promise.all([
      adjustStock(authUser, {
        productId: ctx.productId,
        locationId: ctx.locationId,
        quantity: 2,
        reason: "Concurrent in A",
      }),
      adjustStock(authUser, {
        productId: ctx.productId,
        locationId: ctx.locationId,
        quantity: 3,
        reason: "Concurrent in B",
      }),
    ]);

    expect(await getStockQuantity(ctx.productId, ctx.locationId)).toBe(15);
  });
});
