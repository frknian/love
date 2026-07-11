"use client";

import { motion } from "framer-motion";
import { Lock, LockOpen, Trash2 } from "lucide-react";

import { formatDateTr } from "@/lib/date-utils";
import type { TimeCapsuleMeta } from "@/types/capsule";

interface CapsuleLockedCardProps {
  capsule: TimeCapsuleMeta;
  daysRemaining: number;
  onOpen: (capsule: TimeCapsuleMeta) => void;
  onDelete?: (capsule: TimeCapsuleMeta) => void;
}

export function CapsuleLockedCard({
  capsule,
  daysRemaining,
  onOpen,
  onDelete,
}: CapsuleLockedCardProps) {
  const canInteract = capsule.isUnlocked;

  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/65 p-5 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]"
      exit={{ opacity: 0, y: -8 }}
      initial={{ opacity: 0, y: 8 }}
      layout
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`grid size-12 shrink-0 place-items-center rounded-2xl text-xl ${
            canInteract
              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300"
              : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400"
          }`}
        >
          {canInteract ? (
            <LockOpen className="size-5" />
          ) : (
            <Lock className="size-5" />
          )}
        </span>
        {onDelete ? (
          <button
            aria-label={`${capsule.title} kapsülünü sil`}
            className="grid size-8 shrink-0 place-items-center rounded-full text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 dark:text-slate-600 dark:hover:bg-rose-500/10"
            onClick={() => onDelete(capsule)}
            type="button"
          >
            <Trash2 className="size-4" />
          </button>
        ) : null}
      </div>
      <h3 className="mt-3 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
        {capsule.title}
      </h3>
      <p className="mt-1 text-xs text-slate-400">
        {capsule.authorName} oluşturdu •{" "}
        {formatDateTr(new Date(capsule.unlockDate))}
      </p>
      <p className="mt-3 text-xs text-slate-400">
        Açılmadan önce yalnızca başlık ve tarih görünür.
      </p>
      <button
        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
          canInteract
            ? "bg-rose-500 text-white hover:bg-rose-600"
            : "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500"
        }`}
        disabled={!canInteract}
        onClick={() => canInteract && onOpen(capsule)}
        type="button"
      >
        {canInteract
          ? capsule.opened
            ? "Mesajı Görüntüle"
            : "Kapsülü Aç"
          : `${daysRemaining} gün sonra açılacak`}
      </button>
    </motion.article>
  );
}
