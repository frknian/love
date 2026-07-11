import { ChevronRight, Target } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { getBucketColorDefinition } from "@/lib/bucket/bucket-catalog";
import type { BucketListWithProgress } from "@/types/bucket";

interface BucketProgressCardProps {
  list: BucketListWithProgress | null;
}

export function BucketProgressCard({ list }: BucketProgressCardProps) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Bucket List ilerlemesi</p>
        <Target aria-hidden="true" className="size-4 text-rose-300" />
      </div>
      {list ? (
        <div className="mt-3">
          <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
            {list.title}
          </p>
          <div
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={list.progressPercent}
            className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"
            role="progressbar"
          >
            <div
              className={`h-full rounded-full ${getBucketColorDefinition(list.color).bar}`}
              style={{ width: `${list.progressPercent}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            {list.completedItems}/{list.totalItems} madde • %
            {list.progressPercent}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-400">
          Henüz liste yok. Hayallerinizi listelemeye başlayın.
        </p>
      )}
      <Link
        className="mt-3 inline-flex items-center gap-0.5 text-xs font-semibold text-rose-500 hover:text-rose-600"
        href="/bucket-list"
      >
        Bucket List
        <ChevronRight className="size-3.5" />
      </Link>
    </Card>
  );
}
