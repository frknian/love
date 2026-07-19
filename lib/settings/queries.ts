import { cache } from "react";

import { toUserSettings } from "@/lib/settings/settings-mapper";
import { createClient } from "@/lib/supabase/server";
import { defaultUserSettings } from "@/types/settings";
import type { UserSettings, UserSettingsRow } from "@/types/settings";

const settingsColumns =
  "id, user_id, theme, notifications_enabled, haptics_enabled, animation_enabled, language, notification_preferences, created_at, updated_at";

function fallbackSettings(userId: string): UserSettings {
  return {
    ...defaultUserSettings,
    id: userId,
    userId,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Ayar satırı yoksa varsayılan değerlerle oluşturur (ilk giriş senaryosu).
 * Ayarlar tablosu erişilemez durumda olsa bile (ör. migration henüz
 * uygulanmamışsa) tema/ayarlar sayfası dışındaki tüm uygulamanın
 * çökmemesi için sorgu hatalarında varsayılan ayarlara geri döner.
 */
export const getOrCreateUserSettings = cache(
  async function getOrCreateUserSettings(
    userId: string,
  ): Promise<UserSettings> {
    const supabase = await createClient();
    const { data: existing, error: selectError } = await supabase
      .from("user_settings")
      .select(settingsColumns)
      .eq("user_id", userId)
      .maybeSingle();
    if (selectError) {
      console.warn(
        "[settings] Ayarlar okunamadı, varsayılanlara dönülüyor:",
        selectError,
      );
      return fallbackSettings(userId);
    }
    if (existing) return toUserSettings(existing as UserSettingsRow);

    const { data: created, error: insertError } = await supabase
      .from("user_settings")
      .insert({ user_id: userId })
      .select(settingsColumns)
      .single();
    if (insertError) {
      console.warn(
        "[settings] Ayarlar oluşturulamadı, varsayılanlara dönülüyor:",
        insertError,
      );
      return fallbackSettings(userId);
    }
    return toUserSettings(created as UserSettingsRow);
  },
);
