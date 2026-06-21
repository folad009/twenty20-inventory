import { formatDistanceToNow } from "date-fns";
import type { Location, Product, StockMovement } from "@prisma/client";
import type { StockMovementType } from "@prisma/client";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Package,
  Truck,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

type MovementRow = StockMovement & {
  product: Product;
  location: Location;
};

type DashboardMovementsFeedProps = {
  movements: MovementRow[];
};

const movementMeta: Record<
  StockMovementType,
  { label: string; icon: typeof Package; className: string }
> = {
  ADJUSTMENT_IN: {
    label: "Adjustment in",
    icon: ArrowDownLeft,
    className: "border-status-healthy-foreground/30 bg-status-healthy text-status-healthy-foreground",
  },
  ADJUSTMENT_OUT: {
    label: "Adjustment out",
    icon: ArrowUpRight,
    className: "border-status-out-foreground/30 bg-status-out text-status-out-foreground",
  },
  PO_RECEIVE: {
    label: "PO receive",
    icon: Truck,
    className: "border-accent-brand/40 bg-accent-brand/15 text-accent-brand",
  },
  TRANSFER_IN: {
    label: "Transfer in",
    icon: ArrowDownLeft,
    className: "border-status-healthy-foreground/30 bg-status-healthy text-status-healthy-foreground",
  },
  TRANSFER_OUT: {
    label: "Transfer out",
    icon: ArrowLeftRight,
    className: "border-warning-foreground/30 bg-warning text-warning-foreground",
  },
};

export function DashboardMovementsFeed({ movements }: DashboardMovementsFeedProps) {
  return (
    <section className="data-panel">
      <div className="data-panel-header">
        <h2 className="font-heading text-sm font-semibold tracking-tight text-foreground">
          Recent movements
        </h2>
        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
          Live feed · latest inventory changes
        </p>
      </div>

      {movements.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No movements yet"
          description="Stock adjustments, transfers, and PO receipts will appear here."
          className="m-4 border-0 bg-transparent"
        />
      ) : (
        <div className="relative p-4 md:p-5">
          <div
            className="absolute top-5 bottom-5 left-[22px] w-px bg-border md:left-[26px]"
            aria-hidden
          />
          <ul className="flex flex-col">
            {movements.map((movement, index) => {
              const meta = movementMeta[movement.type];
              const Icon = meta.icon;
              const isPositive = movement.quantity > 0;

              return (
                <li
                  key={movement.id}
                  className={cn(
                    "relative flex gap-4",
                    index < movements.length - 1 ? "pb-5" : "pb-0",
                  )}
                >
                  <div
                    className={cn(
                      "relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border",
                      meta.className,
                    )}
                  >
                    <Icon className="size-4" strokeWidth={2} />
                  </div>

                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="truncate font-medium text-foreground">
                        {movement.product.name}
                      </p>
                      <span
                        className={cn(
                          "shrink-0 data-mono text-sm font-semibold",
                          isPositive
                            ? "text-status-healthy-foreground"
                            : "text-status-out-foreground",
                        )}
                      >
                        {isPositive ? "+" : ""}
                        {movement.quantity}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                      <span className="sku-pill mr-2 border-0 bg-transparent p-0 text-[11px]">
                        {movement.product.sku}
                      </span>
                      {movement.location.name}
                      <span className="mx-1.5 text-border">·</span>
                      {meta.label}
                      <span className="mx-1.5 text-border">·</span>
                      {formatDistanceToNow(movement.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
