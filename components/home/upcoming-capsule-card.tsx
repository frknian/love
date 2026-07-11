import { ChevronRight, Hourglass } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { differenceInDays, formatDateTr } from "@/lib/date-utils";
import type { TimeCapsuleMeta } from "@/types/capsule";

interface UpcomingCapsuleCardProps {
  capsule: TimeCapsuleMeta | null;
}

export function UpcomingCapsuleCard({ capsule }: UpcomingCapsuleCardProps) {
  const daysUntil = capsule
    ? Math.max(0, differenceInDays(new Date(capsule.unlockDate), new Date()))
    : null;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Yaklaşan Time Capsule</p>
        <Hourglass aria-hidden="true" className="size-4 text-rose-300" />
      </div>
      {capsule && daysUntil !== null ? (
        <div className="mt-3">
          <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
            {capsule.title}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {formatDateTr(new Date(capsule.unlockDate))} tarihinde açılacak
          </p>
          <p className="mt-2 inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
            {daysUntil} gün kaldı
          </p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-400">
          Kilitli bir mesaj yok. Geleceğe bir şeyler bırak.
        </p>
      )}
      <Link
        className="mt-3 inline-flex items-center gap-0.5 text-xs font-semibold text-rose-500 hover:text-rose-600"
        href="/zaman-kapsulu"
      >
        Zaman kapsülü
        <ChevronRight className="size-3.5" />
      </Link>
    </Card>
  );
}
