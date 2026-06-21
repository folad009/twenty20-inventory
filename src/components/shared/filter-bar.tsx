import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FilterBarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
  pending?: boolean;
  className?: string;
};

export function FilterBar({
  searchValue,
  onSearchChange,
  onSearch,
  placeholder = "Search…",
  pending = false,
  className,
}: FilterBarProps) {
  return (
    <div className={cn("filter-bar", className)}>
      <div className="relative min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          className="h-8 border-0 bg-muted/25 pl-8 font-mono text-xs shadow-none focus-visible:ring-1"
        />
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={onSearch}
        disabled={pending}
        className="h-8 shrink-0 px-2.5 sm:px-3"
        aria-label={pending ? "Searching" : "Search"}
      >
        <Search className="size-3.5 sm:hidden" />
        <span className="hidden sm:inline">{pending ? "Searching…" : "Search"}</span>
      </Button>
    </div>
  );
}
