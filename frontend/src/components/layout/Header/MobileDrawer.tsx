"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ShoppingBag, 
  User, 
  X, 
  LogOut, 
  ChevronRight, 
  LayoutDashboard, 
  Store, 
  Globe, 
  Coins 
} from "lucide-react";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { CurrencySwitcher } from "@/components/ui/CurrencySwitcher";
import { useCartStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import type { NavLink, UserData } from "./types";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  navLinks: NavLink[];
  user: UserData | null;
  mounted: boolean;
  onLogout: () => void;
}

export function MobileDrawer({ 
  isOpen, 
  onClose, 
  navLinks, 
  user, 
  mounted, 
  onLogout 
}: MobileDrawerProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const items = useCartStore((state) => state.items);
  
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] lg:hidden">
      {/* Backdrop - covers entire screen */}
      <div 
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container - slides from right */}
      <div 
        id="mobile-menu"
        role="navigation"
        aria-label={t("nav.mobileNavigation")}
        className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <Link href="/" onClick={onClose} className="flex items-center gap-1">
            <span className="text-xl font-bold text-green-600">Juice</span>
            <span className="text-xl font-bold text-slate-800">Qu</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <Link 
              href="/cart" 
              onClick={onClose}
              className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ShoppingBag className="h-5 w-5" />
              {mounted && itemCount > 0 && (
                <span className="absolute top-1 right-1 h-3.5 w-3.5 bg-red-500 rounded-full border-2 border-white" />
              )}
            </Link>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 bg-white">
          
          {/* Main Navigation */}
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Main Menu
            </p>
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 ${
                    active 
                      ? 'bg-green-50 text-green-700 font-medium shadow-sm ring-1 ring-green-100' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <link.icon 
                      className={`h-5 w-5 ${link.special ? "text-orange-500" : ""}`}
                    />
                    <span>{t(link.labelKey)}</span>
                  </div>
                  {link.special && (
                    <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold">
                      NEW
                    </span>
                  )}
                  {active && <ChevronRight className="h-4 w-4 text-green-500" />}
                </Link>
              );
            })}
          </div>

          <hr className="border-slate-100" />

          {/* Quick Access - Admin/Cashier Panels */}
          {mounted && user && (user.role === 'admin' || user.role === 'cashier') && (
            <div>
              <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Quick Access
              </p>
              <div className="grid grid-cols-2 gap-3">
                {user.role === 'admin' && (
                  <Link 
                    href="/admin"
                    onClick={onClose}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all bg-green-50/30"
                  >
                    <div className="p-2 rounded-full bg-white shadow-sm mb-2 text-green-600">
                      <LayoutDashboard className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">Admin Panel</span>
                  </Link>
                )}
                <Link 
                  href="/cashier"
                  onClick={onClose}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all bg-blue-50/30"
                >
                  <div className="p-2 rounded-full bg-white shadow-sm mb-2 text-blue-600">
                    <Store className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">Cashier Panel</span>
                </Link>
              </div>
            </div>
          )}

        </div>

        {/* Footer - Settings & Profile */}
        <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-4">
          
          {/* Currency & Language Buttons */}
          <div className="flex gap-2">
            <div className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 py-2.5 rounded-lg text-sm font-medium text-slate-600">
              <Coins className="h-4 w-4" />
              <CurrencySwitcher variant="minimal" upwards={true} />
            </div>
            <div className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 py-2.5 rounded-lg text-sm font-medium text-slate-600">
              <Globe className="h-4 w-4" />
              <LanguageSwitcher variant="minimal" upwards={true} />
            </div>
          </div>

          {/* User Profile Card */}
          {mounted && user ? (
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <Link 
                href="/profile" 
                onClick={onClose}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <div className="h-10 w-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-green-200 flex-shrink-0">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-slate-800 truncate">{user.full_name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </Link>
              <button 
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                aria-label={t("nav.logout")}
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <Link 
              href="/login" 
              onClick={onClose}
              className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 transition-colors"
            >
              <User className="h-5 w-5" />
              {t("nav.loginRegister")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
