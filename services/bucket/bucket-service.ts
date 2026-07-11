"use client";

import { z } from "zod";

import { createClient } from "@/lib/supabase/client";
import { bucketItemPriorities, bucketListColors } from "@/types/bucket";
import type { BucketItemRow, BucketListRow } from "@/types/bucket";

const bucketListInputSchema = z.object({
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
  color: z.enum(bucketListColors),
  coverImage: z
    .string()
    .trim()
    .url("Kapak görseli geçerli bir URL olmalı.")
    .max(2048)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
});

export type BucketListInput = z.infer<typeof bucketListInputSchema>;

const bucketItemInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Başlık gerekli.")
    .max(160, "Başlık en fazla 160 karakter olabilir."),
  description: z
    .string()
    .trim()
    .max(1000, "Açıklama en fazla 1000 karakter olabilir.")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
  priority: z.enum(bucketItemPriorities),
});

export type BucketItemInput = z.infer<typeof bucketItemInputSchema>;

const listColumns =
  "id, couple_id, title, description, cover_image, color, created_by, created_at";
const itemColumns =
  "id, bucket_list_id, couple_id, title, description, priority, position, completed, completed_at, completed_by, created_at";

export const bucketService = {
  async createList(
    coupleId: string,
    createdBy: string,
    input: BucketListInput,
  ): Promise<BucketListRow> {
    const payload = bucketListInputSchema.parse(input);
    const { data, error } = await createClient()
      .from("bucket_lists")
      .insert({
        couple_id: coupleId,
        created_by: createdBy,
        title: payload.title,
        description: payload.description,
        color: payload.color,
        cover_image: payload.coverImage,
      })
      .select(listColumns)
      .single();
    if (error) throw new Error("Liste oluşturulamadı.");
    return data as BucketListRow;
  },

  async removeList(listId: string): Promise<void> {
    const { error } = await createClient()
      .from("bucket_lists")
      .delete()
      .eq("id", listId);
    if (error) throw new Error("Liste silinemedi.");
  },

  async createItem(
    bucketListId: string,
    coupleId: string,
    position: number,
    input: BucketItemInput,
  ): Promise<BucketItemRow> {
    const payload = bucketItemInputSchema.parse(input);
    const { data, error } = await createClient()
      .from("bucket_items")
      .insert({
        bucket_list_id: bucketListId,
        couple_id: coupleId,
        title: payload.title,
        description: payload.description,
        priority: payload.priority,
        position,
      })
      .select(itemColumns)
      .single();
    if (error) throw new Error("Madde eklenemedi.");
    return data as BucketItemRow;
  },

  async toggleCompleted(
    itemId: string,
    completed: boolean,
    completedBy: string | null,
  ): Promise<BucketItemRow> {
    const { data, error } = await createClient()
      .from("bucket_items")
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        completed_by: completed ? completedBy : null,
      })
      .eq("id", itemId)
      .select(itemColumns)
      .single();
    if (error) throw new Error("Madde güncellenemedi.");
    return data as BucketItemRow;
  },

  async reorderItems(
    updates: { id: string; position: number }[],
  ): Promise<void> {
    const supabase = createClient();
    const results = await Promise.all(
      updates.map(({ id, position }) =>
        supabase.from("bucket_items").update({ position }).eq("id", id),
      ),
    );
    if (results.some((result) => result.error)) {
      throw new Error("Sıralama kaydedilemedi.");
    }
  },

  async removeItem(itemId: string): Promise<void> {
    const { error } = await createClient()
      .from("bucket_items")
      .delete()
      .eq("id", itemId);
    if (error) throw new Error("Madde silinemedi.");
  },
};
