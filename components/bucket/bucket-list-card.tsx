"use client";

import { motion } from "framer-motion";
import { ListChecks } from "lucide-react";

import { getBucketColorDefinition } from "@/lib/bucket/bucket-catalog";
import type { BucketListWithProgress } from "@/types/bucket";

interface BucketListCardProps {
  list: BucketListWithProgress;
  onOpen: (list: BucketListWithProgress) => void;
}

export function BucketListCard({ list, onOpen }: BucketListCardProps) {
  const colorDefinition = getBucketColorDefinition(list.color);

  return (
    <motion.button
      animate={{ opacity: 1, y: 0 }}
      aria-label={`${list.title} listesini aç, %${list.progressPercent} tamamlandı`}
      className="w-full overflow-hidden rounded-3xl border border-white/70 bg-white/65 text-left shadow-soft backdrop-blur-xl transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-400 dark:border-white/10 dark:bg-white/[0.04]"
      exit={{ opacity: 0, y: -8 }}
      initial={{ opacity: 0, y: 8 }}
      layout
      onClick={() => onOpen(list)}
      type="button"
    >
      <div
        className={`relative h-20 bg-gradient-to-br ${colorDefinition.surface}`}
      >
        {list.coverImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
            src={list.coverImage}
          />
        ) : null}
        <span
          className={`absolute bottom-3 left-4 grid size-10 place-items-center rounded-2xl bg-white/90 shadow-sm dark:bg-slate-900/80`}
        >
          <ListChecks className="size-5 text-slate-600 dark:text-slate-300" />
        </span>
      </div>
      <div className="p-4">
        <h3 className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
          {list.title}
        </h3>
        <p className="mt-0.5 text-xs text-slate-400">
          {list.completedItems}/{list.totalItems} madde tamamlandı
        </p>
        <div
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={list.progressPercent}
          className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"
          role="progressbar"
        >
          <motion.div
            animate={{ width: `${list.progressPercent}%` }}
            className={`h-full rounded-full ${colorDefinition.bar}`}
            initial={false}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <p className="mt-1.5 text-right text-[10px] font-semibold text-slate-400">
          %{list.progressPercent}
        </p>
      </div>
    </motion.button>
  );
}
