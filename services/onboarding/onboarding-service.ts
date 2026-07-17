"use client";

import { z } from "zod";

import { createClient } from "@/lib/supabase/client";
import type { CreateCoupleResult, JoinCoupleResult } from "@/types/onboarding";
import { genderOptions, type Gender } from "@/types/profile";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;

const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Adını gir.")
  .max(80, "Ad en fazla 80 karakter olabilir.");

const inviteCodeSchema = z
  .string()
  .trim()
  .min(1, "Davet kodunu gir.")
  .max(16, "Geçersiz davet kodu.");

const genderSchema = z.enum(genderOptions);

function validateAvatar(file: File | null) {
  if (!file) return;
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Avatar JPEG, PNG veya WebP formatında olmalı.");
  }
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    throw new Error("Avatar en fazla 5 MB olabilir.");
  }
}

async function uploadAvatar(
  userId: string,
  file: File | null,
): Promise<string | null> {
  if (!file) return null;
  validateAvatar(file);

  const supabase = createClient();
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error("Avatar yüklenemedi. Lütfen tekrar dene.");

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

export const onboardingService = {
  async createCouple(
    userId: string,
    displayName: string,
    gender: Gender,
    avatarFile: File | null,
  ): Promise<CreateCoupleResult> {
    const name = displayNameSchema.parse(displayName);
    const parsedGender = genderSchema.parse(gender);
    const avatarUrl = await uploadAvatar(userId, avatarFile);

    const { data, error } = await createClient()
      .rpc("create_couple_and_profile", {
        p_display_name: name,
        p_avatar_url: avatarUrl,
        p_gender: parsedGender,
      })
      .single();

    if (error || !data) {
      throw new Error(
        error?.message ?? "Çift oluşturulamadı. Lütfen tekrar dene.",
      );
    }

    const row = data as { couple_id: string; invite_code: string };
    return { coupleId: row.couple_id, inviteCode: row.invite_code };
  },

  async joinCouple(
    userId: string,
    inviteCode: string,
    displayName: string,
    gender: Gender,
    avatarFile: File | null,
  ): Promise<JoinCoupleResult> {
    const name = displayNameSchema.parse(displayName);
    const code = inviteCodeSchema.parse(inviteCode);
    const parsedGender = genderSchema.parse(gender);
    const avatarUrl = await uploadAvatar(userId, avatarFile);

    const { data, error } = await createClient()
      .rpc("join_couple_by_code", {
        p_code: code,
        p_display_name: name,
        p_avatar_url: avatarUrl,
        p_gender: parsedGender,
      })
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Çifte katılamadın. Kodu kontrol et.");
    }

    const row = data as { couple_id: string };
    return { coupleId: row.couple_id };
  },
};
