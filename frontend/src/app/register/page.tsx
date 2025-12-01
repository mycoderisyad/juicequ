"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, User, ArrowRight, Github, Loader2, Home } from "lucide-react";
import { api } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
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
      await api.post("/auth/register", { 
        email, 
        password,
        full_name: name
      });
      
      // Redirect to login on success
      router.push("/login");
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
                  disabled={isLoading}
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

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">{t("auth.register.orSignUpWith")}</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-full bg-white px-4 py-2 text-gray-500 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0"
                >
                  <span className="sr-only">Sign up with Google</span>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M12.0003 20.45c4.6667 0 8.45-3.7833 8.45-8.45 0-.4167-.0334-.8167-.1-1.2167H12.0003v3.2h4.8334c-.2167 1.1-.85 2.0333-1.8167 2.6667v2.2166h2.9333c1.7167-1.5833 2.7167-3.9166 2.7167-6.6333 0-.6667-.0667-1.3167-.1834-1.95h-8.4833V8.8h8.4833c.1167.6333.1834 1.2833.1834 1.95 0 4.6667-3.7833 8.45-8.45 8.45-4.6667 0-8.45-3.7833-8.45-8.45 0-4.6667 3.7833-8.45 8.45-8.45 2.2833 0 4.35.8333 5.9667 2.2167l2.3833-2.3833C18.3503 2.3833 15.3503 1.2 12.0003 1.2c-5.9667 0-10.8 4.8333-10.8 10.8 0 5.9667 4.8333 10.8 10.8 10.8z"
                      fill="#EA4335"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-full bg-white px-4 py-2 text-gray-500 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0"
                >
                  <span className="sr-only">Sign up with GitHub</span>
                  <Github className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
