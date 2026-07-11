"use client";

import { AnimatePresence } from "framer-motion";
import { BookHeart, Plus, WifiOff } from "lucide-react";
import { useMemo, useState } from "react";

import { JournalDetailModal } from "@/components/journal/journal-detail-modal";
import { JournalEntryCard } from "@/components/journal/journal-entry-card";
import { JournalSearchBar } from "@/components/journal/journal-search-bar";
import { JournalSheet } from "@/components/journal/journal-sheet";
import { useToast } from "@/components/ui/toast-provider";
import { useJournal } from "@/hooks/use-journal";
import { toJournalEntry } from "@/lib/journal/journal-mapper";
import { createClient } from "@/lib/supabase/client";
import {
  journalService,
  type JournalInput,
} from "@/services/journal/journal-service";
import type { JournalEntry, JournalSearchField } from "@/types/journal";

interface JournalWorkspaceProps {
  initialEntries: JournalEntry[];
  coupleId: string;
  currentUserId: string;
  currentUserName: string;
  partnerName: string;
}

export function JournalWorkspace({
  initialEntries,
  coupleId,
  currentUserId,
  currentUserName,
  partnerName,
}: JournalWorkspaceProps) {
  const { search, realtimeError, upsert, remove } = useJournal({
    initialEntries,
    coupleId,
    currentUserId,
    currentUserName,
    partnerName,
  });
  const [query, setQuery] = useState("");
  const [fields, setFields] = useState<JournalSearchField[]>([
    "title",
    "content",
    "author",
    "date",
  ]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [error, setError] = useState<string>();
  const { showToast } = useToast();

  const visibleEntries = useMemo(
    () => search(query, fields),
    [fields, query, search],
  );

  async function handleCreate(input: JournalInput, images: File[]) {
    setError(undefined);
    const row = await journalService.create(
      coupleId,
      currentUserId,
      input,
      images,
    );
    const entry = await toJournalEntry(createClient(), row, currentUserName);
    upsert(entry);
    showToast("Günlük kaydedildi.");
  }

  async function handleDelete(entry: JournalEntry) {
    const confirmed = window.confirm(
      `"${entry.title}" günlük kaydını silmek istiyor musun?`,
    );
    if (!confirmed) return;
    setError(undefined);
    try {
      await journalService.remove(entry.id);
      remove(entry.id);
      if (activeEntry?.id === entry.id) setActiveEntry(null);
    } catch {
      setError("Günlük silinemedi.");
    }
  }

  return (
    <div className="relative">
      <JournalSearchBar
        fields={fields}
        onFieldsChange={setFields}
        onQueryChange={setQuery}
        query={query}
      />
      {realtimeError ? (
        <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
          <WifiOff className="size-3.5" />
          {realtimeError}
        </p>
      ) : null}
      {error ? (
        <p
          className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {visibleEntries.length ? (
        <ul className="mt-6 space-y-4">
          <AnimatePresence initial={false}>
            {visibleEntries.map((entry, index) => (
              <JournalEntryCard
                canDelete={entry.authorId === currentUserId}
                entry={entry}
                isLast={index === visibleEntries.length - 1}
                key={entry.id}
                onDelete={handleDelete}
                onOpen={setActiveEntry}
              />
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <div className="mt-8 rounded-3xl border border-dashed border-rose-200 bg-white/50 px-5 py-12 text-center dark:border-white/10 dark:bg-white/[0.02]">
          <BookHeart
            aria-hidden="true"
            className="mx-auto size-8 text-rose-300"
          />
          <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">
            {query ? "Eşleşen kayıt bulunamadı" : "Henüz günlük kaydı yok"}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {query
              ? "Aramanı veya filtrelerini değiştirmeyi dene."
              : "Bugününüzü anlatan ilk kaydı ekleyin. ♡"}
          </p>
        </div>
      )}
      <button
        aria-label="Yeni günlük kaydı ekle"
        className="fixed bottom-24 right-5 z-40 grid size-14 place-items-center rounded-full bg-rose-500 text-white shadow-[0_12px_25px_rgba(244,63,94,0.35)] transition hover:scale-105 sm:bottom-8 sm:right-8"
        onClick={() => setIsSheetOpen(true)}
        type="button"
      >
        <Plus className="size-6" />
      </button>
      {isSheetOpen ? (
        <JournalSheet
          onClose={() => setIsSheetOpen(false)}
          onSubmit={handleCreate}
        />
      ) : null}
      {activeEntry ? (
        <JournalDetailModal
          entry={activeEntry}
          onClose={() => setActiveEntry(null)}
        />
      ) : null}
    </div>
  );
}
