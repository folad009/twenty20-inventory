import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { beforeAll } from "vitest";

loadEnvConfig(process.cwd());

// Services use DATABASE_URL via @/lib/prisma; point them at the test schema when set.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

const databaseUrl =
  process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? "";

function redactDatabaseUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = "***";
    return parsed.toString();
  } catch {
    return "<invalid DATABASE_URL>";
  }
}

async function assertDatabaseReachable() {
  if (!databaseUrl) {
    throw new Error(
      "Set TEST_DATABASE_URL or DATABASE_URL to run integration tests.",
    );
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    throw new Error(
      [
        `PostgreSQL is not reachable at ${redactDatabaseUrl(databaseUrl)}.`,
        "",
        "With Neon (no Docker): set DATABASE_URL in .env, then:",
        "  npm run db:migrate:deploy",
        '  TEST_DATABASE_URL="<same-url>&schema=integration_test" npm run db:migrate:deploy',
        "  npm run test:integration",
        "",
        "With local Postgres:",
        "  npm run db:up   # requires Docker",
        "  npm run db:migrate",
      ].join("\n"),
    );
  } finally {
    await prisma.$disconnect();
  }
}

beforeAll(assertDatabaseReachable, 30_000);

export const integrationEnabled = Boolean(databaseUrl);
