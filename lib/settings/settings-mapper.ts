import { defaultNotificationPreferences } from "@/types/settings";
import type { UserSettings, UserSettingsRow } from "@/types/settings";

export function toUserSettings(row: UserSettingsRow): UserSettings {
  return {
    id: row.id,
    userId: row.user_id,
    theme: row.theme,
    notificationsEnabled: row.notifications_enabled,
    hapticsEnabled: row.haptics_enabled,
    animationEnabled: row.animation_enabled,
    language: row.language,
    notificationPreferences: {
      ...defaultNotificationPreferences,
      ...row.notification_preferences,
    },
    updatedAt: row.updated_at,
  };
}
