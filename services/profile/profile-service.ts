"use client";

import { z } from "zod";

import { createClient } from "@/lib/supabase/client";
import { genderOptions, type Gender } from "@/types/profile";

const genderSchema = z.enum(genderOptions);

export const profileService = {
  async updateGender(gender: Gender): Promise<Gender> {
    const parsedGender = genderSchema.parse(gender);
    const { data, error } = await createClient().rpc("set_my_gender", {
      p_gender: parsedGender,
    });
    if (error || !genderSchema.safeParse(data).success)
      throw new Error("Cinsiyet bilgisi güncellenemedi.");
    return data as Gender;
  },
};
