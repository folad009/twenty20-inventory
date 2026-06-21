import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

export const productCreateSchema = z.object({
  sku: z.string().min(1).max(64),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  categoryId: z.string().cuid().optional().nullable(),
  unit: z.string().min(1).max(32).default("each"),
  barcode: z
    .string()
    .max(128)
    .optional()
    .nullable()
    .transform((value) => {
      const trimmed = value?.trim();
      return trimmed ? trimmed : null;
    }),
  reorderThreshold: z.coerce.number().int().min(0),
  allowBackorder: z.boolean().default(false),
});

export const productUpdateSchema = productCreateSchema.partial().extend({
  id: z.string().cuid(),
});

export const stockAdjustSchema = z.object({
  productId: z.string().cuid(),
  locationId: z.string().cuid(),
  quantity: z.coerce.number().int().refine((n) => n !== 0, "Quantity cannot be zero"),
  reason: z.string().min(1).max(500),
});

export const stockTransferSchema = z
  .object({
    productId: z.string().cuid(),
    fromLocationId: z.string().cuid(),
    toLocationId: z.string().cuid(),
    quantity: z.coerce.number().int().min(1),
    reason: z.string().max(500).optional(),
  })
  .refine((data) => data.fromLocationId !== data.toLocationId, {
    message: "Source and destination must differ",
    path: ["toLocationId"],
  });

export const supplierCreateSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  leadTimeDays: z.coerce.number().int().min(0).default(0),
});

export const supplierUpdateSchema = supplierCreateSchema.partial().extend({
  id: z.string().cuid(),
});

export const poCreateSchema = z.object({
  supplierId: z.string().cuid(),
  locationId: z.string().cuid(),
  notes: z.string().max(1000).optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string().cuid(),
        orderedQuantity: z.coerce.number().int().min(1),
        unitCostCents: z.coerce.number().int().min(0).default(0),
      }),
    )
    .min(1),
});

export const poReceiveSchema = z.object({
  purchaseOrderId: z.string().cuid(),
  items: z
    .array(
      z.object({
        itemId: z.string().cuid(),
        quantity: z.coerce.number().int().min(1),
      }),
    )
    .min(1),
});

export const barcodeLookupSchema = z.object({
  barcode: z.string().trim().min(1).max(128),
});

export const idParamSchema = z.string().cuid();

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type PaginationInput = z.input<typeof paginationSchema>;
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type StockAdjustInput = z.infer<typeof stockAdjustSchema>;
export type StockTransferInput = z.infer<typeof stockTransferSchema>;
export type SupplierCreateInput = z.infer<typeof supplierCreateSchema>;
export type SupplierUpdateInput = z.infer<typeof supplierUpdateSchema>;
export type PoCreateInput = z.infer<typeof poCreateSchema>;
export type PoReceiveInput = z.infer<typeof poReceiveSchema>;
