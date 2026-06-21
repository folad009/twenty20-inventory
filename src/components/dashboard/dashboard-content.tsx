import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { getDashboardAction } from "@/server/actions/dashboard";
import { canMutate } from "@/lib/auth-utils";
import { PageHeader } from "@/components/shared/page-header";
import { DashboardHeroStats } from "@/components/dashboard/dashboard-hero-stats";
import { DashboardLowStockAlert } from "@/components/dashboard/dashboard-low-stock-alert";
import { DashboardPoSummary } from "@/components/dashboard/dashboard-po-summary";
import { DashboardMovementsFeed } from "@/components/dashboard/dashboard-movements-feed";
import { DashboardQuickActions } from "@/components/dashboard/dashboard-quick-actions";

function openPoCount(poSummary: Array<{ status: string; count: number }>) {
  return poSummary
    .filter(
      (p) =>
        p.status === "DRAFT" ||
        p.status === "ORDERED" ||
        p.status === "PARTIALLY_RECEIVED",
    )
    .reduce((sum, p) => sum + p.count, 0);
}

export async function DashboardContent() {
  const [stats, session] = await Promise.all([getDashboardAction(), auth()]);
  const role = (session?.user?.role as Role) ?? Role.VIEWER;
  const openPos = openPoCount(stats.poSummary);

  return (
    <div className="page-shell">
      <PageHeader
        title="Dashboard"
        description="Inventory health · live ops feed"
        actions={<DashboardQuickActions canMutate={canMutate(role)} />}
      />

      <DashboardHeroStats
        totalSkus={stats.totalSkus}
        lowStockCount={stats.lowStockCount}
        outOfStockCount={stats.outOfStockCount}
        openPoCount={openPos}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <DashboardLowStockAlert items={stats.lowStockItems} />
        </div>
        <div className="lg:col-span-2">
          <DashboardPoSummary poSummary={stats.poSummary} />
        </div>
      </div>

      <DashboardMovementsFeed movements={stats.recentMovements} />
    </div>
  );
}
