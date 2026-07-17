"use client";

import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { toCoupleEvent } from "@/lib/events/event-mapper";
import { createClient } from "@/lib/supabase/client";
import type { CoupleEvent, EventRow } from "@/types/events";

interface UseEventsOptions {
  initialEvents: CoupleEvent[];
  coupleId: string;
  currentUserId: string;
  currentUserName: string;
  partnerName: string;
}

function orderEvents(events: CoupleEvent[]) {
  return [...events].sort((first, second) =>
    first.eventDate.localeCompare(second.eventDate),
  );
}

export function useEvents({
  initialEvents,
  coupleId,
  currentUserId,
  currentUserName,
  partnerName,
}: UseEventsOptions) {
  const [events, setEvents] = useState(() => orderEvents(initialEvents));
  const [realtimeError, setRealtimeError] = useState<string>();
  const eventsRef = useRef(events);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  const upsert = useCallback((event: CoupleEvent) => {
    setEvents((current) =>
      orderEvents([event, ...current.filter((item) => item.id !== event.id)]),
    );
  }, []);

  const remove = useCallback((eventId: string) => {
    setEvents((current) => current.filter((event) => event.id !== eventId));
  }, []);

  useEffect(() => {
    const supabase = createClient();

    function handleChange(payload: RealtimePostgresChangesPayload<EventRow>) {
      if (payload.eventType === "DELETE") {
        remove(String(payload.old.id));
        return;
      }
      const row = payload.new as EventRow;
      if (row.couple_id !== coupleId) return;
      const createdByName =
        eventsRef.current.find((event) => event.id === row.id)?.createdByName ??
        (row.created_by === currentUserId ? currentUserName : partnerName);
      upsert(toCoupleEvent(row, createdByName));
    }

    const channel = supabase
      .channel(`events:${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "events",
          filter: `couple_id=eq.${coupleId}`,
        },
        handleChange,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "events",
          filter: `couple_id=eq.${coupleId}`,
        },
        handleChange,
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "events",
          filter: `couple_id=eq.${coupleId}`,
        },
        handleChange,
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT")
          setRealtimeError(
            "Takvim canlı senkronizasyonu geçici olarak kullanılamıyor.",
          );
        if (status === "SUBSCRIBED") setRealtimeError(undefined);
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [coupleId, currentUserId, currentUserName, partnerName, remove, upsert]);

  return useMemo(
    () => ({ events, realtimeError, upsert, remove }),
    [events, realtimeError, remove, upsert],
  );
}
