"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import { DarfusApiError, isTerminalTechnicalAuthError, shouldRetryApiQuery } from "@/lib/api/client";
import { AuthProvider } from "@/contexts/auth-context";
import { ErpProvider } from "@/contexts/erp-context";
import { OperatorProvider } from "@/contexts/operator-context";
import { ThemeProvider } from "@/contexts/theme-context";

import { SettingsProvider } from "@/contexts/settings-context";
import { AuthSessionCoordinator } from "@/components/auth/auth-session-coordinator";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            if (error instanceof DarfusApiError) {
              if (isTerminalTechnicalAuthError(error)) return;
              toast.error(error.message, {
                description: error.correlationId ? `Correlation ID: ${error.correlationId}` : undefined,
              });
            }
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            if (error instanceof DarfusApiError) {
              if (isTerminalTechnicalAuthError(error)) return;
              toast.error(error.message, {
                description: error.correlationId ? `Correlation ID: ${error.correlationId}` : undefined,
              });
            }
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes standard stale time
            refetchOnWindowFocus: false,
            retry: shouldRetryApiQuery,
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SettingsProvider>
            <ErpProvider>
              <OperatorProvider>
                <AuthSessionCoordinator />
                {children}
              </OperatorProvider>
              <Toaster position="top-right" richColors />
            </ErpProvider>
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
