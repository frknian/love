"use client";

import { useMemo } from "react";

import {
  getMonthMatrix,
  occurrencesOnDay,
  weekdayLabelsTr,
} from "@/lib/events/calendar";
import { getEventTypeDefinition } from "@/lib/events/event-types";
import type { CoupleEvent } from "@/types/events";

interface CalendarMonthViewProps {
  year: number;
  month: number;
  events: CoupleEvent[];
  selectedIsoDate: string;
  onSelectDay: (isoDate: string) => void;
}

export function CalendarMonthView({
  year,
  month,
  events,
  selectedIsoDate,
  onSelectDay,
}: CalendarMonthViewProps) {
  const weeks = useMemo(() => getMonthMatrix(year, month), [month, year]);

  return (
    <div role="grid" aria-label="Ay görünümü">
      <div className="grid grid-cols-7 text-center" role="row">
        {weekdayLabelsTr.map((label) => (
          <span
            className="py-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500"
            key={label}
            role="columnheader"
          >
            {label}
          </span>
        ))}
      </div>
      {weeks.map((week, weekIndex) => (
        <div className="grid grid-cols-7" key={weekIndex} role="row">
          {week.map((day) => {
            const dayEvents = occurrencesOnDay(events, day.date);
            const isSelected = day.isoDate === selectedIsoDate;
            return (
              <button
                aria-label={`${day.date.getDate()} ${day.date.toLocaleDateString("tr-TR", { month: "long" })}, ${dayEvents.length} etkinlik`}
                aria-pressed={isSelected}
                className={`relative mx-auto my-0.5 grid size-11 place-items-center rounded-2xl text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-400 ${
                  isSelected
                    ? "bg-rose-500 font-semibold text-white"
                    : day.isToday
                      ? "bg-rose-100 font-semibold text-rose-600 dark:bg-rose-500/20 dark:text-rose-300"
                      : day.inCurrentMonth
                        ? "text-slate-700 hover:bg-rose-50 dark:text-slate-200 dark:hover:bg-white/10"
                        : "text-slate-300 hover:bg-slate-50 dark:text-slate-600 dark:hover:bg-white/5"
                }`}
                key={day.isoDate}
                onClick={() => onSelectDay(day.isoDate)}
                type="button"
              >
                {day.date.getDate()}
                {dayEvents.length ? (
                  <span className="absolute bottom-1.5 flex gap-0.5">
                    {dayEvents.slice(0, 3).map((event) => (
                      <span
                        aria-hidden="true"
                        className={`size-1.5 rounded-full ${
                          isSelected
                            ? "bg-white"
                            : getEventTypeDefinition(event.eventType).dot
                        }`}
                        key={event.id}
                      />
                    ))}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
