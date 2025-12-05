"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, ArrowLeft, Loader2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import apiClient from "@/lib/api/config";

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
      setSuccess("If that email is registered, we have sent a reset link.");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const errorResponse = (err as { response: { data?: { detail?: string } } }).response;
        setError(errorResponse?.data?.detail || "Failed to send reset email.");
      } else {
        setError("Failed to send reset email.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-green-50 via-white to-orange-50">
      <div className="absolute top-6 left-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-green-600 transition-colors bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm"
        >
          <Home className="h-4 w-4" />
          Back
        </Link>
      </div>

      <main className="flex flex-1 items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              Forgot your password?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter your email address and we will send you a reset link.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-xl shadow-gray-200/50">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {success && (
                <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
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
                    Email
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
                      placeholder="Enter your email"
                      className="pl-11"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <Link href="/login" className="flex items-center gap-2 font-medium text-green-600 hover:text-green-500">
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </Link>
                <span>We will email you a secure link.</span>
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
                    "Send reset link"
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

