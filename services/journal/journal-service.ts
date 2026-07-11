"use client";

import { z } from "zod";

import { createClient } from "@/lib/supabase/client";
import { journalMoods, journalWeathers } from "@/types/journal";
import type { JournalRow } from "@/types/journal";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGES = 6;

const journalInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Başlık gerekli.")
    .max(120, "Başlık en fazla 120 karakter olabilir."),
  content: z
    .string()
    .trim()
    .min(1, "İçerik gerekli.")
    .max(4000, "İçerik en fazla 4000 karakter olabilir."),
  mood: z.enum(journalMoods),
  weather: z.enum(journalWeathers).optional().nullable(),
});

export type JournalInput = z.infer<typeof journalInputSchema>;

function validateImages(files: File[]) {
  if (files.length > MAX_IMAGES) {
    throw new Error(`En fazla ${MAX_IMAGES} fotoğraf ekleyebilirsin.`);
  }
  for (const file of files) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      throw new Error("JPEG, PNG veya WebP formatında bir fotoğraf seç.");
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error("Her fotoğraf en fazla 10 MB olabilir.");
    }
  }
}

const journalColumns =
  "id, couple_id, author_id, title, content, mood, weather, images, created_at, updated_at";

export const journalService = {
  async create(
    coupleId: string,
    authorId: string,
    input: JournalInput,
    imageFiles: File[],
  ): Promise<JournalRow> {
    const payload = journalInputSchema.parse(input);
    validateImages(imageFiles);

    const supabase = createClient();
    const images: { path: string }[] = [];

    for (const file of imageFiles) {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${coupleId}/${authorId}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("journal-media")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) {
        await supabase.storage
          .from("journal-media")
          .remove(images.map((image) => image.path));
        throw new Error("Fotoğraflar yüklenemedi. Lütfen tekrar dene.");
      }
      images.push({ path });
    }

    const { data, error } = await supabase
      .from("journals")
      .insert({
        couple_id: coupleId,
        author_id: authorId,
        title: payload.title,
        content: payload.content,
        mood: payload.mood,
        weather: payload.weather ?? null,
        images,
      })
      .select(journalColumns)
      .single();

    if (error) {
      await supabase.storage
        .from("journal-media")
        .remove(images.map((image) => image.path));
      throw new Error("Günlük kaydedilemedi.");
    }

    return data as JournalRow;
  },

  async update(journalId: string, input: JournalInput): Promise<JournalRow> {
    const payload = journalInputSchema.parse(input);
    const { data, error } = await createClient()
      .from("journals")
      .update({
        title: payload.title,
        content: payload.content,
        mood: payload.mood,
        weather: payload.weather ?? null,
      })
      .eq("id", journalId)
      .select(journalColumns)
      .single();
    if (error) throw new Error("Günlük güncellenemedi.");
    return data as JournalRow;
  },

  async remove(journalId: string): Promise<void> {
    const { error } = await createClient()
      .from("journals")
      .delete()
      .eq("id", journalId);
    if (error) throw new Error("Günlük silinemedi.");
  },
};
