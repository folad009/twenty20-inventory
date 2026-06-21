# 20Twenty Inventory App

Inventory management MVP for small teams — products, stock, suppliers, purchase orders, and low-stock alerts.

## Stack

- Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- PostgreSQL + Prisma
- Auth.js (credentials) with role-based access (`ADMIN`, `MANAGER`, `VIEWER`)
- Zod validation + Server Actions → `server/services/`

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string for the app and Prisma migrations. |
| `TEST_DATABASE_URL` | For tests | Separate database for integration tests (recommended). Falls back to `DATABASE_URL` if unset. |
| `AUTH_SECRET` | Yes | Secret for signing Auth.js session tokens. Generate with `openssl rand -base64 32`. |
| `AUTH_URL` | Yes | Canonical app URL (e.g. `http://localhost:3000`). Used by Auth.js for callbacks. |
| `NODE_ENV` | No | `development`, `test`, or `production`. |

Copy the template and fill in values:

```bash
cp .env.example .env
```

Example `DATABASE_URL`:

```
postgresql://inventory:inventory@localhost:5432/inventory_dev?schema=public
```

**Production notes**

- Use strong, unique `AUTH_SECRET` — never commit `.env` to version control.
- Point `DATABASE_URL` at a managed PostgreSQL instance with TLS.
- Set `AUTH_URL` to your public HTTPS origin.
- Prefer a dedicated `TEST_DATABASE_URL` so integration tests never touch dev data.

## Quick start

### 1. Start PostgreSQL

```bash
docker compose up -d
```

Connection: `postgresql://inventory:inventory@localhost:5432/inventory_dev`

### 2. Environment

```bash
cp .env.example .env
# Set AUTH_SECRET (e.g. openssl rand -base64 32)
```

### 3. Database

```bash
npm install
npm run db:migrate
npm run db:seed
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo accounts (after seed)

| Role    | Email                     | Password     |
|---------|---------------------------|--------------|
| Admin   | admin@inventory.local     | password123  |
| Manager | manager@inventory.local   | password123  |
| Viewer  | viewer@inventory.local    | password123  |

### Health check

```bash
curl http://localhost:3000/api/health
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run test` | Run all Vitest tests |
| `npm run test:integration` | Stock/PO integration tests (requires DB) |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Prisma Studio |
| `npm run db:explain` | `EXPLAIN` audit for critical query indexes |

## Testing

Integration tests need PostgreSQL. **You do not need Docker** if you use a hosted database (e.g. [Neon](https://neon.tech)).

### Neon (no Docker)

```bash
# 1. Put your Neon connection string in .env as DATABASE_URL
# 2. Add a test URL — same credentials, **direct** host (not `-pooler`), separate schema:
#    TEST_DATABASE_URL="postgresql://...@ep-xxx.region.aws.neon.tech/neondb?sslmode=require&schema=integration_test"

npm run db:migrate:deploy      # migrate dev (public schema)
npm run db:migrate:test        # migrate test schema
npm run test:integration
```

### Local Postgres (Docker)

```bash
npm run db:up
npm run db:migrate
createdb inventory_test
TEST_DATABASE_URL=postgresql://inventory:inventory@localhost:5432/inventory_test?schema=public npm run db:migrate
npm run test:integration
```

### Troubleshooting

| Error | Fix |
| --- | --- |
| `Can't reach database server at localhost:5432` | Your `.env` still points at localhost — use Neon or start local Postgres |
| `relation "..." does not exist` | Run `npm run db:migrate:deploy` and `npm run db:migrate:test` |

## Security (Server Actions)

All protected Server Actions:

1. Call `requireAuth()` (read) or `requireRole(...)` (mutations)
2. Validate inputs with Zod at the action boundary (`parseId`, `parsePagination`, service schemas)
3. Delegate business logic to `server/services/`

Public actions: `loginAction` (Zod-validated credentials only).

## Architecture

See [AGENTS.md](./AGENTS.md) for data-integrity rules (stock transactions, PO receive idempotency, RBAC).
