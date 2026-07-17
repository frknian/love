"use client";

import {
  detectPushAvailability,
  urlBase64ToUint8Array,
  type PushAvailability,
} from "@/lib/notifications/push-support";
import type { PushClientState, WebPushPayload } from "@/types/push";

export interface PushProvider {
  readonly name: string;
  isSupported(): boolean;
  prepare(): void;
  getState(): Promise<PushClientState>;
  requestPermission(): Promise<boolean>;
  notify(payload: WebPushPayload): Promise<void>;
  sendTest(): Promise<void>;
  unsubscribe(): Promise<void>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

function isIosDevice(): boolean {
  const navigatorWithStandalone = navigator as NavigatorWithStandalone;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" &&
      navigator.maxTouchPoints > 1 &&
      "standalone" in navigatorWithStandalone)
  );
}

function isStandaloneDisplay(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as NavigatorWithStandalone).standalone === true
  );
}

function getAvailability(): PushAvailability {
  if (typeof window === "undefined") return "unsupported";
  const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(
    window.location.hostname,
  );
  return detectPushAvailability({
    isSecureContext: window.isSecureContext || isLocalhost,
    isIos: isIosDevice(),
    isStandalone: isStandaloneDisplay(),
    hasNotification: "Notification" in window,
    hasServiceWorker: "serviceWorker" in navigator,
    hasPushManager: "PushManager" in window,
    hasShowNotification:
      "ServiceWorkerRegistration" in window &&
      "showNotification" in ServiceWorkerRegistration.prototype,
  });
}

class BrowserPushProvider implements PushProvider {
  readonly name = "standards-web-push";
  private registrationPromise?: Promise<ServiceWorkerRegistration>;
  private publicKeyPromise?: Promise<string>;

  isSupported(): boolean {
    return getAvailability() === "supported";
  }

  prepare(): void {
    if (!this.isSupported()) return;
    this.registrationPromise ??= navigator.serviceWorker.ready;
    this.publicKeyPromise ??= fetch("/api/push/config", {
      cache: "no-store",
      credentials: "same-origin",
    }).then(async (response) => {
      if (!response.ok) throw new Error("Push configuration is unavailable.");
      const payload = (await response.json()) as { publicKey?: string };
      if (!payload.publicKey) throw new Error("Push public key is missing.");
      return payload.publicKey;
    });
  }

  async getState(): Promise<PushClientState> {
    const availability = getAvailability();
    if (availability !== "supported") {
      return {
        availability,
        permission:
          typeof Notification === "undefined"
            ? "unsupported"
            : Notification.permission,
        subscribed: false,
      };
    }

    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    return {
      availability,
      permission: Notification.permission,
      subscribed: Boolean(subscription),
    };
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;

    // iOS, izin isteğinin doğrudan kullanıcı dokunuşu içinde başlamasını ister.
    // Promise'ler yalnızca önceden hazırlık yapar; izin çağrısı araya await
    // girmeden bu event handler çağrı zincirinde çalışır.
    this.prepare();
    const permissionPromise =
      Notification.permission === "default"
        ? Notification.requestPermission()
        : Promise.resolve(Notification.permission);
    const permission = await permissionPromise;
    if (permission !== "granted") return false;

    const [registration, publicKey] = await Promise.all([
      this.registrationPromise!,
      this.publicKeyPromise!,
    ]);
    let subscription = await registration.pushManager.getSubscription();
    subscription ??= await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });

    const response = await fetch("/api/push/subscriptions", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription.toJSON()),
    });
    if (!response.ok) throw new Error("Push subscription could not be saved.");
    return true;
  }

  async notify(payload: WebPushPayload): Promise<void> {
    if (!this.isSupported() || Notification.permission !== "granted") return;
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return;

    // Aktif remote abonelik varsa sunucu push'u bildirimi göstereceği için
    // Realtime olayından ikinci bir yerel bildirim üretme.
    if (await registration.pushManager.getSubscription()) return;
    await registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon ?? "/icons/icon-192.png",
      tag: payload.tag,
      data: { url: payload.url ?? "/bildirimler" },
    });
  }

  async sendTest(): Promise<void> {
    const response = await fetch("/api/push/test", {
      method: "POST",
      credentials: "same-origin",
    });
    if (!response.ok) throw new Error("Test notification could not be sent.");
  }

  async unsubscribe(): Promise<void> {
    if (!this.isSupported()) return;
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return;

    await fetch("/api/push/subscriptions", {
      method: "DELETE",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    }).catch(() => undefined);
    await subscription.unsubscribe();
  }
}

let provider: PushProvider | undefined;

export function getPushProvider(): PushProvider {
  provider ??= new BrowserPushProvider();
  return provider;
}
