import { Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthBrandPanelProps = {
  className?: string;
};

export function AuthBrandPanel({ className }: AuthBrandPanelProps) {
  return (
    <aside
      className={cn("auth-brand-panel", className)}
      aria-label="20Twenty Inventory"
    >
      <div className="auth-brand-pattern" aria-hidden />
      <div className="auth-brand-glow" aria-hidden />

      <div className="relative z-10 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-md border border-accent-brand/40 bg-accent-brand/10 text-accent-brand shadow-[0_0_20px_oklch(0.78_0.14_195_/_0.2)]">
            <Terminal className="size-6" strokeWidth={2} aria-hidden />
          </div>
          <div>
            <p className="font-mono text-[10px] font-medium tracking-[0.14em] text-accent-brand uppercase">
              Ops Console
            </p>
            <p className="font-heading text-sm font-bold tracking-tight text-sidebar-foreground">
              20Twenty
            </p>
          </div>
        </div>

        <div className="max-w-sm">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            20Twenty Inventory
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Stock, purchase orders, and alerts — one operational console for small
            teams.
          </p>
        </div>

        <ul className="hidden max-w-sm flex-col gap-3 font-mono text-xs text-muted-foreground lg:flex">
          <li className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-accent-brand" aria-hidden />
            Real-time stock levels by location
          </li>
          <li className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-accent-brand" aria-hidden />
            PO workflow from draft to received
          </li>
          <li className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-accent-brand" aria-hidden />
            Low-stock alerts and movement history
          </li>
        </ul>
      </div>

      <p className="relative z-10 hidden font-mono text-[10px] tracking-wide text-muted-foreground/70 lg:block">
        © {new Date().getFullYear()} 20Twenty Inventory
      </p>
    </aside>
  );
}
