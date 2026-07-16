"use client";

import { LogoutButton } from "@/components/auth/logout-button";
import { LanguageSwitcher } from "@/components/settings/language-switcher";
import { NotificationPreferencesCard } from "@/components/settings/notification-preferences-card";
import { ThemeSwitcher } from "@/components/settings/theme-switcher";
import { ToggleRow } from "@/components/settings/toggle-row";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast-provider";
import { useSettings } from "@/hooks/use-settings";
import type { NotificationPreferenceKey, UserSettings } from "@/types/settings";

interface SettingsWorkspaceProps {
  initialSettings: UserSettings;
  userId: string;
}

export function SettingsWorkspace({
  initialSettings,
  userId,
}: SettingsWorkspaceProps) {
  const { settings, update, isSaving } = useSettings({
    initialSettings,
    userId,
  });
  const { showToast } = useToast();

  async function handleUpdate(
    label: string,
    updater: Parameters<typeof update>[0],
  ) {
    try {
      await update(updater);
      showToast(`${label} güncellendi.`);
    } catch {
      showToast(`${label} güncellenemedi.`, "error");
    }
  }

  function handleNotificationPreferenceChange(
    key: NotificationPreferenceKey,
    value: boolean,
  ) {
    void handleUpdate("Bildirim tercihi", {
      notificationPreferences: { [key]: value },
    });
  }

  return (
    <div className="mt-8 space-y-4">
      <Card className="w-full overflow-hidden">
        <p className="font-semibold text-slate-800 dark:text-slate-100">Tema</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Açık, koyu veya sistem temasını takip et.
        </p>
        <div className="mt-3">
          <ThemeSwitcher
            disabled={isSaving}
            onChange={(theme) => void handleUpdate("Tema", { theme })}
            value={settings.theme}
          />
        </div>
      </Card>

      <Card className="w-full overflow-hidden">
        <p className="font-semibold text-slate-800 dark:text-slate-100">
          Genel tercihler
        </p>
        <div className="mt-2 divide-y divide-rose-100/70 dark:divide-white/5">
          <ToggleRow
            checked={settings.notificationsEnabled}
            disabled={isSaving}
            label="Bildirimler"
            onChange={(value) =>
              void handleUpdate("Bildirimler", { notificationsEnabled: value })
            }
          />
          <ToggleRow
            checked={settings.animationEnabled}
            disabled={isSaving}
            label="Animasyonlar"
            onChange={(value) =>
              void handleUpdate("Animasyonlar", { animationEnabled: value })
            }
          />
          <ToggleRow
            checked={settings.hapticsEnabled}
            disabled={isSaving}
            label="Titreşim"
            onChange={(value) =>
              void handleUpdate("Titreşim", { hapticsEnabled: value })
            }
          />
        </div>
      </Card>

      <Card className="w-full overflow-hidden">
        <p className="font-semibold text-slate-800 dark:text-slate-100">Dil</p>
        <div className="mt-3">
          <LanguageSwitcher
            disabled={isSaving}
            onChange={(language) => void handleUpdate("Dil", { language })}
            value={settings.language}
          />
        </div>
      </Card>

      <NotificationPreferencesCard
        disabled={isSaving || !settings.notificationsEnabled}
        onChange={handleNotificationPreferenceChange}
        preferences={settings.notificationPreferences}
      />

      <Card className="w-full overflow-hidden">
        <p className="font-semibold text-slate-800 dark:text-slate-100">
          Oturum
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Bu cihazdaki güvenli oturumunu sonlandır.
        </p>
        <div className="mt-5">
          <LogoutButton />
        </div>
      </Card>
    </div>
  );
}
