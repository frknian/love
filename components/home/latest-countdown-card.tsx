import { ChevronRight, Hourglass } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { getRemaining } from "@/lib/countdowns/countdown-math";
import { formatDateTr } from "@/lib/date-utils";
import type { Countdown } from "@/types/countdowns";

interface LatestCountdownCardProps {
  countdown: Countdown | null;
}

export function LatestCountdownCard({ countdown }: LatestCountdownCardProps) {
  const remaining = countdown ? getRemaining(countdown.targetDate) : null;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Son geri sayım</p>
        <Hourglass aria-hidden="true" className="size-4 text-rose-300" />
      </div>
      {countdown && remaining ? (
        <div className="mt-3 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-11 shrink-0 place-items-center rounded-2xl bg-rose-50 text-lg"
          >
            {countdown.icon}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-700">
              {countdown.title}
            </p>
            <p className="truncate text-xs text-slate-400">
              {remaining.isPast
                ? "Gün geldi! 🎉"
                : `${remaining.days} gün kaldı • ${formatDateTr(new Date(countdown.targetDate))}`}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-400">
          Henüz geri sayım yok. Beklediğiniz günü ekleyin.
        </p>
      )}
      <Link
        className="mt-3 inline-flex items-center gap-0.5 text-xs font-semibold text-rose-500 hover:text-rose-600"
        href="/geri-sayimlar"
      >
        Geri sayımlar
        <ChevronRight className="size-3.5" />
      </Link>
    </Card>
  );
}
