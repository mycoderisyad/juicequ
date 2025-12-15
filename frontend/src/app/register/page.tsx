"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import apiClient from "@/lib/api/config";
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
  NameInput,
  GoogleOAuthButton,
  SubmitButton,
} from "@/features/auth";
import { useGoogleOAuth } from "@/features/auth/hooks/use-google-oauth";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    isLoading: isGoogleLoading,
    error: googleError,
    initiateOAuth,
  } = useGoogleOAuth();

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
        full_name: name,
      });
      router.push("/login?verify=email");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, t("common.error")));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            {t("auth.register.title")}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t("auth.register.hasAccount")}{" "}
            <Link
              href="/login"
              className="font-medium text-emerald-600 hover:text-emerald-500"
            >
              {t("auth.register.signIn")}
            </Link>
          </p>
        </div>

        <AuthCard>
          <div className="mb-6">
            <GoogleOAuthButton
              onClick={initiateOAuth}
              isLoading={isGoogleLoading}
              disabled={isLoading}
              label="Sign up with Google"
            />
          </div>

          <AuthDivider text={t("auth.register.orSignUpWith")} />

          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            {error && <AuthAlert message={error} variant="error" />}

            <div className="space-y-4">
              <NameInput placeholder={t("auth.register.fullName")} />
              <EmailInput placeholder={t("auth.register.email")} />
              <PasswordInput
                placeholder={t("auth.register.password")}
                autoComplete="new-password"
                minLength={8}
              />
              <PasswordInput
                id="confirm-password"
                name="confirm-password"
                placeholder={t("auth.register.confirmPassword")}
                autoComplete="new-password"
                minLength={8}
              />
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                required
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                {t("auth.register.agreeTerms")}{" "}
                <a
                  href="#"
                  className="font-medium text-emerald-600 hover:text-emerald-500"
                >
                  {t("auth.register.termsLink")}
                </a>
              </label>
            </div>

            <SubmitButton
              isLoading={isLoading}
              disabled={isGoogleLoading}
              label={t("auth.register.submit")}
            />
          </form>
        </AuthCard>
      </div>
    </AuthLayout>
  );
}
