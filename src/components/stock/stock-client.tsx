"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Warehouse } from "lucide-react";
import type { Category, Location, Product, StockLevel } from "@prisma/client";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
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
import { StockStatusBadge } from "@/components/shared/status-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { adjustStockAction } from "@/server/actions/stock";

type StockLevelRow = StockLevel & {
  product: Product & { category: Category | null };
  location: Location;
};

type StockClientProps = {
  initialLevels: {
    items: StockLevelRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  products: Array<{ id: string; sku: string; name: string }>;
  locations: Location[];
  canMutate: boolean;
};

export function StockClient({
  initialLevels,
  products,
  locations,
  canMutate,
}: StockClientProps) {
  const [levels, setLevels] = useState(initialLevels);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function refresh(page = levels.page) {
    startTransition(async () => {
      const { getStockLevelsAction } = await import("@/server/actions/stock");
      const result = await getStockLevelsAction({ page, search: search || undefined });
      setLevels(result as typeof initialLevels);
    });
  }

  async function handleAdjust(formData: FormData) {
    const quantity = Number(formData.get("quantity"));
    const result = await adjustStockAction({
      productId: String(formData.get("productId")),
      locationId: String(formData.get("locationId")),
      quantity,
      reason: String(formData.get("reason")),
    });

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Stock adjusted");
    setOpen(false);
    refresh();
  }

  const adjustButton = canMutate ? (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus data-icon="inline-start" />
        Adjust stock
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Stock adjustment</DialogTitle>
          <DialogDescription>
            Positive values add stock; negative values remove stock.
          </DialogDescription>
        </DialogHeader>
        <form action={handleAdjust} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="productId">Product</Label>
            <select id="productId" name="productId" required className="form-select">
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="locationId">Location</Label>
            <select id="locationId" name="locationId" required className="form-select">
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="quantity">Quantity change</Label>
            <Input id="quantity" name="quantity" type="number" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reason">Reason</Label>
            <Input id="reason" name="reason" required />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              Apply adjustment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  ) : null;

  return (
    <div className="page-shell">
      <PageHeader
        title="Stock"
        description="Levels by location and manual adjustments"
        actions={adjustButton}
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        onSearch={() => refresh(1)}
        placeholder="Search products…"
        pending={pending}
      />

      {pending && levels.items.length === 0 ? (
        <TableSkeleton columns={5} />
      ) : (
        <DataPanel
          title="Stock levels"
          description={`${levels.total} location rows`}
        >
          {levels.items.length === 0 ? (
            <EmptyState
              icon={Warehouse}
              title="No stock levels"
              description="Adjust stock or receive a purchase order to create levels."
              className="m-4 border-0 bg-transparent"
            />
          ) : (
            <DataTableShell label="Stock levels">
              <DataTable minWidth={680}>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="th-numeric">On hand</TableHead>
                    <TableHead className="th-numeric">Reserved</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {levels.items.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="max-w-[180px] truncate font-medium">
                            {row.product.name}
                          </span>
                          <span className="sku-pill w-fit">{row.product.sku}</span>
                        </div>
                      </TableCell>
                      <TableCell>{row.location.name}</TableCell>
                      <TableCell className="td-numeric">{row.quantityOnHand}</TableCell>
                      <TableCell className="td-numeric text-muted-foreground">
                        {row.quantityReserved}
                      </TableCell>
                      <TableCell>
                        <StockStatusBadge
                          quantity={row.quantityOnHand}
                          threshold={row.product.reorderThreshold}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            </DataTableShell>
          )}
        </DataPanel>
      )}
    </div>
  );
}
