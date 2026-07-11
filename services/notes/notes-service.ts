"use client";

import { z } from "zod";

import { createClient } from "@/lib/supabase/client";
import { OfflineQueuedError, queueNoteCreate } from "@/lib/offline/note-queue";
import type { NoteRow } from "@/types/notes";

const noteInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Başlık gerekli.")
    .max(120, "Başlık en fazla 120 karakter olabilir."),
  content: z
    .string()
    .trim()
    .min(1, "Not içeriği gerekli.")
    .max(2000, "Not en fazla 2000 karakter olabilir."),
  color: z.enum(["yellow", "pink", "blue", "green", "purple"]),
  pinned: z.boolean(),
});

export type NoteInput = z.infer<typeof noteInputSchema>;

export function validateNoteInput(input: NoteInput) {
  return noteInputSchema.parse(input);
}

export const notesService = {
  async create(coupleId: string, authorId: string, input: NoteInput) {
    const payload = validateNoteInput(input);
    if (!navigator.onLine) {
      await queueNoteCreate(coupleId, authorId, payload);
      throw new OfflineQueuedError();
    }
    const { data, error } = await createClient()
      .from("notes")
      .insert({ couple_id: coupleId, author_id: authorId, ...payload })
      .select(
        "id, couple_id, author_id, title, content, color, pinned, created_at, updated_at",
      )
      .single();
    if (error) throw new Error("Not kaydedilemedi.");
    return data as NoteRow;
  },

  async update(noteId: string, input: NoteInput) {
    const payload = validateNoteInput(input);
    const { data, error } = await createClient()
      .from("notes")
      .update(payload)
      .eq("id", noteId)
      .select(
        "id, couple_id, author_id, title, content, color, pinned, created_at, updated_at",
      )
      .single();
    if (error) throw new Error("Not güncellenemedi.");
    return data as NoteRow;
  },

  async remove(noteId: string) {
    const { error } = await createClient()
      .from("notes")
      .delete()
      .eq("id", noteId);
    if (error) throw new Error("Not silinemedi.");
  },
};
