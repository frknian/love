import type { SupabaseClient } from "@supabase/supabase-js";

import type { JournalEntry, JournalRow } from "@/types/journal";

/**
 * Verilen depolama yolları için TEK istekte toplu imzalı URL üretir.
 * Görsel başına ayrı `createSignedUrl` çağrısı, çok fotoğraflı
 * günlüklerde sayfa yüklemesini ciddi biçimde yavaşlatıyordu.
 */
export async function signJournalImagePaths(
  supabase: SupabaseClient,
  paths: string[],
): Promise<Map<string, string>> {
  if (!paths.length) return new Map();
  const { data } = await supabase.storage
    .from("journal-media")
    .createSignedUrls(paths, 60 * 60);
  return new Map(
    (data ?? []).map((signed) => [signed.path ?? "", signed.signedUrl ?? ""]),
  );
}

/** Satırı, önceden imzalanmış URL haritasını kullanarak eşler (ağ isteği yok). */
export function mapJournalRow(
  row: JournalRow,
  authorName: string,
  urlByPath: Map<string, string>,
): JournalEntry {
  return {
    id: row.id,
    coupleId: row.couple_id,
    authorId: row.author_id,
    authorName,
    title: row.title,
    content: row.content,
    mood: row.mood,
    weather: row.weather,
    images: (row.images ?? []).map(({ path }) => ({
      path,
      url: urlByPath.get(path) ?? "",
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Tek satır için kolaylık sarmalayıcısı (realtime olayları gibi durumlar). */
export async function toJournalEntry(
  supabase: SupabaseClient,
  row: JournalRow,
  authorName: string,
): Promise<JournalEntry> {
  const urlByPath = await signJournalImagePaths(
    supabase,
    (row.images ?? []).map((image) => image.path),
  );
  return mapJournalRow(row, authorName, urlByPath);
}
