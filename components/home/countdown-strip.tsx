"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { useNow } from "@/hooks/use-now";
import { getRemaining } from "@/lib/countdowns/countdown-math";
import type { Countdown } from "@/types/countdowns";

interface CountdownStripProps {
  countdowns: Countdown[];
}

/** Ana sayfadaki yatay geri sayım kartları (canlı gün sayısı). */
export function CountdownStrip({ countdowns }: CountdownStripProps) {
  const now = useNow(30_000);

  if (!countdowns.length) return null;

  return (
    <section aria-label="Yaklaşan geri sayımlar">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-600">Geri sayımlar</h2>
        <Link
          className="inline-flex items-center gap-0.5 text-xs font-semibold text-rose-500 hover:text-rose-600"
          href="/geri-sayimlar"
        >
          Tümü
          <ChevronRight className="size-3.5" />
        </Link>
      </div>
      <div className="mt-2 flex gap-3 overflow-x-auto pb-1">
        {countdowns.map((countdown) => {
          const remaining = getRemaining(countdown.targetDate, now);
          return (
            <Link
              aria-label={`${countdown.title}: ${
                remaining.isPast ? "gün geldi" : `${remaining.days} gün kaldı`
              }`}
              className="flex min-w-32 shrink-0 flex-col items-center gap-1 rounded-3xl border border-white/70 bg-white/65 px-4 py-4 text-center shadow-sm backdrop-blur-xl transition hover:bg-white/90"
              href="/geri-sayimlar"
              key={countdown.id}
            >
              <span aria-hidden="true" className="text-2xl">
                {countdown.icon}
              </span>
              <span className="max-w-28 truncate text-xs font-medium text-slate-500">
                {countdown.title}
              </span>
              <span className="text-lg font-bold tabular-nums text-rose-500">
                {remaining.isPast ? "Bugün!" : `${remaining.days} Gün`}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
