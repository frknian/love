import { cache } from "react";

import { toAppNotification } from "@/lib/notifications/notification-mapper";
import { createClient } from "@/lib/supabase/server";
import type {
  AppNotification,
  EngagementContext,
  NotificationRow,
} from "@/types/notifications";

/**
 * Oturumdaki kullanıcıyı, çiftini ve partner profilini tek seferde çözer.
 * Bildirim gönderimi için partner kimliği zorunludur.
 */
export const getEngagementContext = cache(
  async function getEngagementContext(): Promise<EngagementContext | null> {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: me, error: memberError } = await supabase
      .from("profiles")
      .select("id, couple_id, display_name")
      .eq("id", user.id)
      .maybeSingle();
    if (memberError || !me) return null;

    const { data: partner } = await supabase
      .from("profiles")
      .select("id, couple_id, display_name")
      .eq("couple_id", me.couple_id)
      .neq("id", user.id)
      .maybeSingle();
    const { data: couple } = await supabase
      .from("couples")
      .select("anniversary_date")
      .eq("id", me.couple_id)
      .maybeSingle<{ anniversary_date: string | null }>();

    return {
      userId: user.id,
      coupleId: me.couple_id,
      displayName: me.display_name,
      partnerId: partner?.id ?? null,
      partnerName: partner?.display_name ?? null,
      relationshipStartDate: couple?.anniversary_date ?? null,
    };
  },
);

interface NotificationQueryRow extends NotificationRow {
  sender: { display_name: string } | null;
}

export async function getNotifications(
  limit = 100,
): Promise<AppNotification[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id, couple_id, sender_id, receiver_id, notification_type, title, message, icon, animation, is_read, delivered_at, created_at, sender:profiles!notifications_sender_id_fkey(display_name)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error("Bildirimler yüklenemedi.");

  return ((data ?? []) as unknown as NotificationQueryRow[]).map((row) =>
    toAppNotification(row, row.sender?.display_name ?? "Partner"),
  );
}

export async function getLatestNotification(): Promise<AppNotification | null> {
  const notifications = await getNotifications(1);
  return notifications[0] ?? null;
}
