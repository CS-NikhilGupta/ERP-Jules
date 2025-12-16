"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  Truck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { UserRole } from "@/types";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { currentUser, setUserRole } = useStore();

  const getNavItems = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return [
          { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
          { name: "Inventory", href: "/dashboard/inventory", icon: Package },
          { name: "Sales", href: "/dashboard/sales", icon: ShoppingCart },
          { name: "Purchases", href: "/dashboard/purchases", icon: Truck },
          { name: "Users", href: "/dashboard/users", icon: Users },
          { name: "Settings", href: "/dashboard/settings", icon: Settings },
        ];
      case 'sales':
        return [
          { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
          { name: "Inventory", href: "/dashboard/inventory", icon: Package }, // Read-only logic handles in page
          { name: "Sales/Quotes", href: "/dashboard/sales", icon: ShoppingCart },
          { name: "Customers", href: "/dashboard/customers", icon: Users },
        ];
      case 'warehouse':
        return [
          { name: "Inventory", href: "/dashboard/inventory", icon: Package }, // Manage Stock
          { name: "Purchases", href: "/dashboard/purchases", icon: Truck }, // Receiving
        ];
      default:
        return [];
    }
  };

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
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Mock Role Switcher</p>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            value={currentUser.role}
            onChange={(e) => setUserRole(e.target.value as UserRole)}
          >
            <option value="admin">Admin</option>
            <option value="sales">Sales</option>
            <option value="warehouse">Warehouse</option>
          </select>
        </div>
        <div className="flex items-center gap-3 px-2 text-sm text-muted-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                {currentUser.name.charAt(0)}
            </div>
            <div>
                <p className="font-medium text-foreground">{currentUser.name}</p>
                <p className="text-xs">{currentUser.role}</p>
            </div>
        </div>
      </div>
    </div>
  );
}
