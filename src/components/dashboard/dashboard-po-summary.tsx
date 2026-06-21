import type { PurchaseOrderStatus } from "@prisma/client";
import { PoStatusBadge } from "@/components/shared/status-badges";

type DashboardPoSummaryProps = {
  poSummary: Array<{ status: PurchaseOrderStatus; count: number }>;
};

export function DashboardPoSummary({ poSummary }: DashboardPoSummaryProps) {
  return (
    <section className="data-panel h-fit">
      <div className="data-panel-header">
        <h2 className="font-heading text-sm font-semibold tracking-tight text-foreground">
          PO pipeline
        </h2>
        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
          Orders by stage
        </p>
      </div>
      <ul className="flex flex-col gap-0.5 p-3 md:p-4">
        {poSummary.map((row) => (
          <li
            key={row.status}
            className="flex items-center justify-between rounded-md border border-transparent px-3 py-2.5 transition-colors duration-150 hover:border-border/60 hover:bg-muted/30"
          >
            <PoStatusBadge status={row.status} />
            <span className="data-mono text-lg font-semibold text-accent-brand">
              {row.count}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
