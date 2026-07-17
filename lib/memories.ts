import { createClient } from "@/lib/supabase/server";
import { getAuthUser, getCoupleMembers } from "@/lib/supabase/session";
import type { Album, MemoriesContext, Memory } from "@/types/memories";

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
  const user = await getAuthUser();
  if (!user) return null;

  const members = await getCoupleMembers();
  const me = members.find((member) => member.id === user.id);
  return me ? { userId: user.id, coupleId: me.couple_id } : null;
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
      "id, album_id, couple_id, uploaded_by, image_url, title, description, location, memory_date, created_at",
    )
    .order("memory_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error("Anılar yüklenemedi.");

  const records = data ?? [];
  const { data: signedUrls } = records.length
    ? await supabase.storage.from("memories").createSignedUrls(
        records.map((record) => record.image_url),
        60 * 60,
      )
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
    imageUrl: signedUrlByPath.get(record.image_url) ?? "",
    title: record.title,
    description: record.description,
    location: record.location,
    memoryDate: record.memory_date,
    createdAt: record.created_at,
  }));
}
