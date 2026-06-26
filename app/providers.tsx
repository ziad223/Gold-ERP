"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import { DarfusApiError } from "@/lib/api/client";
import { AuthProvider } from "@/contexts/auth-context";
import { ErpProvider } from "@/contexts/erp-context";
import { ThemeProvider } from "@/contexts/theme-context";

import { SettingsProvider } from "@/contexts/settings-context";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            if (error instanceof DarfusApiError) {
              toast.error(error.message, {
                description: error.correlationId ? `Correlation ID: ${error.correlationId}` : undefined,
              });
              if (error.status === 401) {
                // Session expired: clean session state and reload page after brief timeout
                setTimeout(() => {
                  window.localStorage.removeItem("darfus-session-v3");
                  window.sessionStorage.removeItem("darfus-browser-session-v3");
                  window.localStorage.removeItem("darfus-token-v1");
                  window.localStorage.removeItem("darfus-refresh-v1");
                  window.localStorage.removeItem("darfus-api-session-v1");
                  window.sessionStorage.removeItem("darfus-token-v1");
                  window.sessionStorage.removeItem("darfus-refresh-v1");
                  window.sessionStorage.removeItem("darfus-api-session-v1");
                  window.location.reload();
                }, 2000);
              }
            }
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            if (error instanceof DarfusApiError) {
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
            retry: 1,
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
              {children}
              <Toaster position="top-right" richColors />
            </ErpProvider>
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
