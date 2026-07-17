/** Pil ve güncellik dengesi tek noktadan yönetilir. */
export const locationConfig = {
  minimumUpdateIntervalMs: 15 * 60 * 1000,
  minimumMovementMeters: 250,
  requestTimeoutMs: 12_000,
  staleAfterMs: 3 * 60 * 60 * 1000,
  maximumCachedAgeMs: 5 * 60 * 1000,
  enableHighAccuracy: false,
} as const;
