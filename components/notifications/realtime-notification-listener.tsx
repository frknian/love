"use client";

import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { NotificationDetailModal } from "@/components/notifications/notification-detail-modal";
import { triggerHapticForType } from "@/lib/notifications/haptics";
import { toAppNotification } from "@/lib/notifications/notification-mapper";
import { createClient } from "@/lib/supabase/client";
import { notificationsService } from "@/services/notifications/notifications-service";
import { getPushProvider } from "@/services/notifications/push-provider";
import type { AppNotification, NotificationRow } from "@/types/notifications";

interface RealtimeNotificationListenerProps {
  coupleId: string;
  currentUserId: string;
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
      triggerHapticForType(row.notification_type);
      void notificationsService.markAsDelivered(row.id).catch(() => undefined);
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
  }, [coupleId, currentUserId, partnerName]);

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
