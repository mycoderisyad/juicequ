"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/api/config";
import { getApiErrorMessage } from "@/lib/utils/error-handler";
import { AUTH_MESSAGES } from "@/lib/constants/messages";
import { AuthLayout, EmailInput, AuthAlert } from "@/features/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await apiClient.post("/auth/password/forgot", { email });
      setSuccess(AUTH_MESSAGES.FORGOT_PASSWORD_SUCCESS);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, AUTH_MESSAGES.FORGOT_PASSWORD_FAILED));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email address and we will send you a reset link."
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        {success && <AuthAlert message={success} variant="success" />}
        {error && <AuthAlert message={error} variant="error" />}

        <div className="space-y-4">
          <EmailInput
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <Link
            href="/login"
            className="flex items-center gap-2 font-medium text-emerald-600 hover:text-emerald-500"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
          <span>We will email you a secure link.</span>
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
              "Send reset link"
            )}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
