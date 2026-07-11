"use client";

/**
 * Push bildirim sağlayıcı soyutlaması.
 *
 * Web Push / FCM gibi gerçek bir sağlayıcı eklemek için `PushProvider`
 * arayüzünü uygulayan yeni bir sınıf yazıp `getPushProvider` içindeki
 * seçim mantığına eklemek yeterlidir; bildirim gönderim akışı değişmez.
 */
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

/** Push altyapısı hazır olana kadar sessizce çalışan varsayılan sağlayıcı. */
class NoopPushProvider implements PushProvider {
  readonly name = "noop";

  isSupported(): boolean {
    return false;
  }

  async requestPermission(): Promise<boolean> {
    return false;
  }

  async notify(): Promise<void> {
    // Bilinçli olarak boş: gerçek sağlayıcı eklenene kadar no-op.
  }
}

let provider: PushProvider | null = null;

export function getPushProvider(): PushProvider {
  if (!provider) provider = new NoopPushProvider();
  return provider;
}
