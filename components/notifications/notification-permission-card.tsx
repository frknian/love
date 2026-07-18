"use client";

import { BellRing, LoaderCircle, Share, X } from "lucide-react";
import { useEffect, useState } from "react";

import { getPushProvider } from "@/services/notifications/push-provider";
import type { PushClientState } from "@/types/push";

// Permission flow was updated for all browsers. A new key makes the updated
// prompt visible again for users who dismissed the previous version.
const DISMISSED_KEY = "love:web-push-permission-dismissed:v3";

export function NotificationPermissionCard() {
  const [state, setState] = useState<PushClientState>();
  const [isVisible, setIsVisible] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    const provider = getPushProvider();
    provider.prepare();
    void provider.getState().then((nextState) => {
      if (!active) return;
      setState(nextState);
      const needsAction =
        nextState.availability === "requires-install" ||
        (nextState.availability === "supported" &&
          nextState.permission !== "denied" &&
          !nextState.subscribed);
      setIsVisible(
        needsAction && localStorage.getItem(DISMISSED_KEY) !== "true",
      );
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleEnable() {
    setIsRequesting(true);
    setError(undefined);
    try {
      const granted = await getPushProvider().requestPermission();
      const nextState = await getPushProvider().getState();
      setState(nextState);
      if (granted && nextState.subscribed) setIsVisible(false);
      else
        setError(
          "Bildirim izni veya cihaz aboneliği tamamlanamadı. Ayarlar bölümünden tekrar deneyebilirsin.",
        );
    } catch {
      setError(
        "Cihaz bildirime kaydedilemedi. İnternet bağlantını kontrol edip tekrar dene.",
      );
    } finally {
      setIsRequesting(false);
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "true");
    setIsVisible(false);
  }

  if (!isVisible || !state) return null;

  const requiresInstall = state.availability === "requires-install";

  return (
    <aside className="fixed inset-x-4 bottom-24 z-[70] mx-auto max-w-md rounded-3xl border border-white/80 bg-white/95 p-4 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-500/20 dark:text-rose-300">
          {requiresInstall ? (
            <Share className="size-5" />
          ) : (
            <BellRing className="size-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-800 dark:text-slate-100">
            {requiresInstall
              ? "iPhone bildirimlerini aç"
              : "Etkileşimleri kaçırma"}
          </p>
          <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
            {requiresInstall
              ? "Safari'de Paylaş simgesine dokun, Ana Ekrana Ekle'yi seç ve uygulamayı yeni ikonundan aç."
              : "Partnerin sana bir etkileşim gönderdiğinde uygulama kapalı olsa bile bu cihazda bildirim gösterelim."}
          </p>
        </div>
        <button
          aria-label="Bildirim kartını kapat"
          className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
          onClick={handleDismiss}
          type="button"
        >
          <X className="size-4" />
        </button>
      </div>
      {error ? (
        <p className="mt-3 text-xs text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
      {!requiresInstall ? (
        <button
          className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          disabled={isRequesting}
          onClick={handleEnable}
          type="button"
        >
          {isRequesting ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <BellRing className="size-4" />
          )}
          {isRequesting ? "Cihaz kaydediliyor…" : "Bildirimleri etkinleştir"}
        </button>
      ) : null}
    </aside>
  );
}
