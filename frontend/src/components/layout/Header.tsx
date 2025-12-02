"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
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
  ChevronDown
} from "lucide-react";
import { useAuthStore, useCartStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { useEffect, useState, useRef } from "react";

export function Header() {
  const { user, logout, fetchUser } = useAuthStore();
  const items = useCartStore((state) => state.items);
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

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
    { href: "/chat", labelKey: "nav.aiChat" as const, icon: Sparkles, iconColor: "text-orange-500" },
    { href: "/about", labelKey: "nav.about" as const, icon: Info },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-1 text-xl font-bold text-gray-900 lg:text-2xl"
        >
          <span className="text-green-600">Juice</span>
          <span>Qu</span>
          <span className="text-[10px] align-top text-gray-400 font-normal">™</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label={t("nav.mainNavigation")}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-green-600 transition-all"
            >
              <link.icon className={`h-4 w-4 ${link.iconColor || ""}`} aria-hidden="true" />
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Cart Button */}
          <Link href="/cart" aria-label={`${t("nav.cart")}${mounted && itemCount > 0 ? `, ${itemCount} ${t("nav.items")}` : ''}`}>
            <button 
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-green-600 hover:bg-green-700 text-white transition-all"
              aria-label={`${t("nav.cart")}${mounted && itemCount > 0 ? `, ${itemCount} ${t("nav.items")}` : ''}`}
            >
              <ShoppingBag className="h-5 w-5" aria-hidden="true" />
              {mounted && itemCount > 0 && (
                <span 
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
                  aria-hidden="true"
                >
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </button>
          </Link>
          
          {/* User Menu */}
          {mounted && user ? (
            <div className="hidden items-center sm:flex relative" ref={dropdownRef}>
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 rounded-full bg-gray-100 py-1.5 pl-1.5 pr-3 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-all"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-white text-xs font-bold">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-20 truncate hidden lg:block">{user.full_name.split(' ')[0]}</span>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white shadow-lg border border-gray-100 py-2 z-50">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{user.full_name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
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
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 transition-all md:hidden"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <MenuIcon className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div 
          id="mobile-menu"
          role="navigation"
          aria-label={t("nav.mobileNavigation")}
          className="absolute left-0 right-0 top-16 border-b border-gray-100 bg-white shadow-lg md:hidden"
        >
          <div className="container mx-auto px-4 py-4">
            {/* Nav Links */}
            <ul className="space-y-1" role="list">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-green-600 transition-all"
                  >
                    <link.icon className={`h-5 w-5 ${link.iconColor || ""}`} aria-hidden="true" />
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Mobile User Section */}
            <div className="mt-4 border-t border-gray-100 pt-4">
              {mounted && user ? (
                <div className="space-y-2">
                  <Link 
                    href="/profile" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white text-sm font-bold">
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{user.full_name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </Link>
                  <button 
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 transition-all"
                  >
                    <LogOut className="h-5 w-5" />
                    {t("nav.logout")}
                  </button>
                </div>
              ) : (
                <Link 
                  href="/login" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-base font-medium text-white hover:bg-green-700 transition-all"
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
