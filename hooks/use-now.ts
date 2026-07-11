"use client";

import { useEffect, useState } from "react";

/**
 * Belirtilen aralıkla güncellenen "şimdi" değeri.
 * Canlı geri sayım sayaçları bu hook ile sayfa yenilenmeden ilerler.
 */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return now;
}
