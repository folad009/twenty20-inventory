"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { getRouteMeta } from "@/components/layout/nav-config";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import type { UserRole } from "@/types/roles";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

type TopBarProps = {
  user: {
    name: string | null;
    email: string;
    role: UserRole;
  };
};

export function TopBar({ user }: TopBarProps) {
  const pathname = usePathname();
  const { title, section } = getRouteMeta(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md md:px-6">
      <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-accent-brand" />
      <Separator orientation="vertical" className="hidden h-4 sm:block" />

      <nav
        aria-label="Breadcrumb"
        className="hidden min-w-0 flex-1 items-center gap-1.5 font-mono text-xs sm:flex"
      >
        <Link
          href="/"
          className="shrink-0 text-muted-foreground transition-colors duration-150 hover:text-accent-brand"
        >
          ~
        </Link>
        <span className="text-muted-foreground/40" aria-hidden>
          /
        </span>
        <span className="shrink-0 text-muted-foreground">{section}</span>
        <span className="text-muted-foreground/40" aria-hidden>
          /
        </span>
        <span className="truncate font-medium text-foreground">{title}</span>
      </nav>

      <h1 className="font-mono text-sm font-medium sm:hidden">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search…"
            disabled
            aria-label="Global search (coming soon)"
            className="h-8 w-48 border-border bg-input pl-8 font-mono text-xs lg:w-56"
          />
        </div>
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
