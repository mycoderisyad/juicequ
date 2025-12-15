"use client";

import { useEffect, useState } from "react";
import { 
  Menu as MenuIcon, 
  Home, 
  Info, 
  Sparkles, 
  X,
  ShoppingBasket
} from "lucide-react";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { CurrencySwitcher } from "@/components/ui/CurrencySwitcher";
import { useAuthStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";

// Sub-components
import { Logo } from "./Logo";
import { DesktopNav } from "./DesktopNav";
import { CartButton } from "./CartButton";
import { ProfileDropdown } from "./ProfileDropdown";
import { MobileDrawer } from "./MobileDrawer";
import type { NavLink } from "./types";

export function Header() {
  const { user, logout, fetchUser } = useAuthStore();
  const { t } = useTranslation();
  
  // State
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Navigation links configuration
  const navLinks: NavLink[] = [
    { href: "/", labelKey: "nav.home", icon: Home },
    { href: "/menu", labelKey: "nav.menu", icon: ShoppingBasket },
    { href: "/chat", labelKey: "nav.aiChat", icon: Sparkles, special: true },
    { href: "/about", labelKey: "nav.about", icon: Info },
  ];

  // Mount effect
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Fetch user on mount
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

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Handlers
  const handleLogout = () => {
    logout();
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
  };

  const closeProfileDropdown = () => {
    setProfileDropdownOpen(false);
  };

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-md shadow-sm py-2' 
            : 'bg-transparent py-3'
        }`}
      >
        <nav className="container mx-auto flex items-center px-4 md:px-6">
          
          {/* 1. LOGO - flex-1 untuk balance dengan utility section */}
          <div className="flex-1 flex items-center">
            <Logo />
          </div>

          {/* 2. CENTER NAVIGATION (Desktop) - absolute center */}
          <DesktopNav navLinks={navLinks} />

          {/* 3. UTILITY & PROFILE SECTION - flex-1 untuk balance dengan logo */}
          <div className="flex-1 flex items-center justify-end gap-2 md:gap-3">
            
            {/* Currency & Language Group - Desktop only */}
            <div className="hidden md:flex items-center text-xs font-semibold text-slate-500 border-r border-slate-200 pr-3 mr-1 gap-2">
              <CurrencySwitcher variant="minimal" />
              <LanguageSwitcher variant="minimal" />
            </div>

            {/* Cart Button */}
            <CartButton mounted={mounted} />
            
            {/* User Profile Button - Desktop */}
            <ProfileDropdown 
              user={user}
              mounted={mounted}
              isOpen={profileDropdownOpen}
              onToggle={toggleProfileDropdown}
              onClose={closeProfileDropdown}
              onLogout={handleLogout}
            />

            {/* Mobile Menu Button */}
            <button 
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            >
              {mobileMenuOpen 
                ? <X className="h-6 w-6" aria-hidden="true" /> 
                : <MenuIcon className="h-6 w-6" aria-hidden="true" />
              }
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Drawer */}
      <MobileDrawer 
        isOpen={mobileMenuOpen}
        onClose={closeMobileMenu}
        navLinks={navLinks}
        user={user}
        mounted={mounted}
        onLogout={handleLogout}
      />
    </>
  );
}

// Re-export for convenience
export { Logo } from "./Logo";
export { DesktopNav } from "./DesktopNav";
export { CartButton } from "./CartButton";
export { ProfileDropdown } from "./ProfileDropdown";
export { MobileDrawer } from "./MobileDrawer";
export type { NavLink, UserData } from "./types";
