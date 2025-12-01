/**
 * Cashier Dashboard Layout.
 */
import { ReactNode } from "react";
import Link from "next/link";
import { 
  ClipboardList, 
  CreditCard, 
  BarChart3, 
  LogOut,
  Home 
} from "lucide-react";

interface CashierLayoutProps {
  children: ReactNode;
}

export default function CashierLayout({ children }: CashierLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-sm">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <span className="text-2xl">🍹</span>
          <span className="text-lg font-bold text-gray-900">JuiceQu</span>
          <span className="ml-auto rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            Kasir
          </span>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-1">
            <li>
              <Link
                href="/cashier"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
              >
                <Home className="h-5 w-5" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                href="/cashier/orders"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
              >
                <ClipboardList className="h-5 w-5" />
                Orders
              </Link>
            </li>
            <li>
              <Link
                href="/cashier/transactions"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
              >
                <CreditCard className="h-5 w-5" />
                Transaksi
              </Link>
            </li>
            <li>
              <Link
                href="/cashier/reports"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
              >
                <BarChart3 className="h-5 w-5" />
                Laporan
              </Link>
            </li>
          </ul>
          
          <div className="mt-8 border-t pt-4">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <LogOut className="h-5 w-5" />
              Keluar
            </Link>
          </div>
        </nav>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
