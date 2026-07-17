"use client";

import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";

import { toJournalEntry } from "@/lib/journal/journal-mapper";
import { createClient } from "@/lib/supabase/client";
import type {
  JournalEntry,
  JournalRow,
  JournalSearchField,
} from "@/types/journal";

interface UseJournalOptions {
  initialEntries: JournalEntry[];
  coupleId: string;
  currentUserId: string;
  currentUserName: string;
  partnerName: string;
}

function orderEntries(entries: JournalEntry[]) {
  return [...entries].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() -
      new Date(first.createdAt).getTime(),
  );
}

export function useJournal({
  initialEntries,
  coupleId,
  currentUserId,
  currentUserName,
  partnerName,
}: UseJournalOptions) {
  const [entries, setEntries] = useState(() => orderEntries(initialEntries));
  const [realtimeError, setRealtimeError] = useState<string>();

  const upsert = useCallback((entry: JournalEntry) => {
    setEntries((current) =>
      orderEntries([entry, ...current.filter((item) => item.id !== entry.id)]),
    );
  }, []);

  const remove = useCallback((entryId: string) => {
    setEntries((current) => current.filter((entry) => entry.id !== entryId));
  }, []);

  useEffect(() => {
    const supabase = createClient();

    async function handleChange(
      payload: RealtimePostgresChangesPayload<JournalRow>,
    ) {
      if (payload.eventType === "DELETE") {
        remove(String(payload.old.id));
        return;
      }
      const row = payload.new as JournalRow;
      if (row.couple_id !== coupleId) return;
      const authorName =
        row.author_id === currentUserId ? currentUserName : partnerName;
      const entry = await toJournalEntry(supabase, row, authorName);
      upsert(entry);
    }

    const channel = supabase
      .channel(`journals:${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "journals",
          filter: `couple_id=eq.${coupleId}`,
        },
        handleChange,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "journals",
          filter: `couple_id=eq.${coupleId}`,
        },
        handleChange,
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "journals",
          filter: `couple_id=eq.${coupleId}`,
        },
        handleChange,
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT")
          setRealtimeError("Günlük canlı senkronizasyonu kullanılamıyor.");
        if (status === "SUBSCRIBED") setRealtimeError(undefined);
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [coupleId, currentUserId, currentUserName, partnerName, remove, upsert]);

  const search = useCallback(
    (query: string, fields: JournalSearchField[]) => {
      const normalized = query.trim().toLocaleLowerCase("tr-TR");
      if (!normalized) return entries;
      return entries.filter((entry) => {
        return fields.some((field) => {
          if (field === "title")
            return entry.title.toLocaleLowerCase("tr-TR").includes(normalized);
          if (field === "content")
            return entry.content
              .toLocaleLowerCase("tr-TR")
              .includes(normalized);
          if (field === "author")
            return entry.authorName
              .toLocaleLowerCase("tr-TR")
              .includes(normalized);
          return new Date(entry.createdAt)
            .toLocaleDateString("tr-TR")
            .includes(normalized);
        });
      });
    },
    [entries],
  );

  return useMemo(
    () => ({ entries, search, realtimeError, upsert, remove }),
    [entries, realtimeError, remove, search, upsert],
  );
}
