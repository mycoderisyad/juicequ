/**
 * Admin Dashboard Layout.
 */
import { ReactNode } from "react";
import Link from "next/link";
import { 
  LayoutDashboard,
  Users,
  Package,
  Tags,
  BarChart3,
  Settings,
  LogOut
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white">
        <div className="flex h-16 items-center gap-2 border-b border-gray-700 px-6">
          <span className="text-2xl">🍹</span>
          <span className="text-lg font-bold">JuiceQu</span>
          <span className="ml-auto rounded bg-purple-600 px-2 py-0.5 text-xs font-medium">
            Admin
          </span>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-1">
            <li>
              <Link
                href="/admin"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                <LayoutDashboard className="h-5 w-5" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                href="/admin/users"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                <Users className="h-5 w-5" />
                Users
              </Link>
            </li>
            <li>
              <Link
                href="/admin/products"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                <Package className="h-5 w-5" />
                Products
              </Link>
            </li>
            <li>
              <Link
                href="/admin/categories"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                <Tags className="h-5 w-5" />
                Categories
              </Link>
            </li>
            <li>
              <Link
                href="/admin/analytics"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                <BarChart3 className="h-5 w-5" />
                Analytics
              </Link>
            </li>
            <li>
              <Link
                href="/admin/settings"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                <Settings className="h-5 w-5" />
                Settings
              </Link>
            </li>
          </ul>
          
          <div className="mt-8 border-t border-gray-700 pt-4">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-400 hover:bg-gray-800 hover:text-white"
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
