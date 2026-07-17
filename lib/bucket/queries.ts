import { toBucketItem, toBucketList } from "@/lib/bucket/bucket-mapper";
import { createClient } from "@/lib/supabase/server";
import type {
  BucketItem,
  BucketItemRow,
  BucketList,
  BucketListRow,
  BucketListWithProgress,
} from "@/types/bucket";

interface BucketItemQueryRow extends BucketItemRow {
  completer: { display_name: string } | null;
}

export async function getBucketLists(): Promise<BucketList[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bucket_lists")
    .select(
      "id, couple_id, title, description, cover_image, color, created_by, created_at",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error("Yapmak istedikleriniz yüklenemedi.");
  return ((data ?? []) as BucketListRow[]).map(toBucketList);
}

export async function getBucketItems(): Promise<BucketItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bucket_items")
    .select(
      "id, bucket_list_id, couple_id, title, description, priority, position, completed, completed_at, completed_by, created_at, completer:profiles!bucket_items_completed_by_fkey(display_name)",
    )
    .order("position", { ascending: true });
  if (error) throw new Error("Liste maddeleri yüklenemedi.");
  return ((data ?? []) as unknown as BucketItemQueryRow[]).map((row) =>
    toBucketItem(row, row.completer?.display_name ?? null),
  );
}

interface HomeBucketListRow extends BucketListRow {
  bucket_items: { completed: boolean }[] | null;
}

/** Ana ekran için iki tabloyu ayrı ayrı indirmek yerine ilk listeyi tek sorguda özetler. */
export async function getHomeBucketProgress(): Promise<BucketListWithProgress | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bucket_lists")
    .select(
      "id, couple_id, title, description, cover_image, color, created_by, created_at, bucket_items(completed)",
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("Liste özeti yüklenemedi.");
  if (!data) return null;

  const row = data as unknown as HomeBucketListRow;
  const items = row.bucket_items ?? [];
  const totalItems = items.length;
  const completedItems = items.filter((item) => item.completed).length;
  return {
    ...toBucketList(row),
    totalItems,
    completedItems,
    progressPercent: totalItems
      ? Math.round((completedItems / totalItems) * 100)
      : 0,
  };
}
