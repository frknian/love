import {
  mapJournalRow,
  signJournalImagePaths,
} from "@/lib/journal/journal-mapper";
import { createClient } from "@/lib/supabase/server";
import type { JournalEntry, JournalRow } from "@/types/journal";
import type { JournalMood } from "@/types/journal";

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

export interface LatestJournalSummary {
  id: string;
  authorName: string;
  title: string;
  mood: JournalMood;
  createdAt: string;
}

interface LatestJournalSummaryRow {
  id: string;
  title: string;
  mood: JournalMood;
  created_at: string;
  author: { display_name: string } | null;
}

/** Ana kart görsel veya içerik göstermediği için Storage imzalama turunu tamamen atlar. */
export async function getLatestJournalSummary(): Promise<LatestJournalSummary | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journals")
    .select(
      "id, title, mood, created_at, author:profiles!journals_author_id_fkey(display_name)",
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("Günlük özeti yüklenemedi.");
  if (!data) return null;

  const row = data as unknown as LatestJournalSummaryRow;
  return {
    id: row.id,
    authorName: row.author?.display_name ?? "Partner",
    title: row.title,
    mood: row.mood,
    createdAt: row.created_at,
  };
}
