"use client";

import { useLocale } from "next-intl";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useNotifications } from "@/hooks/use-notifications";
import { toEnglishDigits } from "@/lib/formatters/numbers";

export default function NotificationsPage() {
  const locale = useLocale();
  const rtl = locale === "ar";
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  return (
    <div className="space-y-6">
      <PageHeader
        title={rtl ? "الإشعارات" : "Notifications"}
        description={rtl ? "متابعة تنبيهات النظام وحالة العمليات الجارية." : "Monitor system alerts, logs, and workflow status."}
        actions={
          unreadCount > 0 && (
            <Button variant="secondary" size="sm" onClick={() => markAllRead()}>
              {rtl ? "تحديد الكل كمقروء" : "Mark all as read"}
            </Button>
          )
        }
      />

      <Card className="divide-y divide-slate-100 dark:divide-slate-800">
        {notifications.length ? notifications.map((item) => (
          <button
            key={item.id}
            onClick={() => markRead(item.id)}
            className="flex w-full items-start gap-4 border-b border-slate-100 p-5 text-start transition last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-navy-950"
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
              <Bell className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="font-black text-navy-950 dark:text-white">{toEnglishDigits(item.title)}</span>
                {!item.isRead && <span className="h-2 w-2 rounded-full bg-brand-500" />}
              </span>
              <span className="mt-1 block text-sm leading-6 text-slate-500">{toEnglishDigits(item.message)}</span>
              <span className="mt-2 block text-[10px] font-bold text-slate-400">
                {toEnglishDigits(new Date(item.createdAt).toLocaleString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US", { numberingSystem: "latn" }))}
              </span>
            </span>
          </button>
        )) : (
          <div className="p-10 text-center text-sm font-semibold text-slate-500">{rtl ? "لا توجد إشعارات" : "No notifications"}</div>
        )}
      </Card>
    </div>
  );
}
