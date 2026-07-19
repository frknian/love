"use client";

import { useEffect, useState } from "react";

interface Ticker {
  timer: number;
  listeners: Set<(now: Date) => void>;
}

/**
 * Aynı aralığı kullanan tüm bileşenler tek bir zamanlayıcıyı paylaşır.
 * Aksi hâlde her geri sayım kartı kendi `setInterval`'ını açar ve sayfada
 * onlarca gereksiz zamanlayıcı birikir.
 */
const tickers = new Map<number, Ticker>();

function subscribe(intervalMs: number, listener: (now: Date) => void) {
  let ticker = tickers.get(intervalMs);
  if (!ticker) {
    const created: Ticker = {
      timer: 0,
      listeners: new Set(),
    };
    created.timer = window.setInterval(() => {
      const now = new Date();
      created.listeners.forEach((notify) => notify(now));
    }, intervalMs);
    tickers.set(intervalMs, created);
    ticker = created;
  }
  ticker.listeners.add(listener);

  return () => {
    const active = tickers.get(intervalMs);
    if (!active) return;
    active.listeners.delete(listener);
    if (active.listeners.size === 0) {
      window.clearInterval(active.timer);
      tickers.delete(intervalMs);
    }
  };
}

/**
 * Belirtilen aralıkla güncellenen "şimdi" değeri.
 * Canlı geri sayım sayaçları bu hook ile sayfa yenilenmeden ilerler.
 */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => subscribe(intervalMs, setNow), [intervalMs]);

  return now;
}
