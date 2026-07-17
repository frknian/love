"use client";

import { CalendarHeart, Heart } from "lucide-react";

import { Card } from "@/components/ui/card";
import { useNow } from "@/hooks/use-now";
import { daysSince, formatDateTr, fromIsoDate } from "@/lib/date-utils";

interface CoupleInfoCardProps {
  coupleName: string;
  relationshipStartDate: string | null;
}

export function CoupleInfoCard({
  coupleName,
  relationshipStartDate,
}: CoupleInfoCardProps) {
  const now = useNow(60_000);
  const daysTogether = relationshipStartDate
    ? daysSince(relationshipStartDate, now)
    : null;

  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-500/20 dark:text-rose-300">
          <Heart className="size-5 fill-current" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
            {coupleName}
          </p>
          {relationshipStartDate ? (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
              <CalendarHeart className="size-3.5" />
              {formatDateTr(fromIsoDate(relationshipStartDate))} beri birlikte
            </p>
          ) : null}
        </div>
      </div>
      {daysTogether !== null ? (
        <p className="mt-4 text-center">
          <span className="text-3xl font-bold text-rose-500">
            {daysTogether}
          </span>
          <span className="ml-1.5 text-sm text-slate-400">gündür birlikte</span>
        </p>
      ) : null}
    </Card>
  );
}
