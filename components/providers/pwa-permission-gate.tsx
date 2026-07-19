"use client";

import { BellRing, LoaderCircle, MapPin } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  PWA_PERMISSION_GATE_KEY,
  WEB_PUSH_AUTO_REQUEST_KEY,
  claimBrowserPermissionPrompt,
} from "@/lib/notifications/permission-prompt";
import { getPushProvider } from "@/services/notifications/push-provider";

type LocationGateState = "unknown" | "granted" | "denied" | "unsupported";

function requestLocationPermission(): Promise<LocationGateState> {
  if (!navigator.geolocation) return Promise.resolve("unsupported");

  // getCurrentPosition çağrısı fonksiyonun içinde, doğrudan sayfa açılışı veya
  // kullanıcı dokunuşu sırasında yapılır. Böylece Safari'nin izin akışı
  // gecikmiş bir timer tarafından engellenmez.
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve("granted"),
      (error) => resolve(error.code === 1 ? "denied" : "unknown"),
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 0 },
    );
  });
}

export function PwaPermissionGate() {
  const [visible, setVisible] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [locationState, setLocationState] =
    useState<LocationGateState>("unknown");
  const [notificationState, setNotificationState] = useState<
    NotificationPermission | "unsupported"
  >("unsupported");
  const notificationStateRef = useRef<NotificationPermission | "unsupported">(
    "unsupported",
  );

  const refreshVisibility = useCallback(
    (
      nextLocation: LocationGateState,
      nextNotification: NotificationPermission | "unsupported",
    ) => {
      notificationStateRef.current = nextNotification;
      const needsLocation =
        nextLocation === "denied" || nextLocation === "unknown";
      const needsNotificationSettings = nextNotification === "denied";
      setVisible(needsLocation || needsNotificationSettings);
    },
    [],
  );

  const requestPermissions = useCallback(() => {
    setIsRequesting(true);

    // İki native izin çağrısı da doğrudan aynı kullanıcı dokunuşu içinden
    // başlatılır; Safari'nin user-gesture şartı korunur.
    const locationPromise = requestLocationPermission();
    const provider = getPushProvider();
    const notificationPromise =
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
        ? provider.requestPermission().catch(() => false)
        : Promise.resolve(
            typeof Notification !== "undefined" &&
              Notification.permission === "granted",
          );

    void Promise.all([locationPromise, notificationPromise]).then(
      ([nextLocation, notificationGranted]) => {
        const nextNotification: NotificationPermission | "unsupported" =
          typeof Notification === "undefined"
            ? "unsupported"
            : Notification.permission;
        setLocationState(nextLocation);
        setNotificationState(nextNotification);
        notificationStateRef.current = nextNotification;
        setIsRequesting(false);
        if (
          notificationGranted &&
          (nextLocation === "granted" || nextLocation === "unsupported")
        ) {
          setVisible(false);
        } else {
          refreshVisibility(nextLocation, nextNotification);
        }
      },
    );
  }, [refreshVisibility]);

  useEffect(() => {
    // Konum ve bildirim izinlerini yalnızca bu tarayıcıdaki ilk girişte
    // otomatik olarak dene. Sonraki girişlerde kullanıcının daha önce verdiği
    // karar korunur; gerekli değişiklikler Ayarlar ekranından yapılabilir.
    if (!claimBrowserPermissionPrompt(PWA_PERMISSION_GATE_KEY)) return;

    let active = true;
    const provider = getPushProvider();

    // İlk girişte konum iznini doğrudan tarayıcı üzerinden ister.
    const locationPromise = requestLocationPermission().then((nextLocation) => {
      if (!active) return nextLocation;
      setLocationState(nextLocation);
      refreshVisibility(nextLocation, notificationStateRef.current);
      return nextLocation;
    });

    provider.prepare();
    void provider.getState().then((state) => {
      if (!active) return;
      const nextNotification = state.permission;
      const supported = state.availability === "supported";
      setNotificationState(nextNotification);
      notificationStateRef.current = nextNotification;

      if (
        supported &&
        nextNotification === "default" &&
        claimBrowserPermissionPrompt(WEB_PUSH_AUTO_REQUEST_KEY)
      ) {
        // Bazı tarayıcılar sayfa açılışında isteği engeller. Mevcut bildirim
        // kartı bu durumda gerçek kullanıcı dokunuşuyla tekrar dener.
        void provider
          .requestPermission()
          .catch(() => false)
          .then(() => {
            if (!active) return;
            const observed = Notification.permission;
            setNotificationState(observed);
            refreshVisibility(locationState, observed);
            void locationPromise.then((nextLocation) =>
              refreshVisibility(nextLocation, observed),
            );
          });
      } else {
        refreshVisibility(locationState, nextNotification);
      }
    });

    return () => {
      active = false;
    };
    // Permission values are intentionally read once per page entry. The
    // button below performs a fresh read after a user gesture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  const needsSettings =
    locationState === "denied" || notificationState === "denied";

  return (
    <aside className="fixed inset-x-4 bottom-24 z-[120] mx-auto max-w-md rounded-3xl border border-white/80 bg-white/95 p-5 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95">
      <p className="font-semibold text-slate-800 dark:text-slate-100">
        {needsSettings ? "İzinleri ayarlardan aç" : "İzinleri etkinleştir"}
      </p>
      <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
        {needsSettings
          ? "Daha önce reddedilen izinler Safari ayarlarından temizlenmelidir. Site verilerini sildikten sonra uygulamayı yeniden açabilirsin."
          : "Konumunu güncellemek ve partnerinden bildirim almak için izin ver."}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 dark:bg-rose-500/10">
          <MapPin className="size-3.5 text-rose-500" /> Konum
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 dark:bg-rose-500/10">
          <BellRing className="size-3.5 text-rose-500" /> Bildirim
        </span>
      </div>
      {!needsSettings ? (
        <button
          className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          disabled={isRequesting}
          onClick={requestPermissions}
          type="button"
        >
          {isRequesting ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : null}
          {isRequesting ? "İzin isteniyor…" : "İzin ver"}
        </button>
      ) : null}
    </aside>
  );
}
