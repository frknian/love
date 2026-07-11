"use client";

import { useMemo } from "react";

import { formatDateTr, fromIsoDate } from "@/lib/date-utils";
import {
  formatDaysUntilTr,
  toUpcomingOccurrences,
} from "@/lib/events/calendar";
import { getEventTypeDefinition } from "@/lib/events/event-types";
import type { CoupleEvent } from "@/types/events";

interface EventListViewProps {
  events: CoupleEvent[];
  onOpenEvent: (event: CoupleEvent) => void;
}

export function EventListView({ events, onOpenEvent }: EventListViewProps) {
  const occurrences = useMemo(() => toUpcomingOccurrences(events), [events]);

  if (!occurrences.length) {
    return (
      <div className="rounded-3xl border border-dashed border-rose-200 bg-white/50 px-5 py-12 text-center">
        <p className="font-semibold text-slate-700">Yaklaşan etkinlik yok</p>
        <p className="mt-1 text-sm text-slate-400">
          İlk özel gününüzü ekleyerek başlayın. ♡
        </p>
      </div>
    );
  }

  return (
    <ul aria-label="Yaklaşan etkinlikler" className="space-y-3">
      {occurrences.map(({ event, date, daysUntil }) => {
        const definition = getEventTypeDefinition(event.eventType);
        return (
          <li key={`${event.id}-${date}`}>
            <button
              className="flex w-full items-center gap-3 rounded-3xl border border-white/70 bg-white/65 p-4 text-left shadow-sm backdrop-blur-xl transition hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-400"
              onClick={() => onOpenEvent(event)}
              type="button"
            >
              <span
                aria-hidden="true"
                className={`grid size-12 shrink-0 place-items-center rounded-2xl text-xl ${definition.badge}`}
              >
                {definition.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-800">
                  {event.title}
                </span>
                <span className="mt-0.5 block text-xs text-slate-400">
                  {formatDateTr(fromIsoDate(date))}
                  {event.repeatYearly ? " • Her yıl" : ""}
                </span>
              </span>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                  daysUntil === 0
                    ? "bg-rose-500 text-white"
                    : "bg-rose-100 text-rose-600"
                }`}
              >
                {formatDaysUntilTr(daysUntil)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
