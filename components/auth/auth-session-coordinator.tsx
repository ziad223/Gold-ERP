"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useOperator } from "@/contexts/operator-context";
import { registerTerminalAuthFailureHandler } from "@/lib/api/client";

/** Coordinates one terminal technical-session transition for all API callers. */
export function AuthSessionCoordinator() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const locale = useLocale();
  const { beginTerminalAuthHandling, isAuthenticated, logout, terminalAuthHandling } = useAuth();
  const { clearLocal } = useOperator();
  const handlingRef = useRef(false);

  const handleTerminalFailure = useCallback(() => {
    if (handlingRef.current) return;
    handlingRef.current = true;
    beginTerminalAuthHandling();
    void (async () => {
      await queryClient.cancelQueries();
      clearLocal("TECHNICAL_SESSION_EXPIRED");
      logout();
      toast.error(locale === "en" ? "Session expired. Please log in again." : "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.");
      router.replace("/login", { locale });
    })();
  }, [beginTerminalAuthHandling, clearLocal, locale, logout, queryClient, router]);

  useEffect(() => registerTerminalAuthFailureHandler(handleTerminalFailure), [handleTerminalFailure]);

  useEffect(() => {
    if (isAuthenticated && !terminalAuthHandling) handlingRef.current = false;
  }, [isAuthenticated, terminalAuthHandling]);

  return null;
}
