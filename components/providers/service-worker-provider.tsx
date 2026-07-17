"use client";

import { RefreshCw, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);
    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);
  if (isOnline) return null;
  return (
    <p className="fixed inset-x-4 top-4 z-[110] mx-auto flex max-w-md items-center justify-center gap-2 rounded-2xl bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-lg">
      <WifiOff className="size-4" />
      Çevrimdışısın. Son kaydedilen içerikler gösteriliyor.
    </p>
  );
}

export function ServiceWorkerProvider() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null,
  );
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      // Geliştirme chunk adları sabit kaldığı için eski Service Worker kodu
      // cache'ten sunup HMR sonucunu gölgeleyebilir. Dev ortamında kayıtları
      // temizleyerek her doğrulamanın güncel bundle ile yapılmasını sağla.
      void navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(registrations.map((item) => item.unregister())),
        );
      return;
    }
    let registration: ServiceWorkerRegistration | undefined;
    const register = async () => {
      registration = await navigator.serviceWorker.register("/sw.js", {
        updateViaCache: "none",
      });
      if (registration.waiting) setWaitingWorker(registration.waiting);
      registration.addEventListener("updatefound", () => {
        const worker = registration?.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (
            worker.state === "installed" &&
            navigator.serviceWorker.controller
          )
            setWaitingWorker(worker);
        });
      });
    };
    void register();
    const onControllerChange = () => window.location.reload();
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );
    return () =>
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
  }, []);
  return (
    <>
      <OfflineBanner />
      {waitingWorker ? (
        <div className="fixed inset-x-4 bottom-24 z-[110] mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl bg-slate-800 px-4 py-3 text-sm text-white shadow-xl">
          <span>Güncelleme hazır.</span>
          <button
            className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 font-semibold text-slate-800"
            onClick={() => waitingWorker.postMessage({ type: "SKIP_WAITING" })}
            type="button"
          >
            <RefreshCw className="size-3.5" />
            Yükle
          </button>
        </div>
      ) : null}
    </>
  );
}
