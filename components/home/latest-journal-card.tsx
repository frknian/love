import { BookHeart, ChevronRight } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { formatRelativeTimeTr } from "@/lib/date-utils";
import { getMoodDefinition } from "@/lib/journal/journal-catalog";
import type { JournalEntry } from "@/types/journal";

interface LatestJournalCardProps {
  entry: JournalEntry | null;
}

export function LatestJournalCard({ entry }: LatestJournalCardProps) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Son günlük</p>
        <BookHeart aria-hidden="true" className="size-4 text-rose-300" />
      </div>
      {entry ? (
        <div className="mt-3 flex items-center gap-3">
          <span
            aria-hidden="true"
            className={`grid size-11 shrink-0 place-items-center rounded-2xl text-lg ${getMoodDefinition(entry.mood).badge}`}
          >
            {getMoodDefinition(entry.mood).emoji}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
              {entry.title}
            </p>
            <p className="truncate text-xs text-slate-400">
              {entry.authorName} • {formatRelativeTimeTr(entry.createdAt)}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-400">
          Henüz günlük kaydı yok. İlk anını yaz. ♡
        </p>
      )}
      <Link
        className="mt-3 inline-flex items-center gap-0.5 text-xs font-semibold text-rose-500 hover:text-rose-600"
        href="/gunluk"
      >
        Ortak günlük
        <ChevronRight className="size-3.5" />
      </Link>
    </Card>
  );
}
