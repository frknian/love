"use client";

import { BellRing, LoaderCircle, MapPin } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { getPushProvider } from "@/services/notifications/push-provider";

function isIosStandaloneApp() {
  if (typeof window === "undefined") return false;
  const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return isIos && standalone;
}

function requestLocationPermission() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    () => undefined,
    () => undefined,
    { enableHighAccuracy: false, timeout: 12_000, maximumAge: 0 },
  );
}

export function PwaPermissionGate() {
  const [visible, setVisible] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  const requestPermissions = useCallback(() => {
    setIsRequesting(true);
    // İki native izin çağrısı da doğrudan aynı kullanıcı dokunuşu içinden
    // başlatılır; iOS Safari'nin user-gesture şartı korunur.
    requestLocationPermission();
    const provider = getPushProvider();
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      void provider.requestPermission().finally(() => {
        setIsRequesting(false);
        setVisible(false);
      });
    } else {
      setIsRequesting(false);
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    if (!isIosStandaloneApp()) return;

    requestLocationPermission();
    const notificationNeedsPermission =
      typeof Notification !== "undefined" && Notification.permission === "default";
    if (!notificationNeedsPermission) return;

    // Safari popup'ı otomatik çağrıyı reddederse aşağıdaki düğme aynı çağrıyı
    // gerçek bir kullanıcı dokunuşu içinde yeniden başlatır.
    void getPushProvider()
      .requestPermission()
      .then((granted) => {
        if (!granted && Notification.permission === "default") setVisible(true);
      })
      .catch(() => setVisible(true));
  }, []);

  if (!visible) return null;

  return (
    <aside className="fixed inset-x-4 bottom-24 z-[120] mx-auto max-w-md rounded-3xl border border-white/80 bg-white/95 p-5 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95">
      <p className="font-semibold text-slate-800 dark:text-slate-100">
        İzinleri etkinleştir
      </p>
      <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
        Konumunu güncellemek ve partnerinden bildirim almak için izin ver.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 dark:bg-rose-500/10">
          <MapPin className="size-3.5 text-rose-500" /> Konum
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 dark:bg-rose-500/10">
          <BellRing className="size-3.5 text-rose-500" /> Bildirim
        </span>
      </div>
      <button
        className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        disabled={isRequesting}
        onClick={requestPermissions}
        type="button"
      >
        {isRequesting ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {isRequesting ? "İzin isteniyor…" : "İzin ver"}
      </button>
    </aside>
  );
}
