"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Terminal } from "lucide-react";
import {
  navSections,
  isNavItemActive,
} from "@/components/layout/nav-config";
import { TopBar } from "@/components/layout/top-bar";
import type { UserRole } from "@/types/roles";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarRail,
} from "@/components/ui/sidebar";

type AppShellProps = {
  children: React.ReactNode;
  user: {
    name: string | null;
    email: string;
    role: UserRole;
  };
};

function NavSections() {
  const pathname = usePathname();

  return (
    <>
      {navSections.map((section) => (
        <SidebarGroup key={section.label}>
          <SidebarGroupLabel className="font-mono text-[10px] font-medium tracking-[0.12em] text-sidebar-foreground/45 uppercase">
            {section.label}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {section.items.map((item) => {
                const active = isNavItemActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={active}
                      className={cn(
                        "relative rounded-md transition-colors duration-150",
                        active &&
                          "border border-sidebar-primary/30 bg-sidebar-accent font-medium text-sidebar-primary shadow-[inset_0_0_12px_oklch(0.78_0.14_195_/_0.08)]",
                      )}
                    >
                      <Icon
                        data-icon="inline-start"
                        className={cn(active && "text-sidebar-primary")}
                      />
                      {item.label}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}

export function AppShell({ children, user }: AppShellProps) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
        <SidebarHeader className="border-b border-sidebar-border p-0">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-4 transition-opacity duration-150 hover:opacity-90"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-sidebar-primary/40 bg-sidebar-primary/15 text-sidebar-primary shadow-[0_0_16px_oklch(0.78_0.14_195_/_0.2)]">
              <Terminal className="size-5" strokeWidth={2} />
            </div>
            <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
              <span className="font-heading truncate text-sm font-bold tracking-tight text-sidebar-foreground">
                20Twenty
              </span>
              <span className="truncate font-mono text-[10px] tracking-[0.14em] text-sidebar-primary/80 uppercase">
                Ops Console
              </span>
            </div>
          </Link>
          <div className="console-accent-line opacity-60" />
        </SidebarHeader>

        <SidebarContent className="gap-0.5 px-2 py-3">
          <NavSections />
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-3">
          <div className="rounded-md border border-sidebar-border bg-sidebar-accent/40 px-3 py-2.5 group-data-[collapsible=icon]:hidden">
            <p className="font-mono text-[10px] tracking-[0.1em] text-sidebar-foreground/45 uppercase">
              Operator
            </p>
            <p className="mt-0.5 truncate text-sm font-medium text-sidebar-foreground">
              {user.name ?? user.email}
            </p>
            <p className="truncate font-mono text-[11px] text-sidebar-primary/70 uppercase">
              {user.role.toLowerCase()}
            </p>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="console-grid">
        <TopBar user={user} />
        <main className="flex flex-1 flex-col">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
