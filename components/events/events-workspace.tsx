"use client";

import { ChevronLeft, ChevronRight, Plus, WifiOff } from "lucide-react";
import { useMemo, useState } from "react";

import { CalendarMonthView } from "@/components/events/calendar-month-view";
import { CalendarWeekView } from "@/components/events/calendar-week-view";
import { EventDetailModal } from "@/components/events/event-detail-modal";
import { EventListView } from "@/components/events/event-list-view";
import { EventSheet } from "@/components/events/event-sheet";
import { Card } from "@/components/ui/card";
import { useEvents } from "@/hooks/use-events";
import {
  addDays,
  formatDateTr,
  fromIsoDate,
  toIsoDate,
} from "@/lib/date-utils";
import { occurrencesOnDay } from "@/lib/events/calendar";
import { toCoupleEvent } from "@/lib/events/event-mapper";
import { getEventTypeDefinition } from "@/lib/events/event-types";
import {
  eventsService,
  type EventInput,
} from "@/services/events/events-service";
import type { CalendarView, CoupleEvent } from "@/types/events";

interface EventsWorkspaceProps {
  initialEvents: CoupleEvent[];
  coupleId: string;
  currentUserId: string;
  currentUserName: string;
  partnerName: string;
}

const views: { value: CalendarView; label: string }[] = [
  { value: "month", label: "Ay" },
  { value: "week", label: "Hafta" },
  { value: "list", label: "Liste" },
];

const monthFormatter = new Intl.DateTimeFormat("tr-TR", {
  month: "long",
  year: "numeric",
});

export function EventsWorkspace({
  initialEvents,
  coupleId,
  currentUserId,
  currentUserName,
  partnerName,
}: EventsWorkspaceProps) {
  const { events, realtimeError, upsert, remove } = useEvents({
    initialEvents,
    coupleId,
    currentUserId,
    currentUserName,
    partnerName,
  });
  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedIsoDate, setSelectedIsoDate] = useState(() =>
    toIsoDate(new Date()),
  );
  const [detailEvent, setDetailEvent] = useState<CoupleEvent | null>(null);
  const [sheetState, setSheetState] = useState<CoupleEvent | "new" | null>(
    null,
  );
  const [error, setError] = useState<string>();

  const selectedDayEvents = useMemo(
    () => occurrencesOnDay(events, fromIsoDate(selectedIsoDate)),
    [events, selectedIsoDate],
  );

  function shiftCursor(direction: -1 | 1) {
    if (view === "week") {
      setCursor((current) => addDays(current, direction * 7));
      return;
    }
    setCursor(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + direction, 1),
    );
  }

  async function handleSave(input: EventInput) {
    setError(undefined);
    if (sheetState && sheetState !== "new") {
      const row = await eventsService.update(sheetState.id, input);
      if (input.eventType === "anniversary") {
        await eventsService.setRelationshipStartDate(coupleId, input.eventDate);
      }
      upsert(toCoupleEvent(row, sheetState.createdByName));
      setDetailEvent(null);
      return;
    }
    const row = await eventsService.create(coupleId, currentUserId, input);
    if (input.eventType === "anniversary") {
      await eventsService.setRelationshipStartDate(coupleId, input.eventDate);
    }
    upsert(toCoupleEvent(row, currentUserName));
  }

  async function handleDelete(event: CoupleEvent) {
    const confirmed = window.confirm(
      `“${event.title}” etkinliğini silmek istiyor musun?`,
    );
    if (!confirmed) return;
    setError(undefined);
    try {
      await eventsService.remove(event.id);
      remove(event.id);
      setDetailEvent(null);
    } catch {
      setError("Etkinlik silinemedi. Lütfen tekrar dene.");
    }
  }

  return (
    <div className="relative">
      <div
        aria-label="Takvim görünümü seçimi"
        className="mt-6 flex gap-2"
        role="tablist"
      >
        {views.map((item) => (
          <button
            aria-selected={view === item.value}
            className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition ${
              view === item.value
                ? "bg-rose-500 text-white"
                : "bg-white/70 text-slate-500 hover:bg-rose-50 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10"
            }`}
            key={item.value}
            onClick={() => setView(item.value)}
            role="tab"
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      {realtimeError ? (
        <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <WifiOff className="size-3.5" />
          {realtimeError}
        </p>
      ) : null}
      {error ? (
        <p
          className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <Card className="mt-4">
        {view !== "list" ? (
          <div className="mb-3 flex items-center justify-between">
            <button
              aria-label={view === "week" ? "Önceki hafta" : "Önceki ay"}
              className="grid size-9 place-items-center rounded-full bg-rose-50 text-rose-500 transition hover:bg-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:hover:bg-rose-500/25"
              onClick={() => shiftCursor(-1)}
              type="button"
            >
              <ChevronLeft className="size-5" />
            </button>
            <p className="text-sm font-semibold capitalize text-slate-700 dark:text-slate-200">
              {monthFormatter.format(cursor)}
            </p>
            <button
              aria-label={view === "week" ? "Sonraki hafta" : "Sonraki ay"}
              className="grid size-9 place-items-center rounded-full bg-rose-50 text-rose-500 transition hover:bg-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:hover:bg-rose-500/25"
              onClick={() => shiftCursor(1)}
              type="button"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        ) : null}
        {view === "month" ? (
          <CalendarMonthView
            events={events}
            month={cursor.getMonth()}
            onSelectDay={setSelectedIsoDate}
            selectedIsoDate={selectedIsoDate}
            year={cursor.getFullYear()}
          />
        ) : view === "week" ? (
          <CalendarWeekView
            anchor={cursor}
            events={events}
            onOpenEvent={setDetailEvent}
          />
        ) : (
          <EventListView events={events} onOpenEvent={setDetailEvent} />
        )}
      </Card>
      {view === "month" ? (
        <div className="mt-4">
          <h2 className="text-sm font-semibold text-slate-600">
            {formatDateTr(fromIsoDate(selectedIsoDate))}
          </h2>
          {selectedDayEvents.length ? (
            <ul className="mt-2 space-y-2">
              {selectedDayEvents.map((event) => {
                const definition = getEventTypeDefinition(event.eventType);
                return (
                  <li key={event.id}>
                    <button
                      className="flex w-full items-center gap-3 rounded-2xl border border-white/70 bg-white/65 px-4 py-3 text-left shadow-sm backdrop-blur-xl transition hover:bg-white/90 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
                      onClick={() => setDetailEvent(event)}
                      type="button"
                    >
                      <span aria-hidden="true" className="text-lg">
                        {definition.icon}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                        {event.title}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${definition.badge}`}
                      >
                        {definition.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 rounded-2xl bg-white/50 px-4 py-3 text-sm text-slate-400 dark:bg-white/[0.04] dark:text-slate-500">
              Bu günde etkinlik yok.
            </p>
          )}
        </div>
      ) : null}
      <button
        aria-label="Yeni etkinlik ekle"
        className="fixed bottom-24 right-5 z-40 grid size-14 place-items-center rounded-full bg-rose-500 text-white shadow-[0_12px_25px_rgba(244,63,94,0.35)] transition hover:scale-105 sm:bottom-8 sm:right-8"
        onClick={() => setSheetState("new")}
        type="button"
      >
        <Plus className="size-6" />
      </button>
      {detailEvent ? (
        <EventDetailModal
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
          onDelete={handleDelete}
          onEdit={(event) => setSheetState(event)}
        />
      ) : null}
      {sheetState ? (
        <EventSheet
          event={sheetState === "new" ? undefined : sheetState}
          onClose={() => setSheetState(null)}
          onSubmit={handleSave}
        />
      ) : null}
    </div>
  );
}
