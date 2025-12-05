"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, User, ArrowRight, Loader2, Home } from "lucide-react";
import apiClient from "@/lib/api/config";
import { useTranslation } from "@/lib/i18n";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirm-password") as string;

    if (password !== confirmPassword) {
      setError(t("auth.errors.passwordMismatch"));
      setIsLoading(false);
      return;
    }

    try {
      await apiClient.post("/auth/register", { 
        email, 
        password,
        full_name: name
      });
      
      // Redirect to login on success
      router.push("/login?verify=email");
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const errorResponse = (err as { response: { data: { detail: string } } }).response;
        setError(errorResponse?.data?.detail || t("common.error"));
      } else {
        setError(t("common.error"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    setError("");

    try {
      // Get Google OAuth URL from backend
      const redirectUri = `${window.location.origin}/api/auth/google/callback`;
      const response = await apiClient.get("/auth/google/url", {
        params: { redirect_uri: redirectUri }
      });
      
      const { auth_url, state } = response.data;
      
      // Store state in sessionStorage for CSRF validation
      sessionStorage.setItem("google_oauth_state", state);
      
      // Redirect to Google OAuth
      window.location.href = auth_url;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const errorResponse = (err as { response: { data: { detail: string } } }).response;
        setError(errorResponse?.data?.detail || "Google signup is not available");
      } else {
        setError("Failed to initiate Google signup");
      }
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-green-50 via-white to-orange-50">
      {/* Back to Home */}
      <div className="absolute top-6 left-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-green-600 transition-colors bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm"
        >
          <Home className="h-4 w-4" />
          {t("common.back")}
        </Link>
      </div>
      
      <main className="flex flex-1 items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header Section */}
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              {t("auth.register.title")}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t("auth.register.hasAccount")}{" "}
              <Link href="/login" className="font-medium text-green-600 hover:text-green-500">
                {t("auth.register.signIn")}
              </Link>
            </p>
          </div>

          {/* Card */}
          <div className="rounded-3xl bg-white p-8 shadow-xl shadow-gray-200/50">
            {/* Google Sign Up Button - Prominent at top */}
            <div className="mb-6">
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={isLoading || isGoogleLoading}
                className="inline-flex w-full justify-center items-center gap-3 rounded-full bg-white px-4 py-3 text-gray-700 font-medium shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGoogleLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Sign up with Google
                  </>
                )}
              </button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">{t("auth.register.orSignUpWith")}</span>
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-500">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="sr-only">
                    {t("auth.register.fullName")}
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      placeholder={t("auth.register.fullName")}
                      className="pl-11"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="sr-only">
                    {t("auth.register.email")}
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder={t("auth.register.email")}
                      className="pl-11"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="password" className="sr-only">
                    {t("auth.register.password")}
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      placeholder={t("auth.register.password")}
                      className="pl-11"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="confirm-password" className="sr-only">
                    {t("auth.register.confirmPassword")}
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <Input
                      id="confirm-password"
                      name="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      placeholder={t("auth.register.confirmPassword")}
                      className="pl-11"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  required
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                  {t("auth.register.agreeTerms")}{" "}
                  <a href="#" className="font-medium text-green-600 hover:text-green-500">
                    {t("auth.register.termsLink")}
                  </a>
                </label>
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  className="group relative flex w-full justify-center rounded-full bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {t("auth.register.submit")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
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
