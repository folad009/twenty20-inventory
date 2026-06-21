"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowLeftRight, Plus } from "lucide-react";
import type { Location } from "@prisma/client";
import type { TransferHistoryItem } from "@/server/services/stockService";
import { PageHeader } from "@/components/shared/page-header";
import { DataPanel, DataTableShell } from "@/components/shared/data-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { TableSkeleton } from "@/components/shared/table-skeleton";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createTransferAction, getTransfersAction } from "@/server/actions/transfers";

type TransfersClientProps = {
  initialData: {
    items: TransferHistoryItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  products: Array<{ id: string; sku: string; name: string }>;
  locations: Location[];
  canMutate: boolean;
};

export function TransfersClient({
  initialData,
  products,
  locations,
  canMutate,
}: TransfersClientProps) {
  const [data, setData] = useState(initialData);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function refresh(page = data.page) {
    startTransition(async () => {
      const result = await getTransfersAction({ page });
      setData(result);
    });
  }

  async function handleCreate(formData: FormData) {
    const result = await createTransferAction({
      productId: String(formData.get("productId")),
      fromLocationId: String(formData.get("fromLocationId")),
      toLocationId: String(formData.get("toLocationId")),
      quantity: Number(formData.get("quantity")),
      reason: String(formData.get("reason") || "") || undefined,
    });

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Transfer completed");
    setOpen(false);
    refresh(1);
  }

  return (
    <div className="page-shell">
      <PageHeader
        title="Transfers"
        description="Move stock between locations with a full audit trail"
        actions={
          canMutate ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button />}>
              <Plus data-icon="inline-start" />
              New transfer
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Transfer stock</DialogTitle>
                <DialogDescription>
                  Decrements source and increments destination in one transaction.
                </DialogDescription>
              </DialogHeader>
              <form action={handleCreate} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="productId">Product</Label>
                  <select
                    id="productId"
                    name="productId"
                    required
                    className="form-select"
                  >
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.sku} — {product.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="fromLocationId">From</Label>
                    <select
                      id="fromLocationId"
                      name="fromLocationId"
                      required
                      className="form-select"
                    >
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="toLocationId">To</Label>
                    <select
                      id="toLocationId"
                      name="toLocationId"
                      required
                      className="form-select"
                    >
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min={1}
                    required
                    defaultValue={1}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="reason">Reason (optional)</Label>
                  <Input
                    id="reason"
                    name="reason"
                    placeholder="e.g. Restock retail floor"
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={pending}>
                    <ArrowLeftRight data-icon="inline-start" />
                    Transfer
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          ) : undefined
        }
      />

      {pending && data.items.length === 0 ? (
        <TableSkeleton columns={6} />
      ) : (
        <DataPanel title="Transfer history" description={`${data.total} transfers`}>
          {data.items.length === 0 ? (
            <EmptyState
              icon={ArrowLeftRight}
              title="No transfers yet"
              description="Move stock between warehouses to see history here."
              className="m-4 border-0 bg-transparent"
            />
          ) : (
            <DataTableShell>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell className="text-muted-foreground">
                        {format(transfer.createdAt, "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">{transfer.product.name}</span>
                          <span className="sku-pill w-fit">{transfer.product.sku}</span>
                        </div>
                      </TableCell>
                      <TableCell>{transfer.fromLocation.name}</TableCell>
                      <TableCell>{transfer.toLocation.name}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {transfer.quantity}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {transfer.user?.name ?? transfer.user?.email ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
