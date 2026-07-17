import "server-only";

import webPush from "web-push";

import { notificationTypeIsEnabled } from "@/lib/notifications/notification-preferences";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { StoredPushSubscription, WebPushPayload } from "@/types/push";
import type { NotificationPreferences } from "@/types/settings";

let vapidConfigured = false;

function configureVapid() {
  if (vapidConfigured) return;

  const publicKey = process.env.WEB_PUSH_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY;
  const subject = process.env.WEB_PUSH_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    throw new Error("Web Push environment variables are not configured.");
  }

  webPush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

interface PushError {
  statusCode?: number;
}

export interface PushDeliveryResult {
  sent: number;
  removed: number;
  failed: number;
  skipped: boolean;
}

export async function sendWebPushToUser(
  userId: string,
  payload: WebPushPayload,
  notificationType?: string,
): Promise<PushDeliveryResult> {
  configureVapid();
  const admin = getSupabaseAdminClient();

  if (notificationType) {
    const { data: settings } = await admin
      .from("user_settings")
      .select("notifications_enabled, notification_preferences")
      .eq("user_id", userId)
      .maybeSingle();

    if (
      settings?.notifications_enabled === false ||
      !notificationTypeIsEnabled(
        notificationType,
        settings?.notification_preferences as
          Partial<NotificationPreferences> | undefined,
      )
    ) {
      return { sent: 0, removed: 0, failed: 0, skipped: true };
    }
  }

  const { data, error } = await admin
    .from("push_subscriptions")
    .select("id, user_id, endpoint, expiration_time, p256dh, auth")
    .eq("user_id", userId);
  if (error) throw new Error("Push subscriptions could not be loaded.");

  const subscriptions = (data ?? []) as StoredPushSubscription[];
  const results = await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: subscription.endpoint,
            expirationTime: subscription.expiration_time,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          JSON.stringify(payload),
          { TTL: 60, urgency: "high" },
        );
        return "sent" as const;
      } catch (error) {
        const statusCode = (error as PushError).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await admin
            .from("push_subscriptions")
            .delete()
            .eq("id", subscription.id);
          return "removed" as const;
        }
        return "failed" as const;
      }
    }),
  );

  return {
    sent: results.filter((result) => result === "sent").length,
    removed: results.filter((result) => result === "removed").length,
    failed: results.filter((result) => result === "failed").length,
    skipped: false,
  };
}
