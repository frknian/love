"use client";

import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";

import { triggerHapticForType } from "@/lib/notifications/haptics";
import { toAppNotification } from "@/lib/notifications/notification-mapper";
import { createClient } from "@/lib/supabase/client";
import { notificationsService } from "@/services/notifications/notifications-service";
import type {
  AppNotification,
  NotificationFilter,
  NotificationRow,
} from "@/types/notifications";

interface UseNotificationsOptions {
  initialNotifications: AppNotification[];
  coupleId: string;
  currentUserId: string;
  currentUserName: string;
  partnerName: string;
  /** Gelen bildirimde overlay/haptic tetiklemek isteyen ekranlar için. */
  onIncoming?: (notification: AppNotification) => void;
}

function orderNotifications(notifications: AppNotification[]) {
  return [...notifications].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() -
      new Date(first.createdAt).getTime(),
  );
}

export function useNotifications({
  initialNotifications,
  coupleId,
  currentUserId,
  currentUserName,
  partnerName,
  onIncoming,
}: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState(() =>
    orderNotifications(initialNotifications),
  );
  const [realtimeError, setRealtimeError] = useState<string>();

  const upsert = useCallback((notification: AppNotification) => {
    setNotifications((current) =>
      orderNotifications([
        notification,
        ...current.filter((item) => item.id !== notification.id),
      ]),
    );
  }, []);

  useEffect(() => {
    const supabase = createClient();

    function handleChange(
      payload: RealtimePostgresChangesPayload<NotificationRow>,
    ) {
      if (payload.eventType === "DELETE") return;
      const row = payload.new as NotificationRow;
      if (row.couple_id !== coupleId) return;

      const senderName =
        row.sender_id === currentUserId ? currentUserName : partnerName;
      const notification = toAppNotification(row, senderName);
      upsert(notification);

      if (payload.eventType === "INSERT" && row.receiver_id === currentUserId) {
        triggerHapticForType(row.notification_type);
        void notificationsService
          .markAsDelivered(row.id)
          .catch(() => undefined);
        onIncoming?.(notification);
      }
    }

    const channel = supabase
      .channel(`notifications:${coupleId}:${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `couple_id=eq.${coupleId}`,
        },
        handleChange,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `couple_id=eq.${coupleId}`,
        },
        handleChange,
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT")
          setRealtimeError("Canlı bildirimler geçici olarak kullanılamıyor.");
        if (status === "SUBSCRIBED") setRealtimeError(undefined);
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [
    coupleId,
    currentUserId,
    currentUserName,
    onIncoming,
    partnerName,
    upsert,
  ]);

  const markAsRead = useCallback(async (notificationId: string) => {
    await notificationsService.markAsRead(notificationId);
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification,
      ),
    );
  }, []);

  const filterNotifications = useCallback(
    (filter: NotificationFilter) =>
      notifications.filter((notification) => {
        switch (filter) {
          case "unread":
            return (
              !notification.isRead && notification.receiverId === currentUserId
            );
          case "sent":
            return notification.senderId === currentUserId;
          case "received":
            return notification.receiverId === currentUserId;
          default:
            return true;
        }
      }),
    [currentUserId, notifications],
  );

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          !notification.isRead && notification.receiverId === currentUserId,
      ).length,
    [currentUserId, notifications],
  );

  return useMemo(
    () => ({
      notifications,
      filterNotifications,
      unreadCount,
      realtimeError,
      markAsRead,
      upsert,
    }),
    [
      filterNotifications,
      markAsRead,
      notifications,
      realtimeError,
      unreadCount,
      upsert,
    ],
  );
}
