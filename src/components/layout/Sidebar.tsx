"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  DollarSign,
  Settings,
  Store,
  ChevronLeft,
  Receipt,
} from "lucide-react";
import { useState } from "react";

const menuItems = [
  { label: "Nueva Venta", href: "/ventas/nueva", icon: ShoppingCart },
  { label: "Ventas", href: "/ventas", icon: Receipt },
  { label: "Inventario", href: "/inventario", icon: Package },
  { label: "Clientes", href: "/clientes", icon: Users },
  { label: "Finanzas", href: "/finanzas", icon: DollarSign },
  { label: "Reportes", href: "/reportes", icon: BarChart3 },
];

const adminMenuItems = [
  { label: "Usuarios", href: "/usuarios", icon: Users },
  { label: "Configuración", href: "/configuracion", icon: Settings },
];

type SidebarProps = {
  userRol: string;
};

export default function Sidebar({ userRol }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = userRol === "ADMIN";

  return (
    <aside
      className={cn(
        "h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 sticky top-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-4 border-b border-gray-200">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0">
          <Store className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-gray-900 text-sm truncate">
            MiniMarket
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <p className={cn("text-xs font-medium text-gray-400 uppercase tracking-wider px-3 mb-2", collapsed && "hidden")}>
          Módulos
        </p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-blue-600" : "text-gray-400")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="pt-4">
              <p className={cn("text-xs font-medium text-gray-400 uppercase tracking-wider px-3 mb-2", collapsed && "hidden")}>
                Administración
              </p>
            </div>
            {adminMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-purple-50 text-purple-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-purple-600" : "text-gray-400")} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Collapse button */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span>Colapsar</span>}
        </button>
      </div>
    </aside>
  );
}
