"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";

import { LogoutButton } from "@/components/auth/logout-button";
import { LanguageSwitcher } from "@/components/settings/language-switcher";
import { NotificationPreferencesCard } from "@/components/settings/notification-preferences-card";
import { ThemeSwitcher } from "@/components/settings/theme-switcher";
import { ToggleRow } from "@/components/settings/toggle-row";
import { InstallAppCard } from "@/components/pwa/install-app-card";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast-provider";
import { useSettings } from "@/hooks/use-settings";
import type { NotificationPreferenceKey, UserSettings } from "@/types/settings";

interface SettingsWorkspaceProps {
  initialSettings: UserSettings;
  inviteCode?: string;
  userId: string;
}

export function SettingsWorkspace({
  initialSettings,
  inviteCode,
  userId,
}: SettingsWorkspaceProps) {
  const { settings, update, isSaving } = useSettings({
    initialSettings,
    userId,
  });
  const { showToast } = useToast();
  const [isInviteCopied, setIsInviteCopied] = useState(false);

  function getInviteUrl() {
    if (!inviteCode) return;
    const inviteUrl = new URL("/kayit", window.location.origin);
    inviteUrl.searchParams.set("invite", inviteCode);
    return inviteUrl.toString();
  }

  async function handleCopyInvite() {
    const inviteUrl = getInviteUrl();
    if (!inviteUrl) return;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setIsInviteCopied(true);
      showToast("Davet bağlantısı kopyalandı.");
      window.setTimeout(() => setIsInviteCopied(false), 2000);
    } catch {
      showToast(
        "Bağlantı kopyalanamadı. Paylaş butonunu deneyebilirsin.",
        "error",
      );
    }
  }

  async function handleShareInvite() {
    const inviteUrl = getInviteUrl();
    if (!inviteUrl) return;

    if (navigator.share) {
      await navigator
        .share({
          title: "Bizim Hikâyemiz daveti",
          text: "Bizim Hikâyemiz'e katılman için sana bir davet gönderdim.",
          url: inviteUrl,
        })
        .catch(() => undefined);
      return;
    }

    await handleCopyInvite();
  }

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
    <div aria-busy={isSaving} className="mt-8 space-y-4">
      <Card className="w-full overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold text-slate-800 dark:text-slate-100">
            Tema
          </p>
          {isSaving ? (
            <span className="text-xs font-medium text-slate-400" role="status">
              Kaydediliyor…
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Açık, koyu veya sistem temasını takip et.
        </p>
        <div className="mt-3">
          <ThemeSwitcher
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
            label="Bildirimler"
            onChange={(value) =>
              void handleUpdate("Bildirimler", { notificationsEnabled: value })
            }
          />
          <ToggleRow
            checked={settings.animationEnabled}
            label="Animasyonlar"
            onChange={(value) =>
              void handleUpdate("Animasyonlar", { animationEnabled: value })
            }
          />
          <ToggleRow
            checked={settings.hapticsEnabled}
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
            onChange={(language) => void handleUpdate("Dil", { language })}
            value={settings.language}
          />
        </div>
      </Card>

      <NotificationPreferencesCard
        disabled={!settings.notificationsEnabled}
        onChange={handleNotificationPreferenceChange}
        preferences={settings.notificationPreferences}
      />

      {inviteCode ? (
        <Card className="w-full overflow-hidden">
          <p className="font-semibold text-slate-800 dark:text-slate-100">
            Partnerini davet et
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Davet bağlantısını partnerine gönder; kayıt olduktan sonra çifte
            doğrudan katılabilir.
          </p>
          <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-center text-sm font-bold tracking-[0.2em] text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
            {inviteCode}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-rose-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 active:scale-[0.98]"
              onClick={handleCopyInvite}
              type="button"
            >
              {isInviteCopied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
              {isInviteCopied ? "Kopyalandı" : "Bağlantıyı kopyala"}
            </button>
            <button
              aria-label="Davet bağlantısını paylaş"
              className="grid size-11 place-items-center rounded-xl bg-rose-100 text-rose-600 transition hover:bg-rose-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 active:scale-[0.98] dark:bg-rose-500/20 dark:text-rose-300 dark:hover:bg-rose-500/30"
              onClick={handleShareInvite}
              type="button"
            >
              <Share2 className="size-4" />
            </button>
          </div>
        </Card>
      ) : null}

      <Card className="w-full overflow-hidden">
        <p className="font-semibold text-slate-800 dark:text-slate-100">
          Uygulamayı yükle
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Bizim Hikâyemiz’e ana ekrandan tek dokunuşla ulaş.
        </p>
        <InstallAppCard />
      </Card>

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
