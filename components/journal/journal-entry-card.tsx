"use client";

import { motion } from "framer-motion";
import { Trash2, UserRound } from "lucide-react";

import { formatDateTr, formatTimeTr } from "@/lib/date-utils";
import {
  getMoodDefinition,
  getWeatherDefinition,
} from "@/lib/journal/journal-catalog";
import type { JournalEntry } from "@/types/journal";

interface JournalEntryCardProps {
  entry: JournalEntry;
  canDelete: boolean;
  onOpen: (entry: JournalEntry) => void;
  onDelete: (entry: JournalEntry) => void;
  isLast: boolean;
}

export function JournalEntryCard({
  entry,
  canDelete,
  onOpen,
  onDelete,
  isLast,
}: JournalEntryCardProps) {
  const mood = getMoodDefinition(entry.mood);
  const weather = getWeatherDefinition(entry.weather);
  const createdAt = new Date(entry.createdAt);

  return (
    <motion.li
      animate={{ opacity: 1, x: 0 }}
      className="group relative pl-10"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0, x: -8 }}
      layout
    >
      <span
        aria-hidden="true"
        className={`absolute left-0 top-1 grid size-8 place-items-center rounded-full text-base ${mood.badge}`}
      >
        {mood.emoji}
      </span>
      {!isLast ? (
        <span
          aria-hidden="true"
          className="absolute left-4 top-9 h-[calc(100%-1.25rem)] w-px bg-rose-100 dark:bg-white/10"
        />
      ) : null}
      <button
        className="w-full rounded-3xl border border-white/70 bg-white/65 p-4 text-left shadow-soft backdrop-blur-xl transition hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-400 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
        onClick={() => onOpen(entry)}
        type="button"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {entry.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {entry.content}
            </p>
          </div>
          {weather ? (
            <span aria-label={weather.label} className="shrink-0 text-lg">
              {weather.emoji}
            </span>
          ) : null}
        </div>
        {entry.images.length ? (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {entry.images.slice(0, 4).map((image) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                alt=""
                aria-hidden="true"
                className="size-16 shrink-0 rounded-xl object-cover"
                key={image.path}
                src={image.url}
              />
            ))}
          </div>
        ) : null}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <span className="inline-flex items-center gap-1">
            <UserRound className="size-3" />
            {entry.authorName}
          </span>
          <time dateTime={entry.createdAt}>
            {formatDateTr(createdAt)} • {formatTimeTr(createdAt)}
          </time>
        </div>
      </button>
      {canDelete ? (
        <button
          aria-label={`${entry.title} günlüğünü sil`}
          className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-white/80 text-slate-300 opacity-0 transition hover:text-rose-500 focus-visible:opacity-100 group-hover:opacity-100 dark:bg-slate-900/60"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(entry);
          }}
          type="button"
        >
          <Trash2 className="size-3.5" />
        </button>
      ) : null}
    </motion.li>
  );
}
