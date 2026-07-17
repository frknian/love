import type { PushAvailability } from "@/lib/notifications/push-support";

export interface PushClientState {
  availability: PushAvailability;
  permission: NotificationPermission | "unsupported";
  subscribed: boolean;
}

export interface StoredPushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  expiration_time: number | null;
  p256dh: string;
  auth: string;
}

export interface WebPushPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  url?: string;
}
