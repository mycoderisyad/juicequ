"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/api/config";
import { useTranslation } from "@/lib/i18n";
import { getApiErrorMessage } from "@/lib/utils/error-handler";
import { AuthLayout, EmailInput, AuthAlert } from "@/features/auth";

function VerifyEmailForm() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
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
      } catch (err) {
        setError(getApiErrorMessage(err, t("auth.verifyEmail.invalidLink")));
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
    } catch (err) {
      setError(getApiErrorMessage(err, t("auth.verifyEmail.sendFailed")));
    } finally {
      setIsLoading(false);
    }
  };

  if (token) {
    return (
      <AuthLayout
        title={t("auth.verifyEmail.title")}
        subtitle={t("auth.verifyEmail.validating")}
      >
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
          {error && <AuthAlert type="error" message={error} />}
          <Link href="/login">
            <Button variant="outline" className="w-full">
              {t("auth.verifyEmail.goToLogin")}
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t("auth.verifyEmail.title")}
      subtitle={t("auth.verifyEmail.enterEmail")}
    >
      <form className="space-y-6" onSubmit={handleResend}>
        {success && <AuthAlert type="success" message={success} />}
        {error && <AuthAlert type="error" message={error} />}

        <div className="space-y-4">
          <EmailInput
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("auth.login.email")}
          />
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <Link
            href="/login"
            className="font-medium text-emerald-600 hover:text-emerald-500"
          >
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
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
