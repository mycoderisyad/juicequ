/**
 * Cashier Dashboard Layout.
 */
"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ClipboardList, 
  CreditCard, 
  BarChart3, 
  LogOut,
  Home,
  ShoppingCart,
  PanelLeftClose,
  PanelLeft
} from "lucide-react";
import { useStore } from "@/lib/hooks/use-store";
import { StoreStatusIndicator } from "@/components/ui/StoreStatusIndicator";

interface CashierLayoutProps {
  children: ReactNode;
}

export default function CashierLayout({ children }: CashierLayoutProps) {
  const { hours, isStoreOpen } = useStore();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isActive = (path: string) => {
    if (path === "/cashier") {
      return pathname === "/cashier";
    }
    return pathname.startsWith(path);
  };

  const navItems = [
    { href: "/cashier", label: "Dashboard", icon: Home },
    { href: "/cashier/pos", label: "POS / Order Baru", icon: ShoppingCart, badge: "Baru" },
    { href: "/cashier/orders", label: "Orders", icon: ClipboardList },
    { href: "/cashier/transactions", label: "Transaksi", icon: CreditCard },
    { href: "/cashier/reports", label: "Laporan", icon: BarChart3 },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside 
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } bg-white shadow-sm flex flex-col transition-all duration-300`}
      >
        <div className={`flex h-16 items-center border-b ${sidebarOpen ? "px-4 gap-2" : "px-0 justify-center"}`}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
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
              <span className="text-lg font-bold text-gray-900">JuiceQu</span>
              <span className="ml-auto rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                Kasir
              </span>
            </>
          )}
        </div>
        
        {/* Store Status */}
        {sidebarOpen && (
          <div className="border-b px-4 py-3">
            <StoreStatusIndicator 
              isOpen={isStoreOpen}
              openingTime={hours?.opening_time}
              closingTime={hours?.closing_time}
              showHours={true}
              size="sm"
            />
          </div>
        )}
        
        {/* Compact store status when sidebar is closed */}
        {!sidebarOpen && (
          <div className="border-b py-3 flex justify-center">
            <div 
              className={`w-3 h-3 rounded-full ${isStoreOpen ? "bg-green-500" : "bg-red-500"}`}
              title={isStoreOpen ? "Toko Buka" : "Toko Tutup"}
            />
          </div>
        )}
        
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
                        ? "bg-green-50 text-green-700 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    } ${!sidebarOpen ? "justify-center" : ""}`}
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${active ? "text-green-600" : ""}`} />
                    {sidebarOpen && (
                      <>
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="border-t p-2">
          <Link
            href="/"
            title={!sidebarOpen ? "Keluar" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 ${!sidebarOpen ? "justify-center" : ""}`}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Keluar</span>}
          </Link>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
