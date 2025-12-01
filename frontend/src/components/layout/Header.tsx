"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  ShoppingBag, 
  Search, 
  User, 
  Menu as MenuIcon, 
  Info, 
  Sparkles,
  LogOut
} from "lucide-react";
import { useAuthStore, useCartStore } from "@/lib/store";
import { useEffect, useState } from "react";

export function Header() {
  const { user, logout, fetchUser } = useAuthStore();
  const items = useCartStore((state) => state.items);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <nav className="container mx-auto flex h-20 items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-2xl font-bold text-gray-900"
        >
          <span>JuiceQu</span>
          <span className="text-xs align-top text-gray-500">TM</span>
        </Link>

        {/* Main Nav */}
        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="/menu"
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-green-600 transition-colors"
          >
            <MenuIcon className="h-4 w-4" />
            MENU
          </Link>
          <Link
            href="/chat"
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-green-600 transition-colors"
          >
            <Sparkles className="h-4 w-4 text-orange-500" />
            AI CHAT
          </Link>
          <Link
            href="/about"
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-green-600 transition-colors"
          >
            <Info className="h-4 w-4" />
            ABOUT
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <button className="rounded-full p-2 text-gray-600 hover:bg-gray-100 transition-colors">
            <Search className="h-5 w-5" />
          </button>
          <Link href="/cart">
            <Button className="bg-red-700 hover:bg-red-800 text-white shadow-lg shadow-red-700/20 rounded-full">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Cart ({mounted ? itemCount : 0})
            </Button>
          </Link>
          
          {mounted && user ? (
            <div className="flex items-center gap-2">
              <Link href="/profile">
                <button className="flex items-center gap-2 rounded-full bg-gray-100 py-1.5 pl-2 pr-4 text-sm font-medium text-gray-900 hover:bg-gray-200 transition-colors">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-white">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="max-w-[100px] truncate">{user.full_name.split(' ')[0]}</span>
                </button>
              </Link>
              <button 
                onClick={logout}
                className="rounded-full p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <Link href="/login">
              <button className="rounded-full p-2 text-gray-600 hover:bg-gray-100 transition-colors">
                <User className="h-5 w-5" />
              </button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
