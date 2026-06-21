import { cn } from "@/lib/utils";

type DataTableShellProps = {
  children: React.ReactNode;
  className?: string;
  label?: string;
};

export function DataTableShell({
  children,
  className,
  label = "Data table",
}: DataTableShellProps) {
  return (
    <div
      className={cn("data-table-wrap", className)}
      tabIndex={0}
      role="region"
      aria-label={label}
    >
      {children}
    </div>
  );
}

type DataPanelProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  variant?: "default" | "alert";
  className?: string;
};

export function DataPanel({
  title,
  description,
  action,
  children,
  variant = "default",
  className,
}: DataPanelProps) {
  return (
    <section
      className={cn(
        "data-panel",
        variant === "alert" && "border-status-low-foreground/20 shadow-sm",
        className,
      )}
    >
      <div
        className={cn(
          "data-panel-header flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between",
          variant === "alert" && "border-status-low/50 bg-status-low/20",
        )}
      >
        <div>
          <h2 className="font-heading text-sm font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="p-0">{children}</div>
    </section>
  );
}
