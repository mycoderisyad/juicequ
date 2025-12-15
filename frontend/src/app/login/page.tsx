"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Loader2 } from "lucide-react";
import apiClient from "@/lib/api/config";
import { useAuthStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { getApiErrorMessage } from "@/lib/utils/error-handler";
import { AUTH_MESSAGES } from "@/lib/constants/messages";
import {
  AuthLayout,
  AuthCard,
  AuthAlert,
  AuthDivider,
  EmailInput,
  PasswordInput,
  GoogleOAuthButton,
  SubmitButton,
} from "@/features/auth";
import { useGoogleOAuth } from "@/features/auth/hooks/use-google-oauth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const {
    isLoading: isGoogleLoading,
    error: googleError,
    initiateOAuth,
  } = useGoogleOAuth();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    const verified = searchParams.get("verified");
    const verifyPrompt = searchParams.get("verify");
    const resetSuccess = searchParams.get("success");

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      return;
    }

    if (verified === "1") {
      setInfo(AUTH_MESSAGES.EMAIL_VERIFIED);
    } else if (verifyPrompt === "email") {
      setInfo(AUTH_MESSAGES.VERIFY_EMAIL_PROMPT);
    } else if (resetSuccess === "reset") {
      setInfo(AUTH_MESSAGES.PASSWORD_RESET_SUCCESS);
    } else {
      setInfo("");
    }
  }, [searchParams]);

  useEffect(() => {
    if (googleError) {
      setError(googleError);
    }
  }, [googleError]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const response = await apiClient.post("/auth/login", { email, password });
      const { access_token } = response.data;

      const userResponse = await apiClient.get("/auth/me", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      login(access_token, userResponse.data);

      const userRole = userResponse.data.role;
      const redirectTo = searchParams.get("redirect");

      if (redirectTo) {
        router.push(redirectTo);
      } else if (userRole === "admin") {
        router.push("/admin");
      } else if (userRole === "kasir") {
        router.push("/cashier");
      } else {
        router.push("/menu");
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, t("auth.errors.invalidCredentials")));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            {t("auth.login.subtitle")}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t("common.or")}{" "}
            <Link
              href="/register"
              className="font-medium text-emerald-600 hover:text-emerald-500"
            >
              {t("auth.login.signUp")}
            </Link>
          </p>
        </div>

        <AuthCard>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {info && <AuthAlert message={info} variant="success" />}
            {error && <AuthAlert message={error} variant="error" />}

            <div className="space-y-4">
              <EmailInput placeholder={t("auth.login.email")} />
              <PasswordInput placeholder={t("auth.login.password")} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-900"
                >
                  {t("auth.login.rememberMe")}
                </label>
              </div>

              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-emerald-600 hover:text-emerald-500"
                >
                  {t("auth.login.forgotPassword")}
                </Link>
              </div>
            </div>

            <SubmitButton
              isLoading={isLoading}
              disabled={isGoogleLoading}
              label={t("auth.login.submit")}
            />
          </form>

          <div className="mt-6">
            <AuthDivider text={t("auth.login.orContinueWith")} />
            <div className="mt-6">
              <GoogleOAuthButton
                onClick={initiateOAuth}
                isLoading={isGoogleLoading}
                disabled={isLoading}
              />
            </div>
          </div>
        </AuthCard>
      </div>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
