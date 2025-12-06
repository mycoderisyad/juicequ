"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Lock, Loader2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import apiClient from "@/lib/api/config";
import { useTranslation } from "@/lib/i18n";

function ResetPasswordForm() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!token) {
      setError(t("auth.resetPassword.missingToken"));
    }
  }, [token, t]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      setError(t("auth.resetPassword.passwordMismatch"));
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await apiClient.post("/auth/password/reset", {
        token,
        new_password: password,
      });
      setSuccess(t("auth.resetPassword.success"));
      setTimeout(() => router.push("/login?success=reset"), 800);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const errorResponse = (err as { response: { data?: { detail?: string } } }).response;
        setError(errorResponse?.data?.detail || t("auth.resetPassword.failed"));
      } else {
        setError(t("auth.resetPassword.failed"));
      }
    } finally {
      setIsLoading(false);
    }
  };

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
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              {t("auth.resetPassword.title")}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t("auth.resetPassword.subtitle")}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-xl shadow-gray-200/50">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {success && (
                <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
                  {success}
                </div>
              )}
              {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-500">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="password" className="sr-only">
                    {t("auth.resetPassword.newPassword")}
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      minLength={8}
                      required
                      placeholder={t("auth.resetPassword.newPassword")}
                      className="pl-11"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="sr-only">
                    {t("auth.resetPassword.confirmPassword")}
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <Input
                      id="confirm-password"
                      name="confirm-password"
                      type="password"
                      minLength={8}
                      required
                      placeholder={t("auth.resetPassword.confirmPassword")}
                      className="pl-11"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
                  {t("auth.resetPassword.backToLogin")}
                </Link>
                <span>{t("auth.resetPassword.passwordRequirement")}</span>
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={isLoading || !token}
                  className="group relative flex w-full justify-center rounded-full bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    t("auth.resetPassword.updatePassword")
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

