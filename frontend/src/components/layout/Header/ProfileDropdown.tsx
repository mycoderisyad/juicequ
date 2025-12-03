"use client";

import Link from "next/link";
import { useRef, useEffect } from "react";
import { 
  User, 
  LogOut, 
  Settings, 
  ClipboardList, 
  ChevronDown, 
  LayoutDashboard, 
  Store 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import type { UserData } from "./types";

interface ProfileDropdownProps {
  user: UserData | null;
  mounted: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onLogout: () => void;
}

export function ProfileDropdown({ 
  user, 
  mounted, 
  isOpen, 
  onToggle, 
  onClose, 
  onLogout 
}: ProfileDropdownProps) {
  const { t } = useTranslation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Not mounted yet or no user - show login button
  if (!mounted || !user) {
    return (
      <Link href="/login" className="hidden sm:block">
        <Button variant="outline" className="rounded-full px-4 py-2 h-10 text-sm font-medium border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all">
          <User className="h-4 w-4 lg:mr-2" />
          <span className="hidden lg:inline">{t("nav.login")}</span>
        </Button>
      </Link>
    );
  }

  return (
    <div className="hidden sm:flex relative" ref={dropdownRef}>
      <button 
        onClick={onToggle}
        className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
      >
        <div className="h-9 w-9 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-green-200">
          {user.full_name.charAt(0).toUpperCase()}
        </div>
        <div className="text-left hidden xl:block">
          <p className="text-xs font-bold text-slate-700">{user.full_name.split(' ')[0]}</p>
          <p className="text-[10px] text-slate-400">View Profile</p>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
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
                onClick={onClose}
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
                onClick={onClose}
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
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User className="h-4 w-4 text-gray-500" />
              My Profile
            </Link>
            <Link 
              href="/orders" 
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ClipboardList className="h-4 w-4 text-gray-500" />
              Order History
            </Link>
            <Link 
              href="/profile/settings" 
              onClick={onClose}
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
                onLogout();
                onClose();
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
  );
}
