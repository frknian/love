import type { SupabaseClient } from "@supabase/supabase-js";

import type { JournalEntry, JournalRow } from "@/types/journal";

export async function toJournalEntry(
  supabase: SupabaseClient,
  row: JournalRow,
  authorName: string,
): Promise<JournalEntry> {
  const images = await Promise.all(
    (row.images ?? []).map(async ({ path }) => {
      const { data } = await supabase.storage
        .from("journal-media")
        .createSignedUrl(path, 60 * 60);
      return { path, url: data?.signedUrl ?? "" };
    }),
  );

  return {
    id: row.id,
    coupleId: row.couple_id,
    authorId: row.author_id,
    authorName,
    title: row.title,
    content: row.content,
    mood: row.mood,
    weather: row.weather,
    images,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
