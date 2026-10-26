"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Archive, Package, Pencil, Plus } from "lucide-react";
import type { Category, Product, ProductType, SizeUnit } from "@prisma/client";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { DataPanel, DataTableShell } from "@/components/shared/data-panel";
import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { ReorderBadge, CategoryBadge } from "@/components/shared/status-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createProductAction,
  updateProductAction,
  archiveProductAction,
} from "@/server/actions/products";

type ProductWithCategory = Omit<Product, "sizeValue"> & {
  sizeValue: string | null;
  category: Category | null;
};

const TYPE_LABELS: Record<ProductType, string> = {
  INDOOR: "Indoor",
  OUTDOOR: "Outdoor",
};

const SIZE_UNIT_LABELS: Record<SizeUnit, string> = {
  METERS: "Meters",
  FT: "Ft",
  KG: "KG",
  INCHES: "Inches",
};

function toDateInputValue(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatProductDate(value: Date | string | null | undefined) {
  const input = toDateInputValue(value);
  if (!input) return "—";
  const [year, month, day] = input.split("-").map(Number);
  return format(new Date(year, month - 1, day), "MMM d, yyyy");
}

function formatSize(value: string | null, unit: SizeUnit | null) {
  if (!value || !unit) return "—";
  const numeric = Number(value);
  const amount = Number.isFinite(numeric) ? String(numeric) : value;
  return `${amount} ${SIZE_UNIT_LABELS[unit]}`;
}

type ProductsClientProps = {
  initialData: {
    items: ProductWithCategory[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  categories: Category[];
  canMutate: boolean;
};

export function ProductsClient({
  initialData,
  categories,
  canMutate,
}: ProductsClientProps) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductWithCategory | null>(null);
  const [pending, startTransition] = useTransition();

  function refresh(page = data.page) {
    startTransition(async () => {
      const { getProductsAction } = await import("@/server/actions/products");
      const result = await getProductsAction({ page, search: search || undefined });
      setData(result as typeof initialData);
    });
  }

  async function handleSubmit(formData: FormData) {
    const payload = {
      sku: String(formData.get("sku") ?? ""),
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? "") || undefined,
      categoryId: String(formData.get("categoryId") ?? "") || null,
      unit: String(formData.get("unit") ?? "each"),
      barcode: String(formData.get("barcode") ?? "") || null,
      reorderThreshold: Number(formData.get("reorderThreshold") ?? 0),
      allowBackorder: formData.get("allowBackorder") === "on",
      manufacturer: String(formData.get("manufacturer") ?? ""),
      productDate: new Date(String(formData.get("productDate") ?? "")),
      pitch: String(formData.get("pitch") ?? ""),
      type: String(formData.get("type") ?? "") as "INDOOR" | "OUTDOOR",
      sizeUnit: String(formData.get("sizeUnit") ?? "") as
        | "METERS"
        | "FT"
        | "KG"
        | "INCHES",
      sizeValue: Number(formData.get("sizeValue") ?? ""),
    };

    const result = editing
      ? await updateProductAction({ id: editing.id, ...payload })
      : await createProductAction(payload);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(editing ? "Product updated" : "Product created");
    setOpen(false);
    setEditing(null);
    refresh();
  }

  async function handleArchive(id: string) {
    const result = await archiveProductAction(id);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Product archived");
    refresh();
  }

  const addProductButton = canMutate ? (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) setEditing(null);
      }}
    >
      <DialogTrigger render={<Button />}>
        <Plus data-icon="inline-start" />
        Add product
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit product" : "New product"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update product details." : "Create a new inventory SKU."}
          </DialogDescription>
        </DialogHeader>
        <form
          key={editing?.id ?? "new"}
          action={handleSubmit}
          className="flex flex-col gap-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" required defaultValue={editing?.sku} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required defaultValue={editing?.name} />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editing?.description ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="categoryId">Category</Label>
              <select
                id="categoryId"
                name="categoryId"
                defaultValue={editing?.categoryId ?? ""}
                className="form-select"
              >
                <option value="">None</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" name="unit" defaultValue={editing?.unit ?? "each"} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="reorderThreshold">Reorder threshold</Label>
              <Input
                id="reorderThreshold"
                name="reorderThreshold"
                type="number"
                min={0}
                defaultValue={editing?.reorderThreshold ?? 0}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                name="barcode"
                defaultValue={editing?.barcode ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                name="manufacturer"
                required
                maxLength={255}
                defaultValue={editing?.manufacturer ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="productDate">Date</Label>
              <Input
                id="productDate"
                name="productDate"
                type="date"
                required
                defaultValue={toDateInputValue(editing?.productDate)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pitch">Pitch</Label>
              <Input
                id="pitch"
                name="pitch"
                required
                maxLength={32}
                placeholder="2.5"
                defaultValue={editing?.pitch ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                name="type"
                required
                defaultValue={editing?.type ?? ""}
                className="form-select"
              >
                <option value="" disabled>
                  Select type
                </option>
                <option value="INDOOR">Indoor</option>
                <option value="OUTDOOR">Outdoor</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sizeValue">Number</Label>
              <Input
                id="sizeValue"
                name="sizeValue"
                type="number"
                required
                min={0.0001}
                step="any"
                defaultValue={editing?.sizeValue ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sizeUnit">Size</Label>
              <select
                id="sizeUnit"
                name="sizeUnit"
                required
                defaultValue={editing?.sizeUnit ?? ""}
                className="form-select"
              >
                <option value="" disabled>
                  Select size
                </option>
                <option value="METERS">Meters</option>
                <option value="FT">Ft</option>
                <option value="KG">KG</option>
                <option value="INCHES">Inches</option>
              </select>
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                id="allowBackorder"
                name="allowBackorder"
                type="checkbox"
                defaultChecked={editing?.allowBackorder}
              />
              <Label htmlFor="allowBackorder">Allow backorder</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {editing ? "Save changes" : "Create product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  ) : null;

  return (
    <div className="page-shell">
      <PageHeader
        title="Products"
        description="SKU catalog · reorder thresholds"
        actions={addProductButton}
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        onSearch={() => refresh(1)}
        placeholder="Search by SKU, name, manufacturer, or pitch…"
        pending={pending}
      />

      {pending && data.items.length === 0 ? (
        <TableSkeleton columns={canMutate ? 11 : 10} />
      ) : (
        <DataPanel
          title="Product catalog"
          description={`${data.total} active SKUs`}
        >
          {data.items.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No products found"
              description={
                search
                  ? "Try a different search term or clear the filter."
                  : "Add your first product to start tracking inventory."
              }
              action={canMutate ? addProductButton : undefined}
              className="m-4 border-0 bg-transparent"
            />
          ) : (
            <DataTableShell label="Product catalog">
              <DataTable minWidth={1180}>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Manufacturer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Pitch</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="th-numeric">Unit</TableHead>
                    <TableHead className="th-numeric">Reorder at</TableHead>
                    {canMutate ? (
                      <TableHead className="th-numeric">Actions</TableHead>
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <span className="sku-pill">{product.sku}</span>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate">
                        {product.manufacturer ?? "—"}
                      </TableCell>
                      <TableCell>{formatProductDate(product.productDate)}</TableCell>
                      <TableCell>{product.pitch ?? "—"}</TableCell>
                      <TableCell>
                        {product.type ? TYPE_LABELS[product.type] : "—"}
                      </TableCell>
                      <TableCell>{formatSize(product.sizeValue, product.sizeUnit)}</TableCell>
                      <TableCell>
                        {product.category ? (
                          <CategoryBadge name={product.category.name} />
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="td-numeric text-muted-foreground">
                        {product.unit}
                      </TableCell>
                      <TableCell className="td-numeric">
                        <div className="flex justify-end">
                          <ReorderBadge threshold={product.reorderThreshold} />
                        </div>
                      </TableCell>
                      {canMutate ? (
                        <TableCell className="td-numeric">
                          <div className="flex justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => {
                                      setEditing(product);
                                      setOpen(true);
                                    }}
                                  />
                                }
                              >
                                <Pencil />
                              </TooltipTrigger>
                              <TooltipContent>Edit product</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => handleArchive(product.id)}
                                  />
                                }
                              >
                                <Archive />
                              </TooltipTrigger>
                              <TooltipContent>Archive product</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            </DataTableShell>
          )}
        </DataPanel>
      )}

      {data.totalPages > 1 ? (
        <PaginationBar
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          pending={pending}
          onPrevious={() => refresh(data.page - 1)}
          onNext={() => refresh(data.page + 1)}
        />
      ) : null}
    </div>
  );
}
