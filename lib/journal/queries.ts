import {
  mapJournalRow,
  signJournalImagePaths,
} from "@/lib/journal/journal-mapper";
import { createClient } from "@/lib/supabase/server";
import type { JournalEntry, JournalRow } from "@/types/journal";

interface JournalQueryRow extends JournalRow {
  author: { display_name: string } | null;
}

async function queryJournalEntries(limit?: number): Promise<JournalEntry[]> {
  const supabase = await createClient();
  let query = supabase
    .from("journals")
    .select(
      "id, couple_id, author_id, title, content, mood, weather, images, created_at, updated_at, author:profiles!journals_author_id_fkey(display_name)",
    )
    .order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw new Error("Günlük kayıtları yüklenemedi.");

  const rows = (data ?? []) as unknown as JournalQueryRow[];
  // Tüm kayıtların görselleri tek istekte imzalanır (kayıt/görsel başına değil).
  const urlByPath = await signJournalImagePaths(
    supabase,
    rows.flatMap((row) => (row.images ?? []).map((image) => image.path)),
  );

  return rows.map((row) =>
    mapJournalRow(row, row.author?.display_name ?? "Partner", urlByPath),
  );
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  return queryJournalEntries();
}

export async function getLatestJournalEntry(): Promise<JournalEntry | null> {
  const entries = await queryJournalEntries(1);
  return entries[0] ?? null;
}
