"use client";

import { AnimatePresence } from "framer-motion";
import { Plus, Search, WifiOff } from "lucide-react";
import { useMemo, useState } from "react";

import { NoteCard } from "@/components/notes/note-card";
import { NoteSheet } from "@/components/notes/note-sheet";
import { useNotes } from "@/hooks/use-notes";
import { toNote } from "@/lib/note-mapper";
import { notesService, type NoteInput } from "@/services/notes/notes-service";
import type { Note, NoteFilter } from "@/types/notes";

interface NotesWorkspaceProps {
  initialNotes: Note[];
  coupleId: string;
  currentUserId: string;
  currentUserName: string;
}

const filters: { value: NoteFilter; label: string }[] = [
  { value: "all", label: "Hepsi" },
  { value: "pinned", label: "Sabitlenenler" },
  { value: "mine", label: "Benim yazdıklarım" },
  { value: "partner", label: "Partnerimin" },
];

export function NotesWorkspace({
  initialNotes,
  coupleId,
  currentUserId,
  currentUserName,
}: NotesWorkspaceProps) {
  const { filteredNotes, realtimeError, remove, upsert } = useNotes({
    initialNotes,
    coupleId,
    currentUserId,
  });
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<NoteFilter>("all");
  const [activeNote, setActiveNote] = useState<Note | "new" | null>(null);
  const [error, setError] = useState<string>();
  const visibleNotes = useMemo(
    () => filteredNotes(query, filter),
    [filter, filteredNotes, query],
  );

  async function handleSave(input: NoteInput) {
    setError(undefined);
    if (activeNote && activeNote !== "new") {
      const row = await notesService.update(activeNote.id, input);
      upsert(toNote(row, activeNote.authorName));
      return;
    }
    const row = await notesService.create(coupleId, currentUserId, input);
    upsert(toNote(row, currentUserName));
  }

  async function handleDelete(note: Note) {
    const confirmed = window.confirm(
      `“${note.title}” notunu silmek istiyor musun?`,
    );
    if (!confirmed) return;
    setError(undefined);
    try {
      await notesService.remove(note.id);
      remove(note.id);
    } catch {
      setError("Not silinemedi. Lütfen tekrar dene.");
    }
  }

  return (
    <div className="relative">
      <div className="mt-6 flex items-center gap-2 rounded-2xl border border-white/70 bg-white/65 px-4 py-3 shadow-sm backdrop-blur-xl">
        <Search className="size-4 text-slate-400" />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Notlarda ara"
          value={query}
        />
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {filters.map((item) => (
          <button
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition ${filter === item.value ? "bg-rose-500 text-white" : "bg-white/70 text-slate-500 hover:bg-rose-50"}`}
            key={item.value}
            onClick={() => setFilter(item.value)}
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
        <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {error}
        </p>
      ) : null}
      {visibleNotes.length ? (
        <div className="mt-5 columns-1 gap-4 sm:columns-2">
          <AnimatePresence initial={false}>
            {visibleNotes.map((note) => (
              <NoteCard
                canEdit={note.authorId === currentUserId}
                key={note.id}
                note={note}
                onDelete={handleDelete}
                onEdit={setActiveNote}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border border-dashed border-rose-200 bg-white/50 px-5 py-12 text-center">
          <p className="font-semibold text-slate-700">
            {query || filter !== "all"
              ? "Eşleşen not bulunamadı"
              : "Henüz not yok"}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {query || filter !== "all"
              ? "Aramanı veya filtresini değiştirmeyi dene."
              : "İlk küçük notunu bırakarak başlayın. ♡"}
          </p>
        </div>
      )}
      <button
        aria-label="Yeni not ekle"
        className="fixed bottom-24 right-5 z-40 grid size-14 place-items-center rounded-full bg-rose-500 text-white shadow-[0_12px_25px_rgba(244,63,94,0.35)] transition hover:scale-105 sm:bottom-8 sm:right-8"
        onClick={() => setActiveNote("new")}
        type="button"
      >
        <Plus className="size-6" />
      </button>
      {activeNote ? (
        <NoteSheet
          note={activeNote === "new" ? undefined : activeNote}
          onClose={() => setActiveNote(null)}
          onSubmit={handleSave}
        />
      ) : null}
    </div>
  );
}
