import type { LucideIcon } from "lucide-react";
import {
  Package,
  AlertTriangle,
  PackageX,
  ClipboardList,
} from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";

type DashboardHeroStatsProps = {
  totalSkus: number;
  lowStockCount: number;
  outOfStockCount: number;
  openPoCount: number;
};

type HeroMetric = {
  label: string;
  value: number;
  subtitle: string;
  icon: LucideIcon;
  variant: "default" | "warning" | "danger" | "accent";
  sparkSeed: number;
};

export function DashboardHeroStats({
  totalSkus,
  lowStockCount,
  outOfStockCount,
  openPoCount,
}: DashboardHeroStatsProps) {
  const metrics: HeroMetric[] = [
    {
      label: "Total SKUs",
      value: totalSkus,
      subtitle: "Active catalog",
      icon: Package,
      variant: "default",
      sparkSeed: totalSkus,
    },
    {
      label: "Low stock",
      value: lowStockCount,
      subtitle: "At reorder threshold",
      icon: AlertTriangle,
      variant: "warning",
      sparkSeed: lowStockCount + 17,
    },
    {
      label: "Out of stock",
      value: outOfStockCount,
      subtitle: "Zero on hand",
      icon: PackageX,
      variant: "danger",
      sparkSeed: outOfStockCount + 42,
    },
    {
      label: "Open POs",
      value: openPoCount,
      subtitle: "In flight",
      icon: ClipboardList,
      variant: "accent",
      sparkSeed: openPoCount + 99,
    },
  ];

  return (
    <section aria-label="Operations overview">
      <p className="mb-3 font-mono text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
        Operations overview
      </p>
      <div className="dashboard-hero-stats">
        {metrics.map((metric) => (
          <StatCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            subtitle={metric.subtitle}
            icon={metric.icon}
            variant={metric.variant}
            sparkSeed={metric.sparkSeed}
            className="dashboard-hero-stat"
          />
        ))}
      </div>
    </section>
  );
}
