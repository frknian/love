"use client";

import { z } from "zod";

import { createClient } from "@/lib/supabase/client";
import type {
  CapsuleAttachment,
  TimeCapsuleContent,
  TimeCapsuleRow,
} from "@/types/capsule";

const ACCEPTED_ATTACHMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "application/pdf",
];
const MAX_ATTACHMENT_SIZE_BYTES = 50 * 1024 * 1024;
const MAX_ATTACHMENTS = 5;

const capsuleInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Başlık gerekli.")
    .max(120, "Başlık en fazla 120 karakter olabilir."),
  message: z
    .string()
    .trim()
    .min(1, "Mesaj gerekli.")
    .max(4000, "Mesaj en fazla 4000 karakter olabilir."),
  unlockDate: z
    .string()
    .min(1, "Açılma tarihi gerekli.")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: "Geçerli bir tarih seç.",
    })
    .refine((value) => new Date(value).getTime() > Date.now(), {
      message: "Açılma tarihi gelecekte olmalı.",
    }),
});

export type CapsuleInput = z.infer<typeof capsuleInputSchema>;

function validateAttachments(files: File[]) {
  if (files.length > MAX_ATTACHMENTS) {
    throw new Error(`En fazla ${MAX_ATTACHMENTS} ek ekleyebilirsin.`);
  }
  for (const file of files) {
    if (!ACCEPTED_ATTACHMENT_TYPES.includes(file.type)) {
      throw new Error(
        "Desteklenmeyen dosya türü. Fotoğraf, video veya PDF seç.",
      );
    }
    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      throw new Error("Her dosya en fazla 50 MB olabilir.");
    }
  }
}

const capsuleColumns =
  "id, couple_id, author_id, title, unlock_date, opened, opened_at, created_at";

export const capsuleService = {
  async create(
    coupleId: string,
    authorId: string,
    input: CapsuleInput,
    attachmentFiles: File[],
  ): Promise<TimeCapsuleRow> {
    const payload = capsuleInputSchema.parse(input);
    validateAttachments(attachmentFiles);

    const supabase = createClient();
    const attachments: CapsuleAttachment[] = [];

    for (const file of attachmentFiles) {
      const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
      const path = `${coupleId}/${authorId}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("capsules")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) {
        await supabase.storage
          .from("capsules")
          .remove(attachments.map((attachment) => attachment.path));
        throw new Error("Ekler yüklenemedi. Lütfen tekrar dene.");
      }
      attachments.push({
        path,
        name: file.name,
        type: file.type,
        size: file.size,
      });
    }

    const { data, error } = await supabase
      .from("time_capsules")
      .insert({
        couple_id: coupleId,
        author_id: authorId,
        title: payload.title,
        message: payload.message,
        attachments,
        unlock_date: new Date(payload.unlockDate).toISOString(),
      })
      .select(capsuleColumns)
      .single();

    if (error) {
      await supabase.storage
        .from("capsules")
        .remove(attachments.map((attachment) => attachment.path));
      throw new Error("Zaman kapsülü kaydedilemedi.");
    }

    return data as TimeCapsuleRow;
  },

  async getContent(capsuleId: string): Promise<TimeCapsuleContent> {
    const { data, error } = await createClient()
      .rpc("get_time_capsule_content", { target_id: capsuleId })
      .single();
    if (error || !data) throw new Error("Mesaj henüz açılamıyor.");
    const row = data as { message: string; attachments: CapsuleAttachment[] };
    return { message: row.message, attachments: row.attachments ?? [] };
  },

  async getAttachmentUrl(path: string): Promise<string | null> {
    const { data } = await createClient()
      .storage.from("capsules")
      .createSignedUrl(path, 60 * 10);
    return data?.signedUrl ?? null;
  },

  async markOpened(capsuleId: string): Promise<void> {
    const { error } = await createClient()
      .from("time_capsules")
      .update({ opened: true, opened_at: new Date().toISOString() })
      .eq("id", capsuleId);
    if (error) throw new Error("Kapsül açılış durumu kaydedilemedi.");
  },

  async remove(capsuleId: string): Promise<void> {
    const { error } = await createClient()
      .from("time_capsules")
      .delete()
      .eq("id", capsuleId);
    if (error) throw new Error("Zaman kapsülü silinemedi.");
  },
};
