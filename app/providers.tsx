"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import { DarfusApiError, isTerminalTechnicalAuthError, shouldRetryApiQuery } from "@/lib/api/client";
import {
  isNotificationQueryMetadata,
  notificationTerminalToastMessage,
  shouldShowNotificationTerminalToast,
} from "@/lib/notifications/company-scoped-lifecycle";
import { AuthProvider } from "@/contexts/auth-context";
import { CompanyContextProvider } from "@/contexts/company-context";
import { ErpProvider } from "@/contexts/erp-context";
import { OperatorProvider } from "@/contexts/operator-context";
import { ThemeProvider } from "@/contexts/theme-context";

import { SettingsProvider } from "@/contexts/settings-context";
import { BranchContextProvider } from "@/contexts/branch-context";
import { AuthSessionCoordinator } from "@/components/auth/auth-session-coordinator";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => {
      const notificationToastTimes = new Map<string, number>();
      return new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            if (error instanceof DarfusApiError) {
              if (isTerminalTechnicalAuthError(error)) return;
              if (error.isValidationError) return;
              const metadata = query.meta;
              if (isNotificationQueryMetadata(metadata) && [401, 403, 422].includes(error.status)) {
                if (shouldShowNotificationTerminalToast(notificationToastTimes, error, metadata)) {
                  toast.error(notificationTerminalToastMessage(error));
                }
                return;
              }
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
              if (error.isValidationError) return;
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
      });
    },
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CompanyContextProvider>
            <SettingsProvider>
              <BranchContextProvider>
                <ErpProvider>
                  <OperatorProvider>
                    <AuthSessionCoordinator />
                    {children}
                  </OperatorProvider>
                  <Toaster position="top-right" richColors />
                </ErpProvider>
              </BranchContextProvider>
            </SettingsProvider>
          </CompanyContextProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
