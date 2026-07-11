import { CalendarDays, ChevronRight } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { formatDaysUntilTr } from "@/lib/events/calendar";
import { getEventTypeDefinition } from "@/lib/events/event-types";
import type { EventOccurrence } from "@/types/events";

interface UpcomingEventsCardProps {
  occurrences: EventOccurrence[];
}

export function UpcomingEventsCard({ occurrences }: UpcomingEventsCardProps) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Yaklaşan etkinlikler</p>
        <CalendarDays aria-hidden="true" className="size-4 text-rose-300" />
      </div>
      {occurrences.length ? (
        <ul className="mt-3 space-y-2.5">
          {occurrences.map(({ event, date, daysUntil }) => (
            <li
              className="flex items-center gap-2.5"
              key={`${event.id}-${date}`}
            >
              <span aria-hidden="true" className="text-lg">
                {getEventTypeDefinition(event.eventType).icon}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                {event.title}
              </span>
              <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
                {formatDaysUntilTr(daysUntil)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-400">
          Yaklaşan etkinlik yok. Takvimden ekleyebilirsin.
        </p>
      )}
      <Link
        className="mt-3 inline-flex items-center gap-0.5 text-xs font-semibold text-rose-500 hover:text-rose-600"
        href="/takvim"
      >
        Takvime git
        <ChevronRight className="size-3.5" />
      </Link>
    </Card>
  );
}
