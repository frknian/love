"use client";

import { Card } from "@/components/ui/card";
import { ToggleRow } from "@/components/settings/toggle-row";
import { notificationPreferenceKeys } from "@/types/settings";
import type {
  NotificationPreferenceKey,
  NotificationPreferences,
} from "@/types/settings";

interface NotificationPreferencesCardProps {
  preferences: NotificationPreferences;
  onChange: (key: NotificationPreferenceKey, value: boolean) => void;
  disabled?: boolean;
}

const labels: Record<NotificationPreferenceKey, string> = {
  miss_you: "❤️ Seni Özledim",
  hug: "🤗 Sarıldım",
  good_morning: "🌞 Günaydın",
  good_night: "🌙 İyi Geceler",
  new_note: "💌 Yeni Not",
  new_memory: "📸 Yeni Anı",
  new_journal: "📓 Yeni Günlük",
  upcoming_event: "📅 Yaklaşan Etkinlik",
  capsule_opened: "⏳ Time Capsule Açıldı",
};

export function NotificationPreferencesCard({
  preferences,
  onChange,
  disabled,
}: NotificationPreferencesCardProps) {
  return (
    <Card>
      <p className="font-semibold text-slate-800 dark:text-slate-100">
        Bildirim türleri
      </p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Hangi bildirim türlerini almak istediğini seç.
      </p>
      <div className="mt-3 divide-y divide-rose-100/70 dark:divide-white/5">
        {notificationPreferenceKeys.map((key) => (
          <ToggleRow
            checked={preferences[key]}
            disabled={disabled}
            key={key}
            label={labels[key]}
            onChange={(value) => onChange(key, value)}
          />
        ))}
      </div>
    </Card>
  );
}
