/**
 * Cashier Dashboard Layout - Modern Design (Matching Admin Panel).
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
  Menu,
  X,
  Store,
  Bell
} from "lucide-react";
import { useStore } from "@/lib/hooks/use-store";
import { StoreStatusIndicator } from "@/components/ui/StoreStatusIndicator";

interface CashierLayoutProps {
  children: ReactNode;
}

// Navigation Item Component
function NavItem({ 
  href, 
  icon: Icon, 
  label, 
  active, 
  collapsed,
  badge
}: { 
  href: string; 
  icon: React.ElementType; 
  label: string; 
  active: boolean;
  collapsed: boolean;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`flex items-center rounded-2xl transition-all duration-300 ${
        collapsed ? "justify-center w-12 h-12" : "justify-start w-full h-12 px-4 gap-3"
      } ${
        active 
          ? "bg-stone-900 text-white shadow-lg shadow-stone-900/20" 
          : "text-stone-400 hover:bg-stone-50 hover:text-emerald-600"
      }`}
    >
      <Icon size={20} className="shrink-0" />
      {!collapsed && (
        <div className="flex flex-1 items-center justify-between">
          <span className="font-medium">{label}</span>
          {badge && (
            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
              {badge}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

// Quick Link Item Component  
function QuickLinkItem({
  href,
  icon: Icon,
  label,
  collapsed,
  variant = "default"
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  collapsed: boolean;
  variant?: "default" | "danger";
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`flex items-center rounded-2xl transition-all duration-300 ${
        collapsed ? "justify-center w-12 h-12" : "justify-start w-full h-12 px-4 gap-3"
      } ${
        variant === "danger"
          ? "text-stone-400 hover:bg-rose-50 hover:text-rose-500"
          : "text-stone-400 hover:bg-stone-50 hover:text-emerald-600"
      }`}
    >
      <Icon size={20} className="shrink-0" />
      {!collapsed && <span className="font-medium">{label}</span>}
    </Link>
  );
}

export default function CashierLayout({ children }: CashierLayoutProps) {
  const { hours, isStoreOpen } = useStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

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
    <div className="min-h-screen bg-stone-100 font-sans text-stone-800 flex p-2 sm:p-4 gap-2 sm:gap-4 overflow-hidden">
      
      {/* Desktop Sidebar */}
      <aside className={`${
        sidebarCollapsed ? "w-20" : "w-64"
      } bg-white rounded-[2.5rem] flex-col py-6 shadow-sm border border-stone-200 hidden md:flex shrink-0 z-20 transition-all duration-300`}>
        
        {/* Logo & Collapse Toggle */}
        <div className={`flex items-center mb-6 ${sidebarCollapsed ? "justify-center px-0 flex-col gap-4" : "px-6 justify-between"}`}>
          <div className={`flex items-center ${sidebarCollapsed ? "flex-col gap-2" : "gap-3"}`}>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 8h1a4 4 0 1 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" /><line x1="6" x2="6" y1="2" y2="8" /><line x1="10" x2="10" y1="2" y2="8" /><line x1="14" x2="14" y1="2" y2="8" />
              </svg>
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="font-bold text-stone-900">JuiceQu</h1>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Kasir</span>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:bg-stone-200 hover:text-stone-600 transition-colors ${sidebarCollapsed ? "" : ""}`}
          >
            <Menu size={16} className={`transition-transform ${sidebarCollapsed ? "" : "rotate-90"}`} />
          </button>
        </div>

        {/* Store Status Indicator */}
        {!sidebarCollapsed && (
          <div className="px-6 mb-6">
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100">
              <StoreStatusIndicator 
                isOpen={isStoreOpen}
                openingTime={hours?.opening_time}
                closingTime={hours?.closing_time}
                showHours={true}
                size="sm"
              />
            </div>
          </div>
        )}
        {sidebarCollapsed && (
           <div className="flex justify-center mb-6">
             <div 
               className={`w-3 h-3 rounded-full ${isStoreOpen ? "bg-green-500" : "bg-red-500"}`}
               title={isStoreOpen ? "Toko Buka" : "Toko Tutup"}
             />
           </div>
        )}

        {/* Navigation */}
        <nav className={`flex-1 flex flex-col gap-2 ${sidebarCollapsed ? "px-4 items-center" : "px-4"}`}>
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={isActive(item.href)}
              collapsed={sidebarCollapsed}
              badge={item.badge}
            />
          ))}
        </nav>

        {/* Bottom Links */}
        <div className={`border-t border-stone-100 pt-4 mt-4 flex flex-col gap-2 ${sidebarCollapsed ? "px-4 items-center" : "px-4"}`}>
          <QuickLinkItem
            href="/"
            icon={Store}
            label="Halaman Customer"
            collapsed={sidebarCollapsed}
          />
          <QuickLinkItem
            href="/"
            icon={LogOut}
            label="Keluar"
            collapsed={sidebarCollapsed}
            variant="danger"
          />
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="fixed top-3 left-3 sm:top-4 sm:left-4 z-30 md:hidden w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white shadow-lg flex items-center justify-center text-stone-600"
      >
        <Menu size={20} className="sm:hidden" />
        <Menu size={24} className="hidden sm:block" />
      </button>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-2 sm:inset-y-4 left-2 sm:left-4 w-64 sm:w-72 bg-white rounded-2xl sm:rounded-[2.5rem] flex flex-col py-4 sm:py-6 shadow-xl z-50 md:hidden transform transition-transform duration-300 ${
        mobileMenuOpen ? "translate-x-0" : "-translate-x-[120%]"
      }`}>
        {/* Close Button */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200"
        >
          <X size={20} />
        </button>

        {/* Logo */}
        <div className="flex items-center px-6 gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 8h1a4 4 0 1 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" /><line x1="6" x2="6" y1="2" y2="8" /><line x1="10" x2="10" y1="2" y2="8" /><line x1="14" x2="14" y1="2" y2="8" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-stone-900">JuiceQu</h1>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Kasir</span>
          </div>
        </div>

         {/* Store Status Indicator Mobile */}
         <div className="px-4 mb-6">
            <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
              <StoreStatusIndicator 
                isOpen={isStoreOpen}
                openingTime={hours?.opening_time}
                closingTime={hours?.closing_time}
                showHours={true}
                size="sm"
              />
            </div>
          </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-2 px-4">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={isActive(item.href)}
              collapsed={false}
              badge={item.badge}
            />
          ))}
        </nav>

        {/* Bottom Links */}
        <div className="border-t border-stone-100 pt-4 mt-4 flex flex-col gap-2 px-4">
          <QuickLinkItem href="/" icon={Store} label="Halaman Customer" collapsed={false} />
          <QuickLinkItem href="/" icon={LogOut} label="Keluar" collapsed={false} variant="danger" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-4 sm:gap-6 h-[calc(100vh-2rem)] overflow-y-auto pr-1 sm:pr-2 scrollbar-hide">
        {/* Top Bar */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 bg-white/50 backdrop-blur-sm p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border border-stone-200/50">
          <div className="pl-12 sm:pl-14 md:pl-0">
            <h1 className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-emerald-950">Halo, Kasir! 👋</h1>
            <p className="text-stone-500 text-xs sm:text-sm">Siap melayani pelanggan hari ini.</p>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4 ml-12 sm:ml-14 md:ml-0">
            {/* Notification */}
            <button className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors relative shrink-0">
              <Bell size={16} className="sm:hidden" />
              <Bell size={18} className="hidden sm:block" />
              <span className="absolute top-1.5 right-2 sm:top-2 sm:right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
            </button>
            {/* Profile */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-emerald-700 font-bold shrink-0 text-sm sm:text-base">
              K
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
