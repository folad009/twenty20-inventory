import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { canMutate } from "@/lib/auth-utils";
import { Role } from "@prisma/client";
import { getPurchaseOrderAction } from "@/server/actions/purchase-orders";
import { PurchaseOrderDetailClient } from "@/components/purchase-orders/purchase-order-detail-client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const role = (session?.user?.role as Role) ?? Role.VIEWER;
  const po = await getPurchaseOrderAction(id);

  if (!po) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/purchase-orders"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit")}
      >
        ← Back to purchase orders
      </Link>
      <PurchaseOrderDetailClient po={po} canMutate={canMutate(role)} />
    </div>
  );
}
