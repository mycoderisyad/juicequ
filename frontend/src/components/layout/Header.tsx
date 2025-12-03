"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { CurrencySwitcher } from "@/components/ui/CurrencySwitcher";
import { 
  ShoppingBag, 
  User, 
  Menu as MenuIcon, 
  Info, 
  Sparkles,
  LogOut,
  Home,
  X,
  Settings,
  ClipboardList,
  ChevronDown,
  LayoutDashboard,
  Store,
  ChevronRight,
  Globe,
  Coins
} from "lucide-react";
import { useAuthStore, useCartStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { useEffect, useState, useRef } from "react";


export function Header() {
  const { user, logout, fetchUser } = useAuthStore();
  const items = useCartStore((state) => state.items);
  const { t } = useTranslation();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Scroll effect for shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const navLinks = [
    { href: "/", labelKey: "nav.home" as const, icon: Home },
    { href: "/menu", labelKey: "nav.menu" as const, icon: MenuIcon },
    { href: "/chat", labelKey: "nav.aiChat" as const, icon: Sparkles, special: true },
    { href: "/about", labelKey: "nav.about" as const, icon: Info },
  ];

  // Check if current path matches link
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-sm py-2' 
          : 'bg-white py-3'
      }`}
    >
      <nav className="container mx-auto flex items-center justify-between px-4 md:px-6">
        
        {/* 1. LOGO */}
        <Link href="/" className="flex items-center gap-1 cursor-pointer select-none">
          <span className="text-xl md:text-2xl font-bold text-green-600">Juice</span>
          <span className="text-xl md:text-2xl font-bold text-slate-800">Qu</span>
          <span className="text-[10px] font-medium text-slate-400 -mt-3 ml-0.5">™</span>
        </Link>

        {/* 2. CENTER NAVIGATION (Desktop) - Pill Style */}
        <div className="hidden lg:flex items-center bg-slate-50 rounded-full px-2 py-1.5 border border-slate-100">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                  ${active 
                    ? 'bg-white text-green-600 shadow-sm ring-1 ring-green-100' 
                    : 'text-slate-500 hover:text-green-600 hover:bg-white/50'
                  }
                  ${link.special && !active ? 'text-orange-500 hover:text-orange-600 hover:bg-orange-50' : ''}
                `}
              >
                <link.icon className={`h-4 w-4 ${link.special ? "animate-pulse" : ""}`} aria-hidden="true" />
                {t(link.labelKey)}
              </Link>
            );
          })}
        </div>

        {/* 3. UTILITY & PROFILE SECTION */}
        <div className="flex items-center gap-2 md:gap-3">
          
          {/* Currency & Language Group - Text buttons style */}
          <div className="hidden md:flex items-center text-xs font-semibold text-slate-500 border-r border-slate-200 pr-3 mr-1 gap-2">
            <CurrencySwitcher variant="minimal" />
            <LanguageSwitcher variant="minimal" />
          </div>

          {/* Cart Button */}
          <Link href="/cart" aria-label={`${t("nav.cart")}${mounted && itemCount > 0 ? `, ${itemCount} ${t("nav.items")}` : ''}`}>
            <button 
              className="relative p-2.5 rounded-full text-slate-600 hover:bg-green-50 hover:text-green-600 transition-colors group"
              aria-label={`${t("nav.cart")}${mounted && itemCount > 0 ? `, ${itemCount} ${t("nav.items")}` : ''}`}
            >
              <ShoppingBag className="h-5 w-5" aria-hidden="true" />
              {mounted && itemCount > 0 && (
                <span 
                  className="absolute top-0.5 right-0.5 h-4 w-4 bg-green-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white group-hover:bg-green-600"
                  aria-hidden="true"
                >
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </button>
          </Link>
          
          {/* User Profile Button */}
          {mounted && user ? (
            <div className="hidden sm:flex relative" ref={dropdownRef}>
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
              >
                <div className="h-9 w-9 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-green-200">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden xl:block">
                  <p className="text-xs font-bold text-slate-700">{user.full_name.split(' ')[0]}</p>
                  <p className="text-[10px] text-slate-400">View Profile</p>
                </div>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 ml-1 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white shadow-lg border border-gray-100 py-2 z-50">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">{user.full_name}</p>
                      {user.role && user.role !== 'customer' && (
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {user.role}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    {/* Admin Panel - Only for Admin */}
                    {user.role === 'admin' && (
                      <Link 
                        href="/admin" 
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4 text-green-600" />
                        Admin Panel
                      </Link>
                    )}
                    {/* Cashier Panel - For Admin and Cashier */}
                    {(user.role === 'admin' || user.role === 'cashier') && (
                      <Link 
                        href="/cashier" 
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        <Store className="h-4 w-4 text-blue-600" />
                        Cashier Panel
                      </Link>
                    )}
                    {/* Divider if has panel access */}
                    {(user.role === 'admin' || user.role === 'cashier') && (
                      <div className="my-1 border-t border-gray-100" />
                    )}
                    <Link 
                      href="/profile" 
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User className="h-4 w-4 text-gray-500" />
                      My Profile
                    </Link>
                    <Link 
                      href="/orders" 
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <ClipboardList className="h-4 w-4 text-gray-500" />
                      Order History
                    </Link>
                    <Link 
                      href="/profile/settings" 
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="h-4 w-4 text-gray-500" />
                      Settings
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-gray-100 pt-1">
                    <button 
                      onClick={() => {
                        logout();
                        setProfileDropdownOpen(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      {t("nav.logout")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="hidden sm:block">
              <Button variant="outline" className="rounded-full px-4 py-2 h-10 text-sm font-medium border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all">
                <User className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">{t("nav.login")}</span>
              </Button>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <MenuIcon className="h-6 w-6" aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu - Drawer Style */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <div 
            id="mobile-menu"
            role="navigation"
            aria-label={t("nav.mobileNavigation")}
            className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
          >
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-1">
                <span className="text-xl font-bold text-green-600">Juice</span>
                <span className="text-xl font-bold text-slate-800">Qu</span>
              </Link>
              
              <div className="flex items-center gap-3">
                <Link 
                  href="/cart" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <ShoppingBag className="h-5 w-5" />
                  {mounted && itemCount > 0 && (
                    <span className="absolute top-1 right-1 h-3.5 w-3.5 bg-red-500 rounded-full border-2 border-white" />
                  )}
                </Link>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
              
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
                      onClick={() => setMobileMenuOpen(false)}
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
                        onClick={() => setMobileMenuOpen(false)}
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
                      onClick={() => setMobileMenuOpen(false)}
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
                  <CurrencySwitcher variant="minimal" />
                </div>
                <div className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 py-2.5 rounded-lg text-sm font-medium text-slate-600">
                  <Globe className="h-4 w-4" />
                  <LanguageSwitcher variant="minimal" />
                </div>
              </div>

              {/* User Profile Card */}
              {mounted && user ? (
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <Link 
                    href="/profile" 
                    onClick={() => setMobileMenuOpen(false)}
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
                      logout();
                      setMobileMenuOpen(false);
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
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 transition-colors"
                >
                  <User className="h-5 w-5" />
                  {t("nav.loginRegister")}
                </Link>
              )}
              
            </div>

          </div>
        </div>
      )}
    </header>
  );
}
