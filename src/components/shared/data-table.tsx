import { cn } from "@/lib/utils";

type DataTableProps = {
  children: React.ReactNode;
  className?: string;
  /** Minimum table width for horizontal scroll on small screens */
  minWidth?: number;
};

/** Native table element — use inside DataTableShell (avoids nested scroll containers). */
export function DataTable({
  children,
  className,
  minWidth = 640,
}: DataTableProps) {
  return (
    <table
      className={cn("data-table w-full caption-bottom text-sm", className)}
      style={{ minWidth }}
    >
      {children}
    </table>
  );
}

export { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
