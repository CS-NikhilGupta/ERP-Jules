"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Users,
  Settings,
  Truck,
  FileText,
  History,
  PlusCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { UserRole } from "@/types";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { currentUser } = useStore();

  const getNavItems = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return [
          { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
          { name: "Inventory", href: "/dashboard/inventory", icon: Package },
          { name: "New Sale/Quote", href: "/dashboard/sales/create", icon: PlusCircle },
          { name: "Active Quotes", href: "/dashboard/sales/quotes", icon: FileText },
          { name: "Sales History", href: "/dashboard/sales/history", icon: History },
          { name: "Customers", href: "/dashboard/customers", icon: Users },
          { name: "Purchases", href: "/dashboard/purchases", icon: Truck },
          { name: "Users", href: "/dashboard/users", icon: Users },
          { name: "Settings", href: "/dashboard/settings", icon: Settings },
        ];
      case 'sales':
        return [
          { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
          { name: "Inventory", href: "/dashboard/inventory", icon: Package },
          { name: "New Sale/Quote", href: "/dashboard/sales/create", icon: PlusCircle },
          { name: "Active Quotes", href: "/dashboard/sales/quotes", icon: FileText },
          { name: "Sales History", href: "/dashboard/sales/history", icon: History },
          { name: "Customers", href: "/dashboard/customers", icon: Users },
        ];
      case 'warehouse':
        return [
          { name: "Inventory", href: "/dashboard/inventory", icon: Package },
          { name: "Purchases", href: "/dashboard/purchases", icon: Truck },
        ];
      default:
        return [];
    }
  };

  if (!currentUser) {
      return (
        <div className={cn("flex h-full w-64 flex-col border-r bg-background p-4", className)}>
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                <Package className="h-6 w-6" />
                <span className="">Lumina ERP</span>
                </Link>
            </div>
            <div className="mt-8 text-center text-sm text-muted-foreground">
                Please log in to view menu.
            </div>
        </div>
      )
  }

  const navItems = getNavItems(currentUser.role);

  return (
    <div className={cn("flex h-full w-64 flex-col border-r bg-background", className)}>
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Package className="h-6 w-6" />
          <span className="">Lumina ERP</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                pathname === item.href
                  ? "bg-muted text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto border-t p-4">
        <div className="flex items-center gap-3 px-2 text-sm text-muted-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                {currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
                <p className="font-medium text-foreground truncate max-w-[150px]">{currentUser.email}</p>
                <p className="text-xs">{currentUser.role}</p>
            </div>
        </div>
      </div>
    </div>
  );
}
