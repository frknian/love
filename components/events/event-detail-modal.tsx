"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Pencil, Trash2, UserRound, X } from "lucide-react";
import { useEffect } from "react";

import { differenceInDays, formatDateTr, fromIsoDate } from "@/lib/date-utils";
import { formatDaysUntilTr, nextOccurrenceDate } from "@/lib/events/calendar";
import { getEventTypeDefinition } from "@/lib/events/event-types";
import type { CoupleEvent } from "@/types/events";

interface EventDetailModalProps {
  event: CoupleEvent;
  onClose: () => void;
  onEdit: (event: CoupleEvent) => void;
  onDelete: (event: CoupleEvent) => void;
}

export function EventDetailModal({
  event,
  onClose,
  onEdit,
  onDelete,
}: EventDetailModalProps) {
  const definition = getEventTypeDefinition(event.eventType);
  const occurrence = nextOccurrenceDate(event, new Date());
  const daysUntil = differenceInDays(occurrence, new Date());
  const originalDate = fromIsoDate(event.eventDate);

  useEffect(() => {
    function handleKeyDown(keyboardEvent: KeyboardEvent) {
      if (keyboardEvent.key === "Escape") onClose();
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
          aria-label={`${event.title} etkinlik detayı`}
          aria-modal="true"
          className="relative w-full max-w-sm overflow-hidden rounded-[2rem] bg-[#fffafd] shadow-2xl"
          exit={{ scale: 0.92, y: 16, opacity: 0 }}
          initial={{ scale: 0.92, y: 16, opacity: 0 }}
          onClick={(clickEvent) => clickEvent.stopPropagation()}
          role="dialog"
          transition={{ type: "spring", damping: 24, stiffness: 300 }}
        >
          {event.coverImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              alt={`${event.title} kapak görseli`}
              className="h-40 w-full object-cover"
              src={event.coverImage}
            />
          ) : (
            <div className="grid h-32 place-items-center bg-gradient-to-br from-rose-100 via-pink-50 to-amber-50 text-5xl">
              <span aria-hidden="true">{definition.icon}</span>
            </div>
          )}
          <button
            aria-label="Detayı kapat"
            className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-white/85 text-slate-500 shadow-sm transition hover:text-rose-500"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
          <div className="px-6 pb-6 pt-5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${definition.badge}`}
            >
              <span aria-hidden="true">{definition.icon}</span>
              {definition.label}
            </span>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-800">
              {event.title}
            </h2>
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <CalendarDays
                aria-hidden="true"
                className="size-4 text-rose-400"
              />
              {formatDateTr(originalDate)}
              {event.repeatYearly ? " • Her yıl" : ""}
            </p>
            {daysUntil >= 0 ? (
              <p className="mt-3 inline-flex rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600">
                {formatDaysUntilTr(daysUntil)}
              </p>
            ) : null}
            {event.description ? (
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {event.description}
              </p>
            ) : null}
            <p className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <UserRound aria-hidden="true" className="size-3.5" />
              {event.createdByName} oluşturdu
            </p>
            <div className="mt-5 flex gap-2">
              <button
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white"
                onClick={() => onEdit(event)}
                type="button"
              >
                <Pencil className="size-4" />
                Düzenle
              </button>
              <button
                aria-label="Etkinliği sil"
                className="grid size-11 place-items-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-rose-100 hover:text-rose-600"
                onClick={() => onDelete(event)}
                type="button"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}
