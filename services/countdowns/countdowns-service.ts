"use client";

import { z } from "zod";

import { createClient } from "@/lib/supabase/client";
import type { CountdownRow } from "@/types/countdowns";

const countdownInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Başlık gerekli.")
    .max(120, "Başlık en fazla 120 karakter olabilir."),
  icon: z.string().trim().min(1, "Bir simge seç.").max(16),
  targetDate: z
    .string()
    .min(1, "Hedef tarih gerekli.")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: "Geçerli bir tarih seç.",
    })
    .refine((value) => new Date(value).getTime() > Date.now(), {
      message: "Hedef tarih gelecekte olmalı.",
    }),
  coverImage: z
    .string()
    .trim()
    .url("Kapak görseli geçerli bir URL olmalı.")
    .max(2048)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
});

export type CountdownInput = z.input<typeof countdownInputSchema>;

const countdownColumns =
  "id, couple_id, title, icon, target_date, cover_image, created_by, created_at";

export const countdownsService = {
  async create(
    coupleId: string,
    createdBy: string,
    input: CountdownInput,
  ): Promise<CountdownRow> {
    const payload = countdownInputSchema.parse(input);
    const { data, error } = await createClient()
      .from("countdowns")
      .insert({
        couple_id: coupleId,
        created_by: createdBy,
        title: payload.title,
        icon: payload.icon,
        target_date: new Date(payload.targetDate).toISOString(),
        cover_image: payload.coverImage,
      })
      .select(countdownColumns)
      .single();
    if (error) throw new Error("Geri sayım kaydedilemedi.");
    return data as CountdownRow;
  },

  async remove(countdownId: string): Promise<void> {
    const { error } = await createClient()
      .from("countdowns")
      .delete()
      .eq("id", countdownId);
    if (error) throw new Error("Geri sayım silinemedi.");
  },
};
