"use client";

import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { NotificationDetailModal } from "@/components/notifications/notification-detail-modal";
import { triggerHapticForType } from "@/lib/notifications/haptics";
import { toAppNotification } from "@/lib/notifications/notification-mapper";
import { preferenceByNotificationType } from "@/lib/notifications/notification-preferences";
import { createClient } from "@/lib/supabase/client";
import { notificationsService } from "@/services/notifications/notifications-service";
import { getPushProvider } from "@/services/notifications/push-provider";
import type { AppNotification, NotificationRow } from "@/types/notifications";
import type {
  NotificationPreferences,
} from "@/types/settings";

interface RealtimeNotificationListenerProps {
  coupleId: string;
  currentUserId: string;
  hapticsEnabled: boolean;
  notificationPreferences: NotificationPreferences;
  notificationsEnabled: boolean;
  partnerName: string;
}

/**
 * Uygulama kabuğuna monte edilen global dinleyici: partnerden gelen her
 * bildirimi anında yakalar, titreşim tetikler, teslim zamanını kaydeder ve
 * animasyonlu detay modalını açar.
 */
export function RealtimeNotificationListener({
  coupleId,
  currentUserId,
  hapticsEnabled,
  notificationPreferences,
  notificationsEnabled,
  partnerName,
}: RealtimeNotificationListenerProps) {
  const [incoming, setIncoming] = useState<AppNotification | null>(null);

  useEffect(() => {
    const supabase = createClient();

    function handleInsert(
      payload: RealtimePostgresChangesPayload<NotificationRow>,
    ) {
      const row = payload.new as NotificationRow;
      if (row.couple_id !== coupleId || row.receiver_id !== currentUserId)
        return;
      void notificationsService.markAsDelivered(row.id).catch(() => undefined);
      const preferenceKey = preferenceByNotificationType[row.notification_type];
      if (
        !notificationsEnabled ||
        (preferenceKey && !notificationPreferences[preferenceKey])
      )
        return;
      if (hapticsEnabled) triggerHapticForType(row.notification_type);
      void getPushProvider()
        .notify({
          title: `${row.icon} ${row.title}`,
          body: row.message,
          tag: `interaction:${row.id}`,
        })
        .catch(() => undefined);
      setIncoming(toAppNotification(row, partnerName));
    }

    const channel = supabase
      .channel(`incoming-notifications:${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `receiver_id=eq.${currentUserId}`,
        },
        handleInsert,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [
    coupleId,
    currentUserId,
    hapticsEnabled,
    notificationPreferences,
    notificationsEnabled,
    partnerName,
  ]);

  if (!incoming) return null;

  return (
    <NotificationDetailModal
      notification={incoming}
      onClose={() => {
        void notificationsService
          .markAsRead(incoming.id)
          .catch(() => undefined);
        setIncoming(null);
      }}
    />
  );
}
