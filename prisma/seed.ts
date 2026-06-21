import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@inventory.local" },
    update: {},
    create: {
      email: "admin@inventory.local",
      name: "Admin User",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: "manager@inventory.local" },
    update: {},
    create: {
      email: "manager@inventory.local",
      name: "Manager User",
      passwordHash,
      role: Role.MANAGER,
    },
  });

  await prisma.user.upsert({
    where: { email: "viewer@inventory.local" },
    update: {},
    create: {
      email: "viewer@inventory.local",
      name: "Viewer User",
      passwordHash,
      role: Role.VIEWER,
    },
  });

  const categories = await Promise.all(
    ["Electronics", "Office Supplies", "Packaging"].map((name) =>
      prisma.category.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );

  const locations = await Promise.all(
    [
      { name: "Main Warehouse", description: "Primary storage" },
      { name: "Retail Floor", description: "Customer-facing stock" },
    ].map((loc) =>
      prisma.location.upsert({
        where: { name: loc.name },
        update: {},
        create: loc,
      }),
    ),
  );

  const supplier = await prisma.supplier.upsert({
    where: { id: "seed-supplier-1" },
    update: {},
    create: {
      id: "seed-supplier-1",
      name: "Acme Supplies Co.",
      email: "orders@acme.example",
      phone: "+1-555-0100",
      leadTimeDays: 5,
    },
  });

  const products = [
    {
      sku: "SKU-001",
      name: "Wireless Mouse",
      description: "Ergonomic wireless mouse",
      categoryId: categories[0].id,
      reorderThreshold: 10,
      unit: "each",
      barcode: "012345678905",
    },
    {
      sku: "SKU-002",
      name: "USB-C Cable",
      description: "2m braided USB-C cable",
      categoryId: categories[0].id,
      reorderThreshold: 25,
      unit: "each",
      barcode: "012345678912",
    },
    {
      sku: "SKU-003",
      name: "Shipping Box (Medium)",
      description: "12x9x6 corrugated box",
      categoryId: categories[2].id,
      reorderThreshold: 50,
      unit: "each",
      barcode: "012345678929",
    },
    {
      sku: "SKU-004",
      name: "Sticky Notes",
      description: "3x3 yellow sticky notes, 12-pack",
      categoryId: categories[1].id,
      reorderThreshold: 15,
      unit: "pack",
      barcode: "012345678936",
    },
  ];

  for (const product of products) {
    const created = await prisma.product.upsert({
      where: { sku: product.sku },
      update: { barcode: product.barcode },
      create: product,
    });

    await prisma.supplierProduct.upsert({
      where: {
        supplierId_productId: {
          supplierId: supplier.id,
          productId: created.id,
        },
      },
      update: {},
      create: {
        supplierId: supplier.id,
        productId: created.id,
      },
    });

    await prisma.stockLevel.upsert({
      where: {
        productId_locationId: {
          productId: created.id,
          locationId: locations[0].id,
        },
      },
      update: {},
      create: {
        productId: created.id,
        locationId: locations[0].id,
        quantityOnHand:
          product.sku === "SKU-001"
            ? 5
            : product.sku === "SKU-002"
              ? 30
              : product.sku === "SKU-003"
                ? 100
                : 8,
      },
    });
  }

  console.log("Seed complete.");
  console.log("Admin:", admin.email, "/ password123");
  console.log("Manager: manager@inventory.local / password123");
  console.log("Viewer: viewer@inventory.local / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
