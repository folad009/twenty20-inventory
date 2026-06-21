/**
 * Verifies critical queries use expected indexes via PostgreSQL EXPLAIN.
 * Run: npm run db:explain (requires DATABASE_URL and migrated schema)
 */
import { PrismaClient } from "@prisma/client";

type ExplainRow = {
  "QUERY PLAN": Array<Record<string, unknown>>;
};

const prisma = new PrismaClient();

const checks: Array<{
  name: string;
  sql: string;
  expectIndex?: string;
}> = [
  {
    name: "stock_levels row lock (product + location)",
    sql: `
      EXPLAIN (FORMAT JSON)
      SELECT id, quantity_on_hand, quantity_reserved
      FROM stock_levels
      WHERE product_id = 'cltest00000000000000000001'
        AND location_id = 'cltest00000000000000000002'
      FOR UPDATE
    `,
    expectIndex: "stock_levels_product_id_location_id_key",
  },
  {
    name: "purchase_orders by status + created_at",
    sql: `
      EXPLAIN (FORMAT JSON)
      SELECT id FROM purchase_orders
      WHERE status = 'ORDERED'
      ORDER BY created_at DESC
      LIMIT 20
    `,
    expectIndex: "purchase_orders_status_created_at_idx",
  },
  {
    name: "stock_movements transfers history",
    sql: `
      EXPLAIN (FORMAT JSON)
      SELECT id FROM stock_movements
      WHERE type = 'TRANSFER_OUT' AND reference_id IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 20
    `,
    expectIndex: "stock_movements_type_created_at_idx",
  },
  {
    name: "product lookup by barcode",
    sql: `
      EXPLAIN (FORMAT JSON)
      SELECT id FROM products
      WHERE barcode = '012345678905' AND archived_at IS NULL
    `,
    expectIndex: "products_barcode_key",
  },
  {
    name: "stock_movements by reference_id",
    sql: `
      EXPLAIN (FORMAT JSON)
      SELECT id FROM stock_movements
      WHERE reference_id = '00000000-0000-0000-0000-000000000001'
        AND type = 'TRANSFER_IN'
    `,
    expectIndex: "stock_movements_reference_id_idx",
  },
];

function planUsesIndex(plan: unknown, indexName: string): boolean {
  const json = JSON.stringify(plan);
  return json.includes(indexName);
}

async function main() {
  console.log("Index EXPLAIN audit\n");

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    try {
      const result = await prisma.$queryRawUnsafe<ExplainRow[]>(check.sql);
      const plan = result[0]?.["QUERY PLAN"];
      const usesIndex =
        !check.expectIndex || planUsesIndex(plan, check.expectIndex);

      if (usesIndex) {
        console.log(`✓ ${check.name}`);
        if (check.expectIndex) {
          console.log(`  uses index: ${check.expectIndex}`);
        }
        passed += 1;
      } else {
        console.log(`✗ ${check.name}`);
        console.log(`  expected index: ${check.expectIndex}`);
        console.log(`  plan: ${JSON.stringify(plan, null, 2)}`);
        failed += 1;
      }
    } catch (error) {
      console.log(`✗ ${check.name} (error)`);
      console.log(`  ${error instanceof Error ? error.message : error}`);
      failed += 1;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main();
