/**
 * Admin Dashboard Layout.
 */
"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard,
  Users,
  Package,
  Tags,
  BarChart3,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Store,
  ShoppingBag
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(path);
  };

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/categories", label: "Categories", icon: Tags },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside 
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } bg-gray-900 text-white transition-all duration-300 flex flex-col`}
      >
        <div className={`flex h-16 items-center border-b border-gray-700 ${sidebarOpen ? "px-4 gap-2" : "px-0 justify-center"}`}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            title={sidebarOpen ? "Tutup Sidebar" : "Buka Sidebar"}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeft className="h-5 w-5" />
            )}
          </button>
          {sidebarOpen && (
            <>
              <span className="text-2xl">🍹</span>
              <span className="text-lg font-bold">JuiceQu</span>
              <span className="ml-auto rounded bg-purple-600 px-2 py-0.5 text-xs font-medium">
                Admin
              </span>
            </>
          )}
        </div>
        
        <nav className="flex-1 p-2">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={!sidebarOpen ? item.label : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                      active
                        ? "bg-purple-600 text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    } ${!sidebarOpen ? "justify-center" : ""}`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {sidebarOpen && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
          
          <div className="mt-8 border-t border-gray-700 pt-4 space-y-1">
            <Link
              href="/"
              title={!sidebarOpen ? "Halaman Customer" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-gray-400 hover:bg-gray-800 hover:text-white ${!sidebarOpen ? "justify-center" : ""}`}
            >
              <Store className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>Halaman Customer</span>}
            </Link>
            <Link
              href="/cashier"
              title={!sidebarOpen ? "Halaman Kasir" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-gray-400 hover:bg-gray-800 hover:text-white ${!sidebarOpen ? "justify-center" : ""}`}
            >
              <ShoppingBag className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>Halaman Kasir</span>}
            </Link>
            <Link
              href="/"
              title={!sidebarOpen ? "Keluar" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-red-400 hover:bg-red-900/30 hover:text-red-300 ${!sidebarOpen ? "justify-center" : ""}`}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>Keluar</span>}
            </Link>
          </div>
        </nav>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
