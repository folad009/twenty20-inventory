"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Truck } from "lucide-react";
import type { Supplier } from "@prisma/client";
import { PageHeader } from "@/components/shared/page-header";
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
import { LeadTimeBadge, CountBadge } from "@/components/shared/status-badges";
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
import { createSupplierAction } from "@/server/actions/suppliers";

type SupplierRow = Supplier & {
  _count: { supplierProducts: number; purchaseOrders: number };
};

type SuppliersClientProps = {
  initialData: {
    items: SupplierRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  canMutate: boolean;
};

export function SuppliersClient({ initialData, canMutate }: SuppliersClientProps) {
  const [data, setData] = useState(initialData);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function refresh() {
    startTransition(async () => {
      const { getSuppliersAction } = await import("@/server/actions/suppliers");
      const result = await getSuppliersAction({ page: data.page });
      setData(result as typeof initialData);
    });
  }

  async function handleCreate(formData: FormData) {
    const result = await createSupplierAction({
      name: String(formData.get("name")),
      email: String(formData.get("email") || "") || null,
      phone: String(formData.get("phone") || "") || null,
      address: String(formData.get("address") || "") || null,
      leadTimeDays: Number(formData.get("leadTimeDays") ?? 0),
    });

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Supplier created");
    setOpen(false);
    refresh();
  }

  const addButton = canMutate ? (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus data-icon="inline-start" />
        Add supplier
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New supplier</DialogTitle>
          <DialogDescription>Add a vendor for purchase orders.</DialogDescription>
        </DialogHeader>
        <form action={handleCreate} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="leadTimeDays">Lead time (days)</Label>
            <Input
              id="leadTimeDays"
              name="leadTimeDays"
              type="number"
              min={0}
              defaultValue={0}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              Create supplier
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  ) : null;

  return (
    <div className="page-shell">
      <PageHeader
        title="Suppliers"
        description="Vendor contacts and lead times"
        actions={addButton}
      />

      {pending ? (
        <TableSkeleton columns={5} />
      ) : (
        <DataPanel title="Suppliers" description={`${data.total} vendors`}>
          {data.items.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No suppliers yet"
              description="Add vendors to create purchase orders."
              action={addButton}
              className="m-4 border-0 bg-transparent"
            />
          ) : (
            <DataTableShell label="Suppliers">
              <DataTable minWidth={640}>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="th-numeric">Lead time</TableHead>
                    <TableHead className="th-numeric">Products</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="max-w-[160px] truncate font-medium">
                        {supplier.name}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-muted-foreground">
                        {supplier.email ?? "—"}
                      </TableCell>
                      <TableCell className="data-mono text-muted-foreground">
                        {supplier.phone ?? "—"}
                      </TableCell>
                      <TableCell className="td-numeric">
                        <div className="flex justify-end">
                          <LeadTimeBadge days={supplier.leadTimeDays} />
                        </div>
                      </TableCell>
                      <TableCell className="td-numeric">
                        <div className="flex justify-end">
                          <CountBadge count={supplier._count.supplierProducts} />
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
