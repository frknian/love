import { toJournalEntry } from "@/lib/journal/journal-mapper";
import { createClient } from "@/lib/supabase/server";
import type { JournalEntry, JournalRow } from "@/types/journal";

interface JournalQueryRow extends JournalRow {
  author: { display_name: string } | null;
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journals")
    .select(
      "id, couple_id, author_id, title, content, mood, weather, images, created_at, updated_at, author:profiles!journals_author_id_fkey(display_name)",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error("Günlük kayıtları yüklenemedi.");

  const rows = (data ?? []) as unknown as JournalQueryRow[];
  return Promise.all(
    rows.map((row) =>
      toJournalEntry(supabase, row, row.author?.display_name ?? "Partner"),
    ),
  );
}

export async function getLatestJournalEntry(): Promise<JournalEntry | null> {
  const entries = await getJournalEntries();
  return entries[0] ?? null;
}
