interface AxiosErrorResponse {
  response?: {
    data?: {
      detail?: string;
      message?: string;
    };
    status?: number;
  };
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as AxiosErrorResponse;
    return (
      axiosError.response?.data?.detail ||
      axiosError.response?.data?.message ||
      fallback
    );
  }
  return fallback;
}

export function isAxiosError(error: unknown): error is AxiosErrorResponse {
  return error !== null && typeof error === "object" && "response" in error;
}

export function getErrorStatus(error: unknown): number | undefined {
  if (isAxiosError(error)) {
    return error.response?.status;
  }
  return undefined;
}
