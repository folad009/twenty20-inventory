"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Archive, Package, Pencil, Plus } from "lucide-react";
import type { Category, Product } from "@prisma/client";
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

type ProductWithCategory = Product & { category: Category | null };

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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit product" : "New product"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update product details." : "Create a new inventory SKU."}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
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
        placeholder="Search by SKU or name…"
        pending={pending}
      />

      {pending && data.items.length === 0 ? (
        <TableSkeleton columns={canMutate ? 6 : 5} />
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
              <DataTable minWidth={720}>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Name</TableHead>
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
