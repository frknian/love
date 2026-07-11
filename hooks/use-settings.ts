"use client";

import { useCallback, useMemo, useState } from "react";

import { useTheme } from "@/components/settings/theme-provider";
import { toUserSettings } from "@/lib/settings/settings-mapper";
import {
  settingsService,
  type SettingsUpdateInput,
} from "@/services/settings/settings-service";
import type { UserSettings } from "@/types/settings";

interface UseSettingsOptions {
  initialSettings: UserSettings;
  userId: string;
}

export function useSettings({ initialSettings, userId }: UseSettingsOptions) {
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const { setTheme } = useTheme();

  const update = useCallback(
    async (input: SettingsUpdateInput) => {
      setIsSaving(true);
      setError(undefined);
      try {
        const row = await settingsService.update(
          userId,
          input,
          settings.notificationPreferences,
        );
        const next = toUserSettings(row);
        setSettings(next);
        if (input.theme) setTheme(input.theme);
        return next;
      } catch {
        setError("Ayarlar kaydedilemedi. Lütfen tekrar dene.");
        throw new Error("settings-update-failed");
      } finally {
        setIsSaving(false);
      }
    },
    [setTheme, settings.notificationPreferences, userId],
  );

  return useMemo(
    () => ({ settings, update, isSaving, error }),
    [error, isSaving, settings, update],
  );
}
