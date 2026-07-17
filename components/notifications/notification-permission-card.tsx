"use client";

import { BellRing, LoaderCircle, X } from "lucide-react";
import { useEffect, useState } from "react";

import { getPushProvider } from "@/services/notifications/push-provider";

const DISMISSED_KEY = "love:notification-permission-dismissed";

export function NotificationPermissionCard() {
  const [isVisible, setIsVisible] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const provider = getPushProvider();
    setIsVisible(
      provider.isSupported() &&
        Notification.permission === "default" &&
        localStorage.getItem(DISMISSED_KEY) !== "true",
    );
  }, []);

  async function handleEnable() {
    setIsRequesting(true);
    setError(undefined);
    try {
      const granted = await getPushProvider().requestPermission();
      if (granted) setIsVisible(false);
      else
        setError(
          "Bildirim izni verilmedi. Tarayıcı ayarlarından değiştirebilirsin.",
        );
    } catch {
      setError("Bildirim izni alınamadı. Lütfen tekrar dene.");
    } finally {
      setIsRequesting(false);
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "true");
    setIsVisible(false);
  }

  if (!isVisible) return null;

  return (
    <aside className="fixed inset-x-4 bottom-24 z-[70] mx-auto max-w-md rounded-3xl border border-white/80 bg-white/95 p-4 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-500/20 dark:text-rose-300">
          <BellRing className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-800 dark:text-slate-100">
            Etkileşimleri kaçırma
          </p>
          <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
            Partnerin sana bir etkileşim gönderdiğinde bu cihazda bildirim
            gösterelim.
          </p>
        </div>
        <button
          aria-label="Bildirim izni kartını kapat"
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
        {isRequesting ? "İzin isteniyor…" : "Bildirimlere izin ver"}
      </button>
    </aside>
  );
}
