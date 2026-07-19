import { createClient } from "@/lib/supabase/server";
import { getAuthUser, getCoupleMembers } from "@/lib/supabase/session";
import type { Album, MemoriesContext, Memory } from "@/types/memories";
import type {
  MemoryHighlightItemRow,
  MemoryHighlightRow,
} from "@/types/social";

function toAlbum(record: {
  id: string;
  couple_id: string;
  title: string;
  cover_image: string | null;
  created_at: string;
}): Album {
  return {
    id: record.id,
    coupleId: record.couple_id,
    title: record.title,
    coverImage: record.cover_image,
    createdAt: record.created_at,
  };
}

export async function getMemoriesContext(): Promise<MemoriesContext | null> {
  const [user, members] = await Promise.all([
    getAuthUser(),
    getCoupleMembers(),
  ]);
  if (!user) return null;

  const me = members.find((member) => member.id === user.id);
  const partner = members.find((member) => member.id !== user.id);
  return me
    ? {
        userId: user.id,
        coupleId: me.couple_id,
        displayName: me.display_name,
        partnerId: partner?.id ?? null,
        partnerName: partner?.display_name ?? null,
      }
    : null;
}

export async function getAlbums(): Promise<Album[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("albums")
    .select("id, couple_id, title, cover_image, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error("Albümler yüklenemedi.");
  return (data ?? []).map(toAlbum);
}

export async function getMemories(): Promise<Memory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memories")
    .select(
      "id, album_id, couple_id, uploaded_by, image_url, media_type, note_content, is_favorite, title, description, location, memory_date, created_at",
    )
    .order("memory_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error("Anılar yüklenemedi.");

  const records = data ?? [];
  const mediaPaths = records
    .map((record) => record.image_url)
    .filter((path): path is string => Boolean(path));
  const { data: signedUrls } = mediaPaths.length
    ? await supabase.storage
        .from("memories")
        .createSignedUrls(mediaPaths, 60 * 60)
    : { data: [] };
  const signedUrlByPath = new Map(
    (signedUrls ?? []).map((signedUrl) => [
      signedUrl.path,
      signedUrl.signedUrl ?? "",
    ]),
  );

  return records.map((record) => ({
    id: record.id,
    albumId: record.album_id,
    coupleId: record.couple_id,
    uploadedBy: record.uploaded_by,
    imagePath: record.image_url,
    imageUrl: record.image_url
      ? (signedUrlByPath.get(record.image_url) ?? null)
      : null,
    mediaType: record.media_type,
    noteContent: record.note_content,
    isFavorite: record.is_favorite,
    title: record.title,
    description: record.description,
    location: record.location,
    memoryDate: record.memory_date,
    createdAt: record.created_at,
  }));
}

export async function getMemoryHighlights(): Promise<{
  highlights: MemoryHighlightRow[];
  items: MemoryHighlightItemRow[];
}> {
  const supabase = await createClient();
  const [highlightResult, itemResult] = await Promise.all([
    supabase
      .from("memory_highlights")
      .select("*")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("memory_highlight_items")
      .select("*")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);
  if (highlightResult.error || itemResult.error)
    throw new Error("Öne çıkan anılar yüklenemedi.");
  return {
    highlights: (highlightResult.data ?? []) as MemoryHighlightRow[],
    items: (itemResult.data ?? []) as MemoryHighlightItemRow[],
  };
}
