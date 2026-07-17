"use client";

import { BellRing } from "lucide-react";
import { useEffect, useState } from "react";

import { Card } from "@/components/ui/card";
import { getPushProvider } from "@/services/notifications/push-provider";

type PermissionState = NotificationPermission | "unsupported";

export function NotificationPermissionSettingsCard() {
  const [permission, setPermission] = useState<PermissionState>("unsupported");
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    setPermission(
      getPushProvider().isSupported() ? Notification.permission : "unsupported",
    );
  }, []);

  async function requestPermission() {
    setIsRequesting(true);
    await getPushProvider()
      .requestPermission()
      .catch(() => false);
    setPermission(
      getPushProvider().isSupported() ? Notification.permission : "unsupported",
    );
    setIsRequesting(false);
  }

  const description =
    permission === "granted"
      ? "Etkileşim bildirimleri bu tarayıcıda açık."
      : permission === "denied"
        ? "İzin engellenmiş. Tarayıcı site ayarlarından bildirimlere izin ver."
        : permission === "unsupported"
          ? "Bu tarayıcı sistem bildirimlerini desteklemiyor."
          : "Partnerinden gelen etkileşimleri cihaz bildirimi olarak gör.";

  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-500/20 dark:text-rose-300">
          <BellRing className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-800 dark:text-slate-100">
            Tarayıcı bildirimleri
          </p>
          <p className="mt-0.5 text-xs leading-5 text-slate-400">
            {description}
          </p>
        </div>
        <span
          className={`size-2.5 rounded-full ${
            permission === "granted" ? "bg-emerald-400" : "bg-slate-300"
          }`}
        />
      </div>
      {permission === "default" ? (
        <button
          className="mt-4 min-h-11 w-full rounded-xl bg-rose-500 px-4 text-sm font-semibold text-white disabled:opacity-60"
          disabled={isRequesting}
          onClick={() => void requestPermission()}
          type="button"
        >
          {isRequesting ? "İzin isteniyor…" : "Bildirim izni ver"}
        </button>
      ) : null}
    </Card>
  );
}
