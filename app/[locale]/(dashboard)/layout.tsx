import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { RealtimeProvider } from "@/components/realtime-provider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RealtimeProvider>
      <AppShell>
        <AuthGuard>{children}</AuthGuard>
      </AppShell>
    </RealtimeProvider>
  );
}
