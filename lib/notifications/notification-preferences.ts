import type {
  NotificationPreferenceKey,
  NotificationPreferences,
} from "@/types/settings";

export const preferenceByNotificationType: Partial<
  Record<string, NotificationPreferenceKey>
> = {
  miss_you: "miss_you",
  hug: "hug",
  good_morning: "good_morning",
  good_night: "good_night",
  note: "new_note",
  memory: "new_memory",
  journal: "new_journal",
  upcoming_event: "upcoming_event",
  capsule_opened: "capsule_opened",
  mood_changed: "mood_changed",
  partner_call: "partner_call",
  hunger_alert: "hunger_alert",
  plan_request: "plan_request",
  plan_response: "plan_response",
  highlight_memory: "highlight_memory",
};

export function notificationTypeIsEnabled(
  type: string,
  preferences: Partial<NotificationPreferences> | null | undefined,
): boolean {
  const key = preferenceByNotificationType[type];
  return !key || preferences?.[key] !== false;
}
