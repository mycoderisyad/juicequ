/**
 * Cashier Dashboard Layout.
 */
"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ClipboardList, 
  CreditCard, 
  BarChart3, 
  LogOut,
  Home,
  ShoppingCart
} from "lucide-react";
import { useStore } from "@/lib/hooks/use-store";
import { StoreStatusIndicator } from "@/components/ui/StoreStatusIndicator";

interface CashierLayoutProps {
  children: ReactNode;
}

export default function CashierLayout({ children }: CashierLayoutProps) {
  const { hours, isStoreOpen } = useStore();
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/cashier") {
      return pathname === "/cashier";
    }
    return pathname.startsWith(path);
  };

  const navItems = [
    { href: "/cashier", label: "Dashboard", icon: Home },
    { href: "/cashier/pos", label: "POS / Order Baru", icon: ShoppingCart },
    { href: "/cashier/orders", label: "Orders", icon: ClipboardList },
    { href: "/cashier/transactions", label: "Transaksi", icon: CreditCard },
    { href: "/cashier/reports", label: "Laporan", icon: BarChart3 },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-sm flex flex-col">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <span className="text-2xl">🍹</span>
          <span className="text-lg font-bold text-gray-900">JuiceQu</span>
          <span className="ml-auto rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            Kasir
          </span>
        </div>
        
        {/* Store Status */}
        <div className="border-b px-4 py-3">
          <StoreStatusIndicator 
            isOpen={isStoreOpen}
            openingTime={hours?.opening_time}
            closingTime={hours?.closing_time}
            showHours={true}
            size="sm"
          />
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                      active
                        ? "bg-green-50 text-green-700 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${active ? "text-green-600" : ""}`} />
                    {item.label}
                    {item.href === "/cashier/pos" && (
                      <span className="ml-auto rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
                        Baru
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="border-t p-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            <LogOut className="h-5 w-5" />
            Keluar
          </Link>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
