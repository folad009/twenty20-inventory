# Query index audit

Run against a migrated database:

```bash
npm run db:explain
```

## Queries verified

| Query | Expected index |
|-------|----------------|
| `stock_levels` lock by `product_id` + `location_id` | `stock_levels_product_id_location_id_key` (unique) |
| `purchase_orders` filter `status`, order `created_at` | `purchase_orders_status_created_at_idx` |
| `stock_movements` transfer history (`type`, `created_at`) | `stock_movements_type_created_at_idx` |
| `products` lookup by `barcode` | `products_barcode_key` (unique) |
| `stock_movements` pair lookup by `reference_id` | `stock_movements_reference_id_idx` |

The script uses `EXPLAIN (FORMAT JSON)` and fails if the plan does not reference the expected index name.
