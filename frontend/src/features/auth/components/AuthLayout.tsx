"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { AuthCard } from "./AuthCard";

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-emerald-50 via-white to-orange-50">
      <div className="absolute top-6 left-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm"
        >
          <Home className="h-4 w-4" />
          {t("common.back")}
        </Link>
      </div>

      <main className="flex flex-1 items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        {title || subtitle ? (
          <div className="w-full max-w-md space-y-8">
            {(title || subtitle) && (
              <div className="text-center">
                {title && (
                  <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
                )}
              </div>
            )}
            <AuthCard>{children}</AuthCard>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
