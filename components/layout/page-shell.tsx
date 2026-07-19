import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import {
  DeferredNotificationPermission,
  DeferredRealtimeNotifications,
} from "@/components/layout/deferred-page-runtime";
import { BottomNavigation } from "@/components/navigation/bottom-navigation";
import { PwaPermissionGate } from "@/components/providers/pwa-permission-gate";
import { getEngagementContext } from "@/lib/notifications/queries";
import { getOrCreateUserSettings } from "@/lib/settings/queries";
import { getCurrentAppUser } from "@/lib/supabase/get-current-user";
import type { UserSettings } from "@/types/settings";
import type { EngagementContext } from "@/types/notifications";

interface PageShellProps {
  children: ReactNode;
}

async function NotificationRuntime({
  engagement,
  settingsPromise,
}: {
  engagement: EngagementContext;
  settingsPromise: Promise<UserSettings>;
}) {
  const settings = await settingsPromise;
  return (
    <DeferredRealtimeNotifications
      engagement={engagement}
      hapticsEnabled={settings.hapticsEnabled}
      notificationPreferences={settings.notificationPreferences}
      notificationsEnabled={settings.notificationsEnabled}
      theme={settings.theme}
    />
  );
}

export async function PageShell({ children }: PageShellProps) {
  const [user, engagement] = await Promise.all([
    getCurrentAppUser(),
    getEngagementContext(),
  ]);

  if (!user) {
    redirect("/login");
  }
  if (!user.coupleId) {
    redirect("/onboarding");
  }

  // Ayarlar, ilk HTML ve sayfa içeriğini engellememesi için arka planda akar.
  const settingsPromise = getOrCreateUserSettings(user.id);
  const coupleNames = engagement
    ? [engagement.displayName, engagement.partnerName]
        .filter(Boolean)
        .join(" 🤍 ")
    : user.name;

  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-28 pt-6 sm:px-6 sm:pt-10">
      <AppHeader
        coupleNames={coupleNames}
        currentUserId={engagement?.userId}
        user={user}
      />
      {children}
      <BottomNavigation />
      <PwaPermissionGate />
      <DeferredNotificationPermission />
      {engagement ? (
        <Suspense fallback={null}>
          <NotificationRuntime
            engagement={engagement}
            settingsPromise={settingsPromise}
          />
        </Suspense>
      ) : null}
    </main>
  );
}
