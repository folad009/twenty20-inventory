import { PurchaseOrderStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

const poStatusClass: Record<PurchaseOrderStatus, string> = {
  DRAFT: "border-border bg-muted text-muted-foreground",
  ORDERED: "border-accent-brand/30 bg-accent-brand/10 text-accent-brand",
  PARTIALLY_RECEIVED: "border-warning-foreground/25 bg-warning text-warning-foreground",
  RECEIVED: "border-status-healthy-foreground/25 bg-status-healthy text-status-healthy-foreground",
  CLOSED: "border-border bg-secondary text-secondary-foreground",
};

export function PoStatusBadge({ status }: { status: PurchaseOrderStatus }) {
  return (
    <span className={cn("status-pill normal-case", poStatusClass[status])}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function StockStatusBadge({
  quantity,
  threshold,
}: {
  quantity: number;
  threshold: number;
}) {
  if (quantity === 0) {
    return <span className="status-pill status-pill-out">Out of stock</span>;
  }
  if (threshold > 0 && quantity <= threshold) {
    return <span className="status-pill status-pill-low">Low stock</span>;
  }
  return <span className="status-pill status-pill-healthy">In stock</span>;
}

export function RoleBadge({ role }: { role: string }) {
  return (
    <span className="status-pill border-border bg-muted text-muted-foreground normal-case">
      {role}
    </span>
  );
}

export function ReorderBadge({ threshold }: { threshold: number }) {
  if (threshold <= 0) {
    return <span className="status-pill status-pill-neutral">No threshold</span>;
  }
  return <span className="reorder-pill">≤ {threshold}</span>;
}

export function CategoryBadge({ name }: { name: string }) {
  return (
    <span className="status-pill status-pill-neutral normal-case">{name}</span>
  );
}

export function LeadTimeBadge({ days }: { days: number }) {
  if (days <= 0) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }
  return (
    <span className="status-pill status-pill-neutral normal-case">{days}d lead</span>
  );
}

export function CountBadge({ count }: { count: number }) {
  return (
    <span className="status-pill border-accent-brand/25 bg-accent-brand/10 font-mono text-accent-brand normal-case tabular-nums">
      {count}
    </span>
  );
}

export function LineReceiveBadge({ remaining }: { remaining: number }) {
  if (remaining === 0) {
    return <span className="status-pill status-pill-healthy normal-case">Received</span>;
  }
  return (
    <span className="status-pill status-pill-low normal-case">{remaining} left</span>
  );
}
