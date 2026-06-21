import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DashboardQuickActionsProps = {
  canMutate: boolean;
};

export function DashboardQuickActions({ canMutate }: DashboardQuickActionsProps) {
  if (!canMutate) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/products" className={cn(buttonVariants({ size: "sm" }))}>
        <Plus data-icon="inline-start" />
        New product
      </Link>
      <Link
        href="/purchase-orders"
        className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
      >
        <ClipboardList data-icon="inline-start" />
        New PO
      </Link>
    </div>
  );
}
