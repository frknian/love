"use client";

import { Download, Share } from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallAppCard() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsInstalled(
      standalone ||
        Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
    );
    setIsIos(ios);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") setIsInstalled(true);
    setInstallEvent(null);
  }

  if (isInstalled) {
    return (
      <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
        Uygulama bu cihazın ana ekranına ekli.
      </p>
    );
  }

  if (installEvent) {
    return (
      <button
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-600"
        onClick={handleInstall}
        type="button"
      >
        <Download className="size-4" />
        Ana ekrana ekle
      </button>
    );
  }

  if (isIos) {
    return (
      <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm leading-6 text-slate-600 dark:bg-white/5 dark:text-slate-300">
        Safari paylaşım menüsünden{" "}
        <Share className="mx-1 inline size-4 text-rose-500" />
        <strong>Ana Ekranına Ekle</strong> seçeneğine dokun.
      </p>
    );
  }

  return (
    <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
      Tarayıcı menüsünden “Ana ekrana ekle” seçeneğini kullanabilirsin.
    </p>
  );
}
