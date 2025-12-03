"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";

interface CartButtonProps {
  mounted: boolean;
}

export function CartButton({ mounted }: CartButtonProps) {
  const items = useCartStore((state) => state.items);
  const { t } = useTranslation();
  
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
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
  );
}
