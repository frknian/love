export const themeOptions = ["light", "dark", "system"] as const;

export type ThemeOption = (typeof themeOptions)[number];

export const languageOptions = ["tr", "en"] as const;

export type LanguageOption = (typeof languageOptions)[number];

export const notificationPreferenceKeys = [
  "miss_you",
  "hug",
  "good_morning",
  "good_night",
  "new_note",
  "new_memory",
  "new_journal",
  "upcoming_event",
  "capsule_opened",
  "mood_changed",
  "partner_call",
  "hunger_alert",
  "plan_request",
  "plan_response",
  "highlight_memory",
] as const;

export type NotificationPreferenceKey =
  (typeof notificationPreferenceKeys)[number];

export type NotificationPreferences = Record<
  NotificationPreferenceKey,
  boolean
>;

export interface UserSettingsRow {
  id: string;
  user_id: string;
  theme: ThemeOption;
  notifications_enabled: boolean;
  haptics_enabled: boolean;
  animation_enabled: boolean;
  language: LanguageOption;
  notification_preferences: NotificationPreferences;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  theme: ThemeOption;
  notificationsEnabled: boolean;
  hapticsEnabled: boolean;
  animationEnabled: boolean;
  language: LanguageOption;
  notificationPreferences: NotificationPreferences;
  updatedAt: string;
}

export const defaultNotificationPreferences: NotificationPreferences = {
  miss_you: true,
  hug: true,
  good_morning: true,
  good_night: true,
  new_note: true,
  new_memory: true,
  new_journal: true,
  upcoming_event: true,
  capsule_opened: true,
  mood_changed: true,
  partner_call: true,
  hunger_alert: true,
  plan_request: true,
  plan_response: true,
  highlight_memory: true,
};

export const defaultUserSettings: Omit<
  UserSettings,
  "id" | "userId" | "updatedAt"
> = {
  theme: "system",
  notificationsEnabled: true,
  hapticsEnabled: true,
  animationEnabled: true,
  language: "tr",
  notificationPreferences: defaultNotificationPreferences,
};
