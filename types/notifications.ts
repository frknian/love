export const animationKeys = [
  "floating-hearts",
  "hug",
  "kiss",
  "petals",
  "coffee",
  "sun-rays",
  "moon-stars",
  "love-letter",
  "camera",
  "confetti",
  "music",
  "wish",
  "celebrate",
  "birthday",
  "fireworks",
] as const;

export type AnimationKey = (typeof animationKeys)[number];

export function isAnimationKey(value: string): value is AnimationKey {
  return (animationKeys as readonly string[]).includes(value);
}

export interface InteractionColor {
  /** İkon balonu ve rozetler için arka plan + metin sınıfları. */
  bubble: string;
  /** Etkileşim butonunun yüzeyi. */
  surface: string;
  /** Vurgu metni. */
  accent: string;
}

export interface InteractionDefinition {
  type: string;
  icon: string;
  title: string;
  description: string;
  animation: AnimationKey;
  color: InteractionColor;
  /** navigator.vibrate ile uyumlu titreşim deseni (ms). */
  hapticPattern: number[];
}

export interface NotificationRow {
  id: string;
  couple_id: string;
  sender_id: string;
  receiver_id: string;
  notification_type: string;
  title: string;
  message: string;
  icon: string;
  animation: string;
  is_read: boolean;
  delivered_at: string | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  coupleId: string;
  senderId: string;
  receiverId: string;
  type: string;
  title: string;
  message: string;
  icon: string;
  animation: AnimationKey;
  isRead: boolean;
  deliveredAt: string | null;
  createdAt: string;
  senderName: string;
}

export const notificationFilters = [
  "all",
  "unread",
  "sent",
  "received",
] as const;

export type NotificationFilter = (typeof notificationFilters)[number];

export interface EngagementContext {
  userId: string;
  coupleId: string;
  displayName: string;
  partnerId: string | null;
  partnerName: string | null;
  relationshipStartDate: string | null;
}
