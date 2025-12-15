"use client";

import { useState } from "react";
import apiClient from "@/lib/api/config";
import { getApiErrorMessage } from "@/lib/utils/error-handler";
import { AUTH_MESSAGES } from "@/lib/constants/messages";

interface UseGoogleOAuthReturn {
  isLoading: boolean;
  error: string;
  initiateOAuth: () => Promise<void>;
  clearError: () => void;
}

export function useGoogleOAuth(): UseGoogleOAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const initiateOAuth = async () => {
    setIsLoading(true);
    setError("");

    try {
      const redirectUri = `${window.location.origin}/api/auth/google/callback`;
      const response = await apiClient.get("/auth/google/url", {
        params: { redirect_uri: redirectUri },
      });

      const { auth_url, state } = response.data;
      sessionStorage.setItem("google_oauth_state", state);
      window.location.href = auth_url;
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, AUTH_MESSAGES.GOOGLE_INIT_FAILED));
      setIsLoading(false);
    }
  };

  const clearError = () => setError("");

  return {
    isLoading,
    error,
    initiateOAuth,
    clearError,
  };
}
