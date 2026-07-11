"use client";

import { z } from "zod";

import { createClient } from "@/lib/supabase/client";
import { eventTypes, type EventRow } from "@/types/events";

const eventInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Başlık gerekli.")
    .max(120, "Başlık en fazla 120 karakter olabilir."),
  description: z
    .string()
    .trim()
    .max(1000, "Açıklama en fazla 1000 karakter olabilir.")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
  eventType: z.enum(eventTypes),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih seç."),
  repeatYearly: z.boolean(),
  coverImage: z
    .string()
    .trim()
    .url("Kapak görseli geçerli bir URL olmalı.")
    .max(2048)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
});

export type EventInput = z.input<typeof eventInputSchema>;

const eventColumns =
  "id, couple_id, title, description, event_type, event_date, repeat_yearly, cover_image, created_by, created_at";

export const eventsService = {
  async create(
    coupleId: string,
    createdBy: string,
    input: EventInput,
  ): Promise<EventRow> {
    const payload = eventInputSchema.parse(input);
    const { data, error } = await createClient()
      .from("events")
      .insert({
        couple_id: coupleId,
        created_by: createdBy,
        title: payload.title,
        description: payload.description,
        event_type: payload.eventType,
        event_date: payload.eventDate,
        repeat_yearly: payload.repeatYearly,
        cover_image: payload.coverImage,
      })
      .select(eventColumns)
      .single();
    if (error) throw new Error("Etkinlik kaydedilemedi.");
    return data as EventRow;
  },

  async update(eventId: string, input: EventInput): Promise<EventRow> {
    const payload = eventInputSchema.parse(input);
    const { data, error } = await createClient()
      .from("events")
      .update({
        title: payload.title,
        description: payload.description,
        event_type: payload.eventType,
        event_date: payload.eventDate,
        repeat_yearly: payload.repeatYearly,
        cover_image: payload.coverImage,
      })
      .eq("id", eventId)
      .select(eventColumns)
      .single();
    if (error) throw new Error("Etkinlik güncellenemedi.");
    return data as EventRow;
  },

  async remove(eventId: string): Promise<void> {
    const { error } = await createClient()
      .from("events")
      .delete()
      .eq("id", eventId);
    if (error) throw new Error("Etkinlik silinemedi.");
  },
};
