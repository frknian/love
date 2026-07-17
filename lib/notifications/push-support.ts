export const pushAvailabilities = [
  "supported",
  "requires-install",
  "insecure",
  "unsupported",
] as const;

export type PushAvailability = (typeof pushAvailabilities)[number];

export interface PushEnvironment {
  isSecureContext: boolean;
  isIos: boolean;
  isStandalone: boolean;
  hasNotification: boolean;
  hasServiceWorker: boolean;
  hasPushManager: boolean;
  hasShowNotification: boolean;
}

/** Tarayıcı adından ziyade gerçek API desteğini ve iOS kurulum durumunu ölçer. */
export function detectPushAvailability(
  environment: PushEnvironment,
): PushAvailability {
  if (!environment.isSecureContext) return "insecure";
  if (environment.isIos && !environment.isStandalone) return "requires-install";
  if (
    !environment.hasNotification ||
    !environment.hasServiceWorker ||
    !environment.hasPushManager ||
    !environment.hasShowNotification
  )
    return "unsupported";
  return "supported";
}

export function urlBase64ToUint8Array(value: string): Uint8Array {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}
