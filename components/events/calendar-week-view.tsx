"use client";

import { useMemo } from "react";

import { getWeekDays, occurrencesOnDay } from "@/lib/events/calendar";
import { getEventTypeDefinition } from "@/lib/events/event-types";
import type { CoupleEvent } from "@/types/events";

interface CalendarWeekViewProps {
  anchor: Date;
  events: CoupleEvent[];
  onOpenEvent: (event: CoupleEvent) => void;
}

const dayFormatter = new Intl.DateTimeFormat("tr-TR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function CalendarWeekView({
  anchor,
  events,
  onOpenEvent,
}: CalendarWeekViewProps) {
  const days = useMemo(() => getWeekDays(anchor), [anchor]);

  return (
    <div aria-label="Hafta görünümü" className="space-y-2">
      {days.map((day) => {
        const dayEvents = occurrencesOnDay(events, day.date);
        return (
          <div
            className={`rounded-2xl px-4 py-3 ${
              day.isToday ? "bg-rose-50/80" : "bg-white/55"
            }`}
            key={day.isoDate}
          >
            <p
              className={`text-xs font-semibold ${
                day.isToday ? "text-rose-600" : "text-slate-500"
              }`}
            >
              {dayFormatter.format(day.date)}
              {day.isToday ? " • Bugün" : ""}
            </p>
            {dayEvents.length ? (
              <ul className="mt-2 space-y-1.5">
                {dayEvents.map((event) => {
                  const definition = getEventTypeDefinition(event.eventType);
                  return (
                    <li key={event.id}>
                      <button
                        className="flex w-full items-center gap-2 rounded-xl bg-white/80 px-3 py-2 text-left text-sm text-slate-700 shadow-sm transition hover:bg-white"
                        onClick={() => onOpenEvent(event)}
                        type="button"
                      >
                        <span aria-hidden="true">{definition.icon}</span>
                        <span className="truncate font-medium">
                          {event.title}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-1.5 text-xs text-slate-300">Etkinlik yok</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
