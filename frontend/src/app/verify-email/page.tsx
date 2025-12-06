"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Mail, CheckCircle, Loader2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import apiClient from "@/lib/api/config";
import { useTranslation } from "@/lib/i18n";

function VerifyEmailForm() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) return;
      setIsVerifying(true);
      setError("");
      setSuccess("");
      try {
        await apiClient.post("/auth/verify-email/confirm", { token });
        setSuccess(t("auth.verifyEmail.success"));
        setTimeout(() => router.push("/login?verified=1"), 800);
      } catch (err: unknown) {
        if (err && typeof err === "object" && "response" in err) {
          const errorResponse = (err as { response: { data?: { detail?: string } } }).response;
          setError(errorResponse?.data?.detail || t("auth.verifyEmail.invalidLink"));
        } else {
          setError(t("auth.verifyEmail.invalidLink"));
        }
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [router, token, t]);

  const handleResend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await apiClient.post("/auth/verify-email/send", { email });
      setSuccess(t("auth.verifyEmail.sentLink"));
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const errorResponse = (err as { response: { data?: { detail?: string } } }).response;
        setError(errorResponse?.data?.detail || t("auth.verifyEmail.sendFailed"));
      } else {
        setError(t("auth.verifyEmail.sendFailed"));
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
              {t("auth.verifyEmail.title")}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {token
                ? t("auth.verifyEmail.validating")
                : t("auth.verifyEmail.enterEmail")}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-xl shadow-gray-200/50">
            {token ? (
              <div className="flex flex-col items-center gap-4">
                {isVerifying && (
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                )}
                {success && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    {success}
                  </div>
                )}
                {error && (
                  <div className="rounded-lg bg-red-50 p-4 text-sm text-red-500">
                    {error}
                  </div>
                )}
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    {t("auth.verifyEmail.goToLogin")}
                  </Button>
                </Link>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleResend}>
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
                    <label htmlFor="email" className="sr-only">
                      {t("auth.login.email")}
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </div>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder={t("auth.login.email")}
                        className="pl-11"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
                    {t("auth.verifyEmail.backToLogin")}
                  </Link>
                  <span>{t("auth.verifyEmail.willSendLink")}</span>
                </div>

                <div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="group relative flex w-full justify-center rounded-full bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      t("auth.verifyEmail.sendVerification")
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}

