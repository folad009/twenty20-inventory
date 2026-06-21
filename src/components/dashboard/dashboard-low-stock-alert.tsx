import Link from "next/link";
import type { Location, Product, StockLevel } from "@prisma/client";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  PackageX,
} from "lucide-react";
import { StockStatusBadge } from "@/components/shared/status-badges";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LowStockItem = StockLevel & {
  product: Product;
  location: Location;
};

type DashboardLowStockAlertProps = {
  items: LowStockItem[];
};

function alertIcon(quantity: number) {
  if (quantity === 0) {
    return {
      Icon: PackageX,
      className: "border-status-out-foreground/30 bg-status-out text-status-out-foreground",
    };
  }
  return {
    Icon: AlertTriangle,
    className: "border-status-low-foreground/30 bg-status-low text-status-low-foreground",
  };
}

export function DashboardLowStockAlert({ items }: DashboardLowStockAlertProps) {
  const hasAlerts = items.length > 0;

  return (
    <section
      className={cn(
        "data-panel overflow-hidden",
        hasAlerts && "border-status-low-foreground/25",
      )}
    >
      <div
        className={cn(
          "data-panel-header flex flex-row items-start gap-3 sm:items-center",
          hasAlerts && "border-status-low-foreground/20 bg-status-low/10",
        )}
      >
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-md border",
            hasAlerts
              ? "border-status-low-foreground/30 bg-status-low text-status-low-foreground"
              : "border-status-healthy-foreground/30 bg-status-healthy text-status-healthy-foreground",
          )}
        >
          {hasAlerts ? (
            <AlertTriangle className="size-5" strokeWidth={2} />
          ) : (
            <CheckCircle2 className="size-5" strokeWidth={2} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-sm font-semibold tracking-tight text-foreground">
            {hasAlerts ? "Low stock alerts" : "Stock levels healthy"}
          </h2>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            {hasAlerts
              ? `${items.length} location${items.length === 1 ? "" : "s"} need attention`
              : "No items at or below reorder threshold"}
          </p>
        </div>
        {hasAlerts ? (
          <Link
            href="/stock"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "shrink-0 text-accent-brand",
            )}
          >
            View stock
            <ArrowRight data-icon="inline-end" />
          </Link>
        ) : null}
      </div>

      {hasAlerts ? (
        <ul className="flex flex-col gap-2 p-4">
          {items.map((item) => {
            const { Icon, className } = alertIcon(item.quantityOnHand);
            return (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-md border border-border/50 bg-muted/15 px-3 py-3 transition-colors duration-150 hover:border-accent-brand/20 hover:bg-accent-brand/5"
              >
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-md border",
                    className,
                  )}
                >
                  <Icon className="size-4" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">
                    {item.product.name}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <span className="sku-pill">{item.product.sku}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.location.name}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="data-mono text-lg font-semibold text-foreground">
                    {item.quantityOnHand}
                  </span>
                  <StockStatusBadge
                    quantity={item.quantityOnHand}
                    threshold={item.product.reorderThreshold}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
          <CheckCircle2 className="size-8 text-status-healthy-foreground" />
          <p className="text-sm text-muted-foreground">
            All monitored stock levels are above reorder thresholds.
          </p>
        </div>
      )}
    </section>
  );
}
