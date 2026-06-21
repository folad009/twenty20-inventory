import { PrismaClient, Role, PurchaseOrderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

// Uses DATABASE_URL (overridden to TEST_DATABASE_URL in tests/setup.ts).
export const testPrisma = new PrismaClient();

export type TestContext = {
  user: { id: string; email: string; role: Role };
  supplierId: string;
  locationId: string;
  productId: string;
};

export async function resetDatabase() {
  await testPrisma.stockMovement.deleteMany();
  await testPrisma.purchaseOrderItem.deleteMany();
  await testPrisma.purchaseOrder.deleteMany();
  await testPrisma.stockLevel.deleteMany();
  await testPrisma.supplierProduct.deleteMany();
  await testPrisma.product.deleteMany();
  await testPrisma.supplier.deleteMany();
  await testPrisma.location.deleteMany();
  await testPrisma.category.deleteMany();
  await testPrisma.session.deleteMany();
  await testPrisma.account.deleteMany();
  await testPrisma.user.deleteMany();
}

export async function seedTestContext(): Promise<TestContext> {
  const passwordHash = await bcrypt.hash("password123", 12);
  const user = await testPrisma.user.create({
    data: {
      email: `manager-test-${Date.now()}@inventory.local`,
      name: "Test Manager",
      passwordHash,
      role: Role.MANAGER,
    },
  });

  const supplier = await testPrisma.supplier.create({
    data: { name: "Test Supplier" },
  });

  const location = await testPrisma.location.create({
    data: { name: `Test Warehouse ${Date.now()}` },
  });

  const product = await testPrisma.product.create({
    data: {
      sku: `TEST-SKU-${Date.now()}`,
      name: "Test Product",
      reorderThreshold: 5,
    },
  });

  return {
    user: { id: user.id, email: user.email, role: user.role },
    supplierId: supplier.id,
    locationId: location.id,
    productId: product.id,
  };
}

export async function getStockQuantity(productId: string, locationId: string) {
  const level = await testPrisma.stockLevel.findUnique({
    where: { productId_locationId: { productId, locationId } },
  });
  return level?.quantityOnHand ?? 0;
}

export async function countMovementsForPo(poId: string) {
  return testPrisma.stockMovement.count({
    where: { referenceId: poId, type: "PO_RECEIVE" },
  });
}

export async function getPoStatus(poId: string) {
  const po = await testPrisma.purchaseOrder.findUniqueOrThrow({
    where: { id: poId },
  });
  return po.status;
}

export { PurchaseOrderStatus };
