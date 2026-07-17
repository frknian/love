"use client";

import { useCallback, useMemo, useRef, useState } from "react";

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
  const settingsRef = useRef(initialSettings);
  const requestIdRef = useRef(0);
  const { setTheme } = useTheme();

  const update = useCallback(
    async (input: SettingsUpdateInput) => {
      const previous = settingsRef.current;
      const optimistic: UserSettings = {
        ...previous,
        ...(input.theme ? { theme: input.theme } : {}),
        ...(input.notificationsEnabled !== undefined
          ? { notificationsEnabled: input.notificationsEnabled }
          : {}),
        ...(input.hapticsEnabled !== undefined
          ? { hapticsEnabled: input.hapticsEnabled }
          : {}),
        ...(input.animationEnabled !== undefined
          ? { animationEnabled: input.animationEnabled }
          : {}),
        ...(input.language ? { language: input.language } : {}),
        ...(input.notificationPreferences
          ? {
              notificationPreferences: {
                ...previous.notificationPreferences,
                ...input.notificationPreferences,
              },
            }
          : {}),
      };
      const requestId = ++requestIdRef.current;

      settingsRef.current = optimistic;
      setSettings(optimistic);
      if (input.theme) setTheme(input.theme);
      setIsSaving(true);
      setError(undefined);
      try {
        const row = await settingsService.update(
          userId,
          input,
          previous.notificationPreferences,
        );
        const next = toUserSettings(row);
        if (requestId === requestIdRef.current) {
          settingsRef.current = next;
          setSettings(next);
          if (input.theme) setTheme(next.theme);
        }
        return next;
      } catch {
        if (requestId === requestIdRef.current) {
          settingsRef.current = previous;
          setSettings(previous);
          if (input.theme) setTheme(previous.theme);
          setError("Ayarlar kaydedilemedi. Lütfen tekrar dene.");
        }
        throw new Error("settings-update-failed");
      } finally {
        if (requestId === requestIdRef.current) setIsSaving(false);
      }
    },
    [setTheme, userId],
  );

  return useMemo(
    () => ({ settings, update, isSaving, error }),
    [error, isSaving, settings, update],
  );
}
