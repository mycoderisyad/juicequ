"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import type { NavLink } from "./types";

interface DesktopNavProps {
  navLinks: NavLink[];
}

export function DesktopNav({ navLinks }: DesktopNavProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
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
  );
}
