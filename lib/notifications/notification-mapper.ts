import type { AppNotification, NotificationRow } from "@/types/notifications";
import { isAnimationKey } from "@/types/notifications";

export function toAppNotification(
  row: NotificationRow,
  senderName: string,
): AppNotification {
  return {
    id: row.id,
    coupleId: row.couple_id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    type: row.notification_type,
    title: row.title,
    message: row.message,
    icon: row.icon,
    animation: isAnimationKey(row.animation)
      ? row.animation
      : "floating-hearts",
    isRead: row.is_read,
    deliveredAt: row.delivered_at,
    createdAt: row.created_at,
    senderName,
  };
}
