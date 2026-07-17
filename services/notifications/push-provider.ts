"use client";

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
}

export interface PushProvider {
  readonly name: string;
  isSupported(): boolean;
  requestPermission(): Promise<boolean>;
  notify(payload: PushPayload): Promise<void>;
}

class BrowserPushProvider implements PushProvider {
  readonly name = "browser-notification";

  isSupported(): boolean {
    return typeof window !== "undefined" && "Notification" in window;
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    if (Notification.permission === "granted") return true;
    return (await Notification.requestPermission()) === "granted";
  }

  async notify(payload: PushPayload): Promise<void> {
    if (!this.isSupported() || Notification.permission !== "granted") return;
    const registration = await navigator.serviceWorker?.ready;
    if (registration) {
      await registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon ?? "/icons/icon.svg",
        tag: payload.tag,
      });
      return;
    }
    new Notification(payload.title, payload);
  }
}

class NoopPushProvider implements PushProvider {
  readonly name = "noop";
  isSupported(): boolean { return false; }
  async requestPermission(): Promise<boolean> { return false; }
  async notify(): Promise<void> {}
}

let provider: PushProvider | null = null;

export function getPushProvider(): PushProvider {
  if (!provider) {
    provider =
      typeof window !== "undefined" && "Notification" in window
        ? new BrowserPushProvider()
        : new NoopPushProvider();
  }
  return provider;
}
