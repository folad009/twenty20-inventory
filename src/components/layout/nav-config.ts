import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Truck,
  ShoppingCart,
  Settings,
  ScanBarcode,
  ArrowLeftRight,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const navSections: NavSection[] = [
  {
    label: "Operations",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/stock", label: "Stock", icon: Warehouse },
      { href: "/transfers", label: "Transfers", icon: ArrowLeftRight },
      { href: "/scan", label: "Scan", icon: ScanBarcode },
    ],
  },
  {
    label: "Catalog",
    items: [{ href: "/products", label: "Products", icon: Package }],
  },
  {
    label: "Purchasing",
    items: [
      { href: "/suppliers", label: "Suppliers", icon: Truck },
      { href: "/purchase-orders", label: "Purchase Orders", icon: ShoppingCart },
    ],
  },
  {
    label: "Admin",
    items: [{ href: "/settings", label: "Settings", icon: Settings }],
  },
];

export const routeMeta: Record<string, { title: string; section: string }> = {
  "/": { title: "Dashboard", section: "Operations" },
  "/products": { title: "Products", section: "Catalog" },
  "/stock": { title: "Stock", section: "Operations" },
  "/transfers": { title: "Transfers", section: "Operations" },
  "/scan": { title: "Scan", section: "Operations" },
  "/suppliers": { title: "Suppliers", section: "Purchasing" },
  "/purchase-orders": { title: "Purchase Orders", section: "Purchasing" },
  "/settings": { title: "Settings", section: "Admin" },
};

export function getRouteMeta(pathname: string) {
  if (routeMeta[pathname]) {
    return routeMeta[pathname];
  }

  if (pathname.startsWith("/purchase-orders/")) {
    return { title: "Purchase Order", section: "Purchasing" };
  }

  return { title: "Inventory", section: "Operations" };
}

export function isNavItemActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
