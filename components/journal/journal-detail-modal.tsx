"use client";

import { AnimatePresence, motion } from "framer-motion";
import { UserRound, X } from "lucide-react";
import { useEffect } from "react";

import { formatDateTr, formatTimeTr } from "@/lib/date-utils";
import {
  getMoodDefinition,
  getWeatherDefinition,
} from "@/lib/journal/journal-catalog";
import type { JournalEntry } from "@/types/journal";

interface JournalDetailModalProps {
  entry: JournalEntry;
  onClose: () => void;
}

export function JournalDetailModal({
  entry,
  onClose,
}: JournalDetailModalProps) {
  const mood = getMoodDefinition(entry.mood);
  const weather = getWeatherDefinition(entry.weather);
  const createdAt = new Date(entry.createdAt);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[70] grid place-items-center bg-slate-900/35 px-5 backdrop-blur-sm"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.section
          animate={{ scale: 1, y: 0, opacity: 1 }}
          aria-label={`${entry.title} günlük kaydı`}
          aria-modal="true"
          className="relative max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-[2rem] bg-[#fffafd] shadow-2xl dark:bg-slate-900"
          exit={{ scale: 0.92, y: 16, opacity: 0 }}
          initial={{ scale: 0.92, y: 16, opacity: 0 }}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          transition={{ type: "spring", damping: 24, stiffness: 300 }}
        >
          <button
            aria-label="Kapat"
            className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full bg-white/85 text-slate-500 shadow-sm transition hover:text-rose-500 dark:bg-slate-800/85"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
          <div className="p-6">
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={`grid size-10 place-items-center rounded-2xl text-xl ${mood.badge}`}
              >
                {mood.emoji}
              </span>
              {weather ? (
                <span aria-label={weather.label} className="text-xl">
                  {weather.emoji}
                </span>
              ) : null}
            </div>
            <h2 className="mt-4 text-xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">
              {entry.title}
            </h2>
            <p className="mt-1 flex items-center gap-2 text-xs text-slate-400">
              <UserRound className="size-3.5" />
              {entry.authorName} • {formatDateTr(createdAt)} •{" "}
              {formatTimeTr(createdAt)}
            </p>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
              {entry.content}
            </p>
            {entry.images.length ? (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {entry.images.map((image) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    alt=""
                    className="aspect-square w-full rounded-2xl object-cover"
                    key={image.path}
                    src={image.url}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}
