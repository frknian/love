"use client";

import { z } from "zod";

import { getInteraction } from "@/lib/notifications/interactions";
import { createClient } from "@/lib/supabase/client";
import { getPushProvider } from "@/services/notifications/push-provider";
import type { NotificationRow } from "@/types/notifications";

const sendNotificationSchema = z.object({
  coupleId: z.string().uuid(),
  senderId: z.string().uuid(),
  receiverId: z.string().uuid(),
  type: z.string().trim().min(1).max(60),
  title: z.string().trim().min(1, "Başlık gerekli.").max(120),
  message: z.string().trim().min(1, "Mesaj gerekli.").max(500),
  icon: z.string().trim().min(1).max(16),
  animation: z.string().trim().min(1).max(60),
});

export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;

const notificationColumns =
  "id, couple_id, sender_id, receiver_id, notification_type, title, message, icon, animation, is_read, delivered_at, created_at";

export const notificationsService = {
  /** Katalogdaki bir etkileşimi gönderim girdisine çevirir. */
  buildInteractionInput(
    interactionType: string,
    coupleId: string,
    senderId: string,
    receiverId: string,
  ): SendNotificationInput {
    const interaction = getInteraction(interactionType);
    return {
      coupleId,
      senderId,
      receiverId,
      type: interaction.type,
      title: interaction.title,
      message: interaction.description,
      icon: interaction.icon,
      animation: interaction.animation,
    };
  },

  async send(input: SendNotificationInput): Promise<NotificationRow> {
    const payload = sendNotificationSchema.parse(input);
    const { data, error } = await createClient()
      .from("notifications")
      .insert({
        couple_id: payload.coupleId,
        sender_id: payload.senderId,
        receiver_id: payload.receiverId,
        notification_type: payload.type,
        title: payload.title,
        message: payload.message,
        icon: payload.icon,
        animation: payload.animation,
      })
      .select(notificationColumns)
      .single();
    if (error) throw new Error("Bildirim gönderilemedi.");

    // Push katmanı şimdilik no-op; gerçek sağlayıcı eklendiğinde
    // gönderim akışı değişmeden cihaz bildirimine dönüşür.
    void getPushProvider()
      .notify({
        title: payload.title,
        body: payload.message,
        icon: payload.icon,
        tag: payload.type,
      })
      .catch(() => undefined);

    return data as NotificationRow;
  },

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await createClient()
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);
    if (error) throw new Error("Bildirim okundu olarak işaretlenemedi.");
  },

  /** Alıcının cihazına ulaştığı anı kaydeder (idempotent). */
  async markAsDelivered(notificationId: string): Promise<void> {
    const { error } = await createClient()
      .from("notifications")
      .update({ delivered_at: new Date().toISOString() })
      .eq("id", notificationId)
      .is("delivered_at", null);
    if (error) throw new Error("Bildirim teslim bilgisi kaydedilemedi.");
  },
};
