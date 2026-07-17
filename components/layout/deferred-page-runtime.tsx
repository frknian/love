"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { useTheme } from "@/components/settings/theme-provider";
import type { EngagementContext } from "@/types/notifications";
import type { NotificationPreferences, ThemeOption } from "@/types/settings";

const NotificationPermissionCard = dynamic(
  () =>
    import("@/components/notifications/notification-permission-card").then(
      (module) => module.NotificationPermissionCard,
    ),
  { ssr: false },
);

const RealtimeNotificationListener = dynamic(
  () =>
    import("@/components/notifications/realtime-notification-listener").then(
      (module) => module.RealtimeNotificationListener,
    ),
  { ssr: false },
);

function useAfterHydration(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready;
}

export function DeferredNotificationPermission() {
  const ready = useAfterHydration();
  return ready ? <NotificationPermissionCard /> : null;
}

interface DeferredRealtimeNotificationsProps {
  engagement: EngagementContext;
  hapticsEnabled: boolean;
  notificationPreferences: NotificationPreferences;
  notificationsEnabled: boolean;
  theme: ThemeOption;
}

export function DeferredRealtimeNotifications({
  engagement,
  hapticsEnabled,
  notificationPreferences,
  notificationsEnabled,
  theme,
}: DeferredRealtimeNotificationsProps) {
  const ready = useAfterHydration();
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme(theme);
  }, [setTheme, theme]);

  if (!ready) return null;
  return (
    <RealtimeNotificationListener
      coupleId={engagement.coupleId}
      currentUserId={engagement.userId}
      hapticsEnabled={hapticsEnabled}
      notificationPreferences={notificationPreferences}
      notificationsEnabled={notificationsEnabled}
      partnerName={engagement.partnerName ?? "Partner"}
    />
  );
}
