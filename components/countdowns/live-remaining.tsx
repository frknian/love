"use client";

import { getRemaining } from "@/lib/countdowns/countdown-math";

interface LiveRemainingProps {
  targetDate: string;
  now: Date;
  className?: string;
}

/** Gün / saat / dakika / saniye olarak canlı kalan süre. */
export function LiveRemaining({
  targetDate,
  now,
  className,
}: LiveRemainingProps) {
  const remaining = getRemaining(targetDate, now);

  if (remaining.isPast) {
    return (
      <p className={className} role="status">
        Gün geldi! 🎉
      </p>
    );
  }

  const units = [
    { value: remaining.days, label: "gün" },
    { value: remaining.hours, label: "saat" },
    { value: remaining.minutes, label: "dk" },
    { value: remaining.seconds, label: "sn" },
  ];

  return (
    <div aria-live="off" className={className}>
      <span className="sr-only">
        {`${remaining.days} gün ${remaining.hours} saat ${remaining.minutes} dakika kaldı`}
      </span>
      <div aria-hidden="true" className="flex items-end gap-2">
        {units.map((unit) => (
          <span className="flex flex-col items-center" key={unit.label}>
            <span className="min-w-9 rounded-xl bg-white/80 px-1.5 py-1 text-center text-base font-bold tabular-nums text-slate-800 shadow-sm">
              {String(unit.value).padStart(2, "0")}
            </span>
            <span className="mt-1 text-[10px] font-medium text-slate-400">
              {unit.label}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
