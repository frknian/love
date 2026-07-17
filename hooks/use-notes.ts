"use client";

import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { toNote } from "@/lib/note-mapper";
import { createClient } from "@/lib/supabase/client";
import type { Note, NoteFilter, NoteRow } from "@/types/notes";

interface UseNotesOptions {
  initialNotes: Note[];
  coupleId: string;
  currentUserId: string;
}

function orderNotes(notes: Note[]) {
  return [...notes].sort((first, second) => {
    if (first.pinned !== second.pinned) return first.pinned ? -1 : 1;
    return (
      new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime()
    );
  });
}

export function useNotes({
  initialNotes,
  coupleId,
  currentUserId,
}: UseNotesOptions) {
  const [notes, setNotes] = useState(() => orderNotes(initialNotes));
  const [realtimeError, setRealtimeError] = useState<string>();
  const notesRef = useRef(notes);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  const upsert = useCallback((note: Note) => {
    setNotes((current) =>
      orderNotes([note, ...current.filter((item) => item.id !== note.id)]),
    );
  }, []);

  const remove = useCallback((noteId: string) => {
    setNotes((current) => current.filter((note) => note.id !== noteId));
  }, []);

  useEffect(() => {
    const supabase = createClient();
    async function resolveAuthorName(authorId: string) {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", authorId)
        .maybeSingle();
      return data?.display_name ?? "Partner";
    }

    async function handleChange(
      payload: RealtimePostgresChangesPayload<NoteRow>,
    ) {
      if (payload.eventType === "DELETE") {
        remove(String(payload.old.id));
        return;
      }

      const row = payload.new as NoteRow;
      if (row.couple_id !== coupleId) return;
      const existing = notesRef.current.find((note) => note.id === row.id);
      const authorName =
        existing?.authorName ??
        (row.author_id === currentUserId
          ? "Sen"
          : await resolveAuthorName(row.author_id));
      upsert(toNote(row, authorName));
    }

    const channel = supabase
      .channel(`notes:${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notes",
          filter: `couple_id=eq.${coupleId}`,
        },
        handleChange,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notes",
          filter: `couple_id=eq.${coupleId}`,
        },
        handleChange,
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notes",
          filter: `couple_id=eq.${coupleId}`,
        },
        handleChange,
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT")
          setRealtimeError(
            "Canlı senkronizasyon geçici olarak kullanılamıyor.",
          );
        if (status === "SUBSCRIBED") setRealtimeError(undefined);
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [coupleId, currentUserId, remove, upsert]);

  const filteredNotes = useCallback(
    (query: string, filter: NoteFilter) => {
      const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");
      return notes.filter((note) => {
        const matchesQuery =
          !normalizedQuery ||
          `${note.title} ${note.content}`
            .toLocaleLowerCase("tr-TR")
            .includes(normalizedQuery);
        const matchesFilter =
          filter === "all" ||
          (filter === "pinned" && note.pinned) ||
          (filter === "mine" && note.authorId === currentUserId) ||
          (filter === "partner" && note.authorId !== currentUserId);
        return matchesQuery && matchesFilter;
      });
    },
    [currentUserId, notes],
  );

  return useMemo(
    () => ({ notes, filteredNotes, realtimeError, upsert, remove }),
    [filteredNotes, notes, realtimeError, remove, upsert],
  );
}
