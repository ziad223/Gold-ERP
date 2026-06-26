"use client";
/**
 * DARFUS Dashboard — Customization Drawer (PRODUCTION)
 * Allows users to show/hide and reorder widgets.
 * Reset to default. Simple/Advanced mode toggle.
 */
import { useState } from "react";
import { Settings2, EyeOff, Eye, RotateCcw, X, Zap, Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WIDGET_CATALOG } from "../registry/widget-catalog";
import type { DashboardPreferences, DashboardMode } from "../contracts/widget-types";
import { cn } from "@/lib/utils";

interface CustomizationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: DashboardPreferences;
  onToggleWidget: (id: string) => void;
  onSetMode: (mode: DashboardMode) => void;
  onReset: () => void;
  userRole: string;
}

export function CustomizationDrawer({
  isOpen,
  onClose,
  preferences,
  onToggleWidget,
  onSetMode,
  onReset,
  userRole,
}: CustomizationDrawerProps) {
  const t = useTranslations("Dashboard");
  const [confirmReset, setConfirmReset] = useState(false);

  const availableWidgets = WIDGET_CATALOG.filter(
    (w) => w.allowedRoles.includes(userRole) && w.workspaces.includes(preferences.workspace)
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-navy-950/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed bottom-0 end-0 top-0 z-50 flex w-full max-w-sm flex-col border-s border-border bg-panel shadow-float">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-brand-600" />
            <h2 className="font-black text-foreground">{t("customizeTitle")}</h2>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-background hover:text-foreground"
            aria-label={t("customizeClose")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Mode Toggle */}
          <div>
            <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
              {t("customizeModeLabel")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(["SIMPLE", "ADVANCED"] as DashboardMode[]).map((mode) => {
                const Icon = mode === "SIMPLE" ? Zap : Shield;
                const isActive = preferences.mode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => onSetMode(mode)}
                    className={cn(
                      "flex items-center gap-2 rounded-2xl border p-3 text-xs font-bold transition",
                      isActive
                        ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                        : "border-border bg-background text-foreground hover:border-brand-300"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {t(mode === "SIMPLE" ? "modeSimple" : "modeAdvanced")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Widget Visibility */}
          <div>
            <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
              {t("customizeWidgets")}
            </p>
            <div className="space-y-2">
              {availableWidgets.map((widget) => {
                const isVisible = !preferences.hiddenWidgetIds.includes(widget.id);
                return (
                  <Card
                    key={widget.id}
                    className={cn(
                      "flex items-center gap-3 p-3 transition",
                      !isVisible && "opacity-50"
                    )}
                  >
                    <div className="flex-1">
                      <p className="text-xs font-bold text-foreground">
                        {t(widget.titleKey as Parameters<typeof t>[0])}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {t(`zone${widget.zone}` as Parameters<typeof t>[0])}
                      </p>
                    </div>
                    <button
                      onClick={() => onToggleWidget(widget.id)}
                      className={cn(
                        "grid h-8 w-8 place-items-center rounded-xl transition",
                        isVisible
                          ? "bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/10"
                          : "bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800"
                      )}
                      aria-label={isVisible ? t("hideWidget") : t("showWidget")}
                    >
                      {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-5">
          {confirmReset ? (
            <div className="space-y-2">
              <p className="text-center text-xs text-muted-foreground">{t("customizeResetConfirm")}</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => setConfirmReset(false)}>
                  {t("customizeCancelReset")}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    onReset();
                    setConfirmReset(false);
                    onClose();
                  }}
                >
                  {t("customizeConfirmReset")}
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-2.5 text-xs font-bold text-muted-foreground transition hover:border-rose-300 hover:text-rose-600"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t("customizeReset")}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
