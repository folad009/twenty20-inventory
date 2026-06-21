import { Skeleton } from "@/components/ui/skeleton";

function StatCardSkeleton() {
  return (
    <div className="stat-card p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="flex flex-col items-end gap-2">
          <Skeleton className="size-9 rounded-md" />
          <Skeleton className="h-7 w-20" />
        </div>
      </div>
    </div>
  );
}

function AlertRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border/40 bg-muted/15 px-3 py-3">
      <Skeleton className="size-9 shrink-0 rounded-md" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Skeleton className="h-4 w-3/5 max-w-[200px]" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-6 w-10" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  );
}

function FeedItemSkeleton() {
  return (
    <div className="relative flex gap-4 pb-6 pl-1 last:pb-0">
      <Skeleton className="relative z-10 size-9 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-2 pt-0.5">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-5 w-12" />
        </div>
        <Skeleton className="h-3 w-56" />
      </div>
    </div>
  );
}

function PoRowSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-md px-3 py-2.5">
      <Skeleton className="h-5 w-24 rounded-full" />
      <Skeleton className="h-6 w-8" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="page-shell" aria-busy aria-label="Loading dashboard">
      {/* Page header + quick actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-44 md:h-9 md:w-52" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      {/* Hero stats row */}
      <section aria-hidden>
        <Skeleton className="mb-3 h-3 w-36" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      </section>

      {/* Low stock + PO summary */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="data-panel lg:col-span-3">
          <div className="data-panel-header flex items-center gap-3">
            <Skeleton className="size-10 rounded-md" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <div className="flex flex-col gap-2 p-4">
            <AlertRowSkeleton />
            <AlertRowSkeleton />
            <AlertRowSkeleton />
            <AlertRowSkeleton />
          </div>
        </div>
        <div className="data-panel lg:col-span-2">
          <div className="data-panel-header">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-1.5 h-3 w-24" />
          </div>
          <div className="flex flex-col gap-0.5 p-3">
            <PoRowSkeleton />
            <PoRowSkeleton />
            <PoRowSkeleton />
            <PoRowSkeleton />
            <PoRowSkeleton />
          </div>
        </div>
      </div>

      {/* Movements feed */}
      <div className="data-panel">
        <div className="data-panel-header">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-1.5 h-3 w-56" />
        </div>
        <div className="relative p-4 md:p-5">
          <div
            className="absolute top-4 bottom-4 left-[22px] w-px bg-border md:left-[26px]"
            aria-hidden
          />
          <FeedItemSkeleton />
          <FeedItemSkeleton />
          <FeedItemSkeleton />
          <FeedItemSkeleton />
          <FeedItemSkeleton />
        </div>
      </div>
    </div>
  );
}
