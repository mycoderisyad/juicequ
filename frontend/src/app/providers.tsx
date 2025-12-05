"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { I18nProvider } from "@/lib/i18n";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { StoreProvider } from "@/lib/hooks/use-store";
import { VoiceCommandButton } from "@/components/VoiceCommandButton";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <StoreProvider>
            {children}
            {/* Floating Voice Command Button - appears on all pages */}
            <VoiceCommandButton />
          </StoreProvider>
        </I18nProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
