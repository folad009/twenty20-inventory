"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type {
  PurchaseOrder,
  PurchaseOrderItem,
  Product,
  Supplier,
  Location,
  User,
} from "@prisma/client";
import {
  submitPurchaseOrderAction,
  receivePurchaseOrderAction,
  closePurchaseOrderAction,
} from "@/server/actions/purchase-orders";
import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shared/data-table";
import { PoStatusBadge, LineReceiveBadge } from "@/components/shared/status-badges";
import { PageHeader } from "@/components/shared/page-header";
import { DataPanel, DataTableShell } from "@/components/shared/data-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PoDetail = PurchaseOrder & {
  supplier: Supplier;
  location: Location;
  createdBy: Pick<User, "name" | "email">;
  items: Array<PurchaseOrderItem & { product: Product }>;
};

export function PurchaseOrderDetailClient({
  po,
  canMutate,
}: {
  po: PoDetail;
  canMutate: boolean;
}) {
  const router = useRouter();
  const [receiveQty, setReceiveQty] = useState<Record<string, number>>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit() {
    setPending(true);
    const result = await submitPurchaseOrderAction(po.id);
    setPending(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("PO submitted");
    router.refresh();
  }

  async function handleReceive() {
    const items = po.items
      .map((item) => ({
        itemId: item.id,
        quantity: receiveQty[item.id] ?? 0,
      }))
      .filter((item) => item.quantity > 0);

    if (items.length === 0) {
      toast.error("Enter quantities to receive");
      return;
    }

    setPending(true);
    const result = await receivePurchaseOrderAction({
      purchaseOrderId: po.id,
      items,
    });
    setPending(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Stock received");
    router.refresh();
  }

  async function handleClose() {
    setPending(true);
    const result = await closePurchaseOrderAction(po.id);
    setPending(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("PO closed");
    router.refresh();
  }

  const canSubmit = po.status === "DRAFT";
  const canReceive = po.status === "ORDERED" || po.status === "PARTIALLY_RECEIVED";
  const canClose =
    po.status === "RECEIVED" || po.status === "PARTIALLY_RECEIVED";

  return (
    <div className="page-shell">
      <PageHeader
        title={po.orderNumber}
        description={`${po.supplier.name} → ${po.location.name}`}
        badge={<PoStatusBadge status={po.status} />}
        className="[&_.page-header-title]:font-mono [&_.page-header-title]:text-accent-brand"
        actions={
          canMutate ? (
            <div className="flex flex-wrap gap-2">
              {canSubmit ? (
                <Button onClick={handleSubmit} disabled={pending}>
                  Submit order
                </Button>
              ) : null}
              {canReceive ? (
                <Button onClick={handleReceive} disabled={pending}>
                  Receive selected
                </Button>
              ) : null}
              {canClose ? (
                <Button variant="outline" onClick={handleClose} disabled={pending}>
                  Close PO
                </Button>
              ) : null}
            </div>
          ) : undefined
        }
      />

      <DataPanel
        title="Line items"
        description="Ordered vs received quantities"
      >
        <DataTableShell label="PO line items">
          <DataTable minWidth={640}>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="th-numeric">Ordered</TableHead>
                <TableHead className="th-numeric">Received</TableHead>
                <TableHead className="th-numeric">Remaining</TableHead>
                {canMutate && canReceive ? (
                  <TableHead className="th-numeric">Receive now</TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {po.items.map((item) => {
                const remaining = item.orderedQuantity - item.receivedQuantity;
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{item.product.name}</span>
                        <span className="sku-pill w-fit">{item.product.sku}</span>
                      </div>
                    </TableCell>
                    <TableCell className="td-numeric">{item.orderedQuantity}</TableCell>
                    <TableCell className="td-numeric">{item.receivedQuantity}</TableCell>
                    <TableCell className="td-numeric">
                      <div className="flex flex-col items-end gap-1">
                        <span>{remaining}</span>
                        <LineReceiveBadge remaining={remaining} />
                      </div>
                    </TableCell>
                    {canMutate && canReceive && (
                      <TableCell className="td-numeric">
                        {remaining > 0 ? (
                          <Input
                            type="number"
                            min={0}
                            max={remaining}
                            className="ml-auto w-24"
                            value={receiveQty[item.id] ?? ""}
                            onChange={(e) =>
                              setReceiveQty((prev) => ({
                                ...prev,
                                [item.id]: Number(e.target.value),
                              }))
                            }
                          />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </DataTable>
        </DataTableShell>
      </DataPanel>
    </div>
  );
}
