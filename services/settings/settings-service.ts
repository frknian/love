"use client";

import { z } from "zod";

import { createClient } from "@/lib/supabase/client";
import {
  languageOptions,
  notificationPreferenceKeys,
  themeOptions,
} from "@/types/settings";
import type {
  NotificationPreferences,
  UserSettingsRow,
} from "@/types/settings";

const settingsUpdateSchema = z.object({
  theme: z.enum(themeOptions).optional(),
  notificationsEnabled: z.boolean().optional(),
  hapticsEnabled: z.boolean().optional(),
  animationEnabled: z.boolean().optional(),
  language: z.enum(languageOptions).optional(),
  notificationPreferences: z
    .object(
      Object.fromEntries(
        notificationPreferenceKeys.map((key) => [key, z.boolean()]),
      ) as Record<(typeof notificationPreferenceKeys)[number], z.ZodBoolean>,
    )
    .partial()
    .optional(),
});

export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;

const settingsColumns =
  "id, user_id, theme, notifications_enabled, haptics_enabled, animation_enabled, language, notification_preferences, created_at, updated_at";

export const settingsService = {
  async update(
    userId: string,
    input: SettingsUpdateInput,
    currentPreferences: NotificationPreferences = {} as NotificationPreferences,
  ): Promise<UserSettingsRow> {
    const payload = settingsUpdateSchema.parse(input);
    const { data, error } = await createClient()
      .from("user_settings")
      .update({
        ...(payload.theme ? { theme: payload.theme } : {}),
        ...(payload.notificationsEnabled !== undefined
          ? { notifications_enabled: payload.notificationsEnabled }
          : {}),
        ...(payload.hapticsEnabled !== undefined
          ? { haptics_enabled: payload.hapticsEnabled }
          : {}),
        ...(payload.animationEnabled !== undefined
          ? { animation_enabled: payload.animationEnabled }
          : {}),
        ...(payload.language ? { language: payload.language } : {}),
        ...(payload.notificationPreferences
          ? {
              notification_preferences: {
                ...currentPreferences,
                ...payload.notificationPreferences,
              },
            }
          : {}),
      })
      .eq("user_id", userId)
      .select(settingsColumns)
      .single();
    if (error) throw new Error("Ayarlar güncellenemedi.");
    return data as UserSettingsRow;
  },
};
