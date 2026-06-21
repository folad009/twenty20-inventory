import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type PaginationBarProps = {
  page: number;
  totalPages: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  pending?: boolean;
  className?: string;
};

export function PaginationBar({
  page,
  totalPages,
  total,
  onPrevious,
  onNext,
  pending = false,
  className,
}: PaginationBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <span className="text-muted-foreground">
        Page{" "}
        <span className="font-medium tabular-nums text-foreground">{page}</span> of{" "}
        <span className="font-medium tabular-nums text-foreground">{totalPages}</span>
        <span className="hidden sm:inline">
          {" "}
          · <span className="tabular-nums">{total}</span> total
        </span>
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1 || pending}
          onClick={onPrevious}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages || pending}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
