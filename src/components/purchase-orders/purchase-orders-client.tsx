"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ClipboardList, Plus } from "lucide-react";
import type { PurchaseOrder, Supplier, Location, User } from "@prisma/client";
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
import { PoStatusBadge, CountBadge } from "@/components/shared/status-badges";
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
import { createPurchaseOrderAction } from "@/server/actions/purchase-orders";
import { format } from "date-fns";

type PoRow = PurchaseOrder & {
  supplier: Supplier;
  location: Location;
  createdBy: Pick<User, "name" | "email">;
  _count: { items: number };
};

type PurchaseOrdersClientProps = {
  initialData: {
    items: PoRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  formData: {
    suppliers: Array<{ id: string; name: string }>;
    locations: Array<{ id: string; name: string }>;
    products: Array<{ id: string; sku: string; name: string; unit: string }>;
  };
  canMutate: boolean;
};

export function PurchaseOrdersClient({
  initialData,
  formData,
  canMutate,
}: PurchaseOrdersClientProps) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [lineProductId, setLineProductId] = useState(formData.products[0]?.id ?? "");
  const [lineQty, setLineQty] = useState(1);
  const [lines, setLines] = useState<
    Array<{ productId: string; orderedQuantity: number; unitCostCents: number }>
  >([]);

  function refresh(page = data.page) {
    startTransition(async () => {
      const { getPurchaseOrdersAction } = await import(
        "@/server/actions/purchase-orders"
      );
      const result = await getPurchaseOrdersAction({
        page,
        search: search || undefined,
      });
      setData(result as typeof initialData);
    });
  }

  function addLine() {
    if (!lineProductId || lineQty < 1) return;
    setLines((prev) => [
      ...prev,
      { productId: lineProductId, orderedQuantity: lineQty, unitCostCents: 0 },
    ]);
    setLineQty(1);
  }

  async function handleCreate(formDataSubmit: FormData) {
    if (lines.length === 0) {
      toast.error("Add at least one line item");
      return;
    }

    const result = await createPurchaseOrderAction({
      supplierId: String(formDataSubmit.get("supplierId")),
      locationId: String(formDataSubmit.get("locationId")),
      notes: String(formDataSubmit.get("notes") || "") || null,
      items: lines,
    });

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Purchase order created");
    setOpen(false);
    setLines([]);
    refresh();
  }

  const newPoButton = canMutate ? (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus data-icon="inline-start" />
        New PO
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create purchase order</DialogTitle>
          <DialogDescription>
            Draft PO with line items. Submit when ready to order.
          </DialogDescription>
        </DialogHeader>
        <form action={handleCreate} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="supplierId">Supplier</Label>
              <select id="supplierId" name="supplierId" required className="form-select">
                {formData.suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="locationId">Receive location</Label>
              <select id="locationId" name="locationId" required className="form-select">
                {formData.locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" name="notes" />
          </div>
          <div className="rounded-md border border-border bg-muted/20 p-3">
            <p className="mb-2 font-mono text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Line items
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={lineProductId}
                onChange={(e) => setLineProductId(e.target.value)}
                className="form-select flex-1"
              >
                {formData.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} — {p.name}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                min={1}
                value={lineQty}
                onChange={(e) => setLineQty(Number(e.target.value))}
                className="w-24"
              />
              <Button type="button" variant="secondary" onClick={addLine}>
                Add
              </Button>
            </div>
            {lines.length > 0 ? (
              <ul className="mt-2 flex flex-col gap-1 font-mono text-xs text-muted-foreground">
                {lines.map((line, i) => {
                  const product = formData.products.find((p) => p.id === line.productId);
                  return (
                    <li key={`${line.productId}-${i}`}>
                      {product?.sku} × {line.orderedQuantity}
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              Create draft PO
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  ) : null;

  return (
    <div className="page-shell">
      <PageHeader
        title="Purchase Orders"
        description="Procurement · receive · close"
        actions={newPoButton}
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        onSearch={() => refresh(1)}
        placeholder="Search PO number or supplier…"
        pending={pending}
      />

      {pending && data.items.length === 0 ? (
        <TableSkeleton columns={6} />
      ) : (
        <DataPanel title="All purchase orders" description={`${data.total} records`}>
          {data.items.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No purchase orders"
              description="Create a draft PO to start replenishing stock."
              action={newPoButton}
              className="m-4 border-0 bg-transparent"
            />
          ) : (
            <DataTableShell label="Purchase orders">
              <DataTable minWidth={760}>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="th-numeric">Created</TableHead>
                    <TableHead className="th-numeric">Lines</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell>
                        <Link href={`/purchase-orders/${po.id}`} className="po-number">
                          {po.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate">
                        {po.supplier.name}
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate">
                        {po.location.name}
                      </TableCell>
                      <TableCell>
                        <PoStatusBadge status={po.status} />
                      </TableCell>
                      <TableCell className="td-numeric text-muted-foreground">
                        {format(po.createdAt, "yyyy-MM-dd")}
                      </TableCell>
                      <TableCell className="td-numeric">
                        <div className="flex justify-end">
                          <CountBadge count={po._count.items} />
                        </div>
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
