import { toUserSettings } from "@/lib/settings/settings-mapper";
import { createClient } from "@/lib/supabase/server";
import type { UserSettings, UserSettingsRow } from "@/types/settings";

const settingsColumns =
  "id, user_id, theme, notifications_enabled, haptics_enabled, animation_enabled, language, notification_preferences, created_at, updated_at";

/** Ayar satırı yoksa varsayılan değerlerle oluşturur (ilk giriş senaryosu). */
export async function getOrCreateUserSettings(
  userId: string,
): Promise<UserSettings> {
  const supabase = await createClient();
  const { data: existing, error: selectError } = await supabase
    .from("user_settings")
    .select(settingsColumns)
    .eq("user_id", userId)
    .maybeSingle();
  if (selectError) throw new Error("Ayarlar yüklenemedi.");
  if (existing) return toUserSettings(existing as UserSettingsRow);

  const { data: created, error: insertError } = await supabase
    .from("user_settings")
    .insert({ user_id: userId })
    .select(settingsColumns)
    .single();
  if (insertError) throw new Error("Ayarlar oluşturulamadı.");
  return toUserSettings(created as UserSettingsRow);
}
