"use client";

import { getInteraction } from "@/lib/notifications/interactions";

/**
 * Haptic feedback katmanı.
 * Desenler etkileşim kataloğundan gelir; yeni bildirim tipleri kendi
 * titreşim desenini katalogda tanımlar, bu modül değişmeden çalışır.
 */
export function isHapticsSupported(): boolean {
  return typeof navigator !== "undefined" && "vibrate" in navigator;
}

export function triggerHaptic(pattern: number[]): void {
  if (!isHapticsSupported() || pattern.length === 0) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Bazı tarayıcılar kullanıcı etkileşimi olmadan titreşimi reddeder; sessizce geç.
  }
}

export function triggerHapticForType(notificationType: string): void {
  triggerHaptic(getInteraction(notificationType).hapticPattern);
}
