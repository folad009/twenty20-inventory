import type { LucideIcon } from "lucide-react";
import { MiniSparkline } from "@/components/shared/mini-sparkline";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "warning" | "danger" | "success" | "accent";
  sparkSeed?: number;
  className?: string;
};

const valueVariants = {
  default: "text-foreground",
  warning: "text-status-low-foreground",
  danger: "text-status-out-foreground",
  success: "text-status-healthy-foreground",
  accent: "text-accent-brand",
};

const iconVariants = {
  default: "text-accent-brand",
  warning: "text-status-low-foreground",
  danger: "text-status-out-foreground",
  success: "text-status-healthy-foreground",
  accent: "text-accent-brand",
};

export function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  sparkSeed,
  className,
}: StatCardProps) {
  const seed =
    sparkSeed ??
    (typeof value === "number" ? value : value.split("").reduce((a, c) => a + c.charCodeAt(0), 0));

  return (
    <div className={cn("stat-card p-4 md:p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="stat-card-label">{label}</p>
          <p className={cn("stat-card-value", valueVariants[variant])}>{value}</p>
          {subtitle ? (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className={cn("stat-card-icon shrink-0", iconVariants[variant])}>
            <Icon className="size-4" strokeWidth={2} />
          </div>
          <MiniSparkline seed={seed} variant={variant} />
        </div>
      </div>
    </div>
  );
}
