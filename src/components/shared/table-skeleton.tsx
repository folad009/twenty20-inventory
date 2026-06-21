import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type TableSkeletonProps = {
  rows?: number;
  columns?: number;
  className?: string;
  label?: string;
};

export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
  label = "Loading table",
}: TableSkeletonProps) {
  return (
    <div className={cn("data-panel", className)} aria-busy aria-label={label}>
      <div className="data-panel-header">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-1.5 h-3 w-20" />
      </div>
      <div className="data-table-wrap p-3 sm:p-4">
        <div className="flex gap-3 border-b border-border/60 pb-2 sm:gap-4">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton
              key={index}
              className={cn("h-3 flex-1", index > 0 && "max-md:hidden sm:block")}
            />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-3 border-b border-border/30 py-2.5 sm:gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className={cn(
                  "h-4 flex-1",
                  colIndex === 0 && "max-w-[45%]",
                  colIndex > 0 && colIndex < columns - 1 && "max-md:hidden sm:block",
                  colIndex === columns - 1 && "max-w-[20%]",
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
