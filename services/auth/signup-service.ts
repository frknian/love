"use client";

import { z } from "zod";

import { createClient } from "@/lib/supabase/client";

const signupInputSchema = z
  .object({
    email: z.string().trim().email("Geçerli bir e-posta adresi gir."),
    password: z
      .string()
      .min(8, "Şifre en az 8 karakter olmalı.")
      .max(72, "Şifre en fazla 72 karakter olabilir."),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Şifreler eşleşmiyor.",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof signupInputSchema>;

export interface SignupResult {
  /** true ise oturum hemen açıldı; false ise e-posta onayı bekleniyor. */
  hasSession: boolean;
}

interface SignupOptions {
  redirectTo?: string;
}

export const signupService = {
  async signUp(
    input: SignupInput,
    options?: SignupOptions,
  ): Promise<SignupResult> {
    const payload = signupInputSchema.parse(input);
    const { data, error } = await createClient().auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        emailRedirectTo:
          options?.redirectTo ?? `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("already registered")) {
        throw new Error(
          "Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.",
        );
      }
      throw new Error("Kayıt oluşturulamadı. Lütfen tekrar dene.");
    }

    return { hasSession: Boolean(data.session) };
  },
};
