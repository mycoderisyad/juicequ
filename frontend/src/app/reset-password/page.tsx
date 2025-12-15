"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/api/config";
import { useTranslation } from "@/lib/i18n";
import { getApiErrorMessage } from "@/lib/utils/error-handler";
import { AuthLayout, PasswordInput, AuthAlert } from "@/features/auth";

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
    } catch (err) {
      setError(getApiErrorMessage(err, t("auth.resetPassword.failed")));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t("auth.resetPassword.title")}
      subtitle={t("auth.resetPassword.subtitle")}
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        {success && <AuthAlert type="success" message={success} />}
        {error && <AuthAlert type="error" message={error} />}

        <div className="space-y-4">
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("auth.resetPassword.newPassword")}
            autoComplete="new-password"
            minLength={8}
          />
          <PasswordInput
            id="confirm-password"
            name="confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t("auth.resetPassword.confirmPassword")}
            autoComplete="new-password"
            minLength={8}
          />
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <Link
            href="/login"
            className="font-medium text-emerald-600 hover:text-emerald-500"
          >
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
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
