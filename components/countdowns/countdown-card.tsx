"use client";

import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { memo } from "react";

import { LiveRemaining } from "@/components/countdowns/live-remaining";
import { useNow } from "@/hooks/use-now";
import {
  getProgressPercent,
  getRemaining,
} from "@/lib/countdowns/countdown-math";
import { formatDateTr } from "@/lib/date-utils";
import type { Countdown } from "@/types/countdowns";

interface CountdownCardProps {
  countdown: Countdown;
  onDelete?: (countdown: Countdown) => void;
}

function CountdownCardComponent({ countdown, onDelete }: CountdownCardProps) {
  // İlerleme çubuğu saniyelik hassasiyet gerektirmez; kaba bir tick yeterli.
  // Saniyelik güncelleme yalnızca <LiveRemaining /> içinde yapılır.
  const now = useNow(30_000);
  const progress = getProgressPercent(countdown, now);
  const remaining = getRemaining(countdown.targetDate, now);

  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      aria-label={`${countdown.title} geri sayımı`}
      className="overflow-hidden rounded-3xl border border-white/70 bg-white/65 shadow-soft backdrop-blur-xl"
      exit={{ opacity: 0, y: -8 }}
      initial={{ opacity: 0, y: 8 }}
      layout
    >
      <div className="relative h-28">
        {countdown.coverImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover"
            src={countdown.coverImage}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-rose-100 via-pink-50 to-amber-50" />
        )}
        <span
          aria-hidden="true"
          className="absolute bottom-3 left-4 grid size-12 place-items-center rounded-2xl bg-white/90 text-2xl shadow-sm"
        >
          {countdown.icon}
        </span>
        {onDelete ? (
          <button
            aria-label={`${countdown.title} geri sayımını sil`}
            className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white/85 text-slate-400 shadow-sm transition hover:text-rose-500"
            onClick={() => onDelete(countdown)}
            type="button"
          >
            <Trash2 className="size-4" />
          </button>
        ) : null}
      </div>
      <div className="p-4">
        <h3 className="truncate text-sm font-semibold text-slate-800">
          {countdown.title}
        </h3>
        <p className="mt-0.5 text-xs text-slate-400">
          {formatDateTr(new Date(countdown.targetDate))}
        </p>
        <LiveRemaining className="mt-3" targetDate={countdown.targetDate} />
        <div
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={progress}
          className="mt-4 h-2 overflow-hidden rounded-full bg-rose-100"
          role="progressbar"
        >
          <motion.div
            animate={{ width: `${progress}%` }}
            className={`h-full rounded-full ${
              remaining.isPast ? "bg-emerald-400" : "bg-rose-400"
            }`}
            initial={false}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <p className="mt-1.5 text-right text-[10px] font-semibold text-slate-400">
          %{progress}
        </p>
      </div>
    </motion.article>
  );
}

export const CountdownCard = memo(CountdownCardComponent);
