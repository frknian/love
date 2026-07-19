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
  bucket_items:
    | {
        title: string;
        completed: boolean;
        created_at: string;
      }[]
    | null;
}

function getLatestBucketActivity(list: HomeBucketListRow): number {
  return Math.max(
    new Date(list.created_at).getTime(),
    ...(list.bucket_items ?? []).map((item) =>
      new Date(item.created_at).getTime(),
    ),
  );
}

/**
 * Ana ekran için listeleri ve isteklerini tek Supabase sorgusunda özetler.
 * En son oluşturulan veya yeni madde eklenen liste seçilir; böylece kullanıcı
 * hangi listeyi güncellerse güncellesin ana kartta o liste görünür.
 */
export async function getHomeBucketProgress(): Promise<BucketListWithProgress | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bucket_lists")
    .select(
      "id, couple_id, title, description, cover_image, color, created_by, created_at, bucket_items(title, completed, created_at)",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error("Liste özeti yüklenemedi.");
  const rows = (data ?? []) as unknown as HomeBucketListRow[];
  if (!rows.length) return null;

  const row = [...rows].sort(
    (first, second) =>
      getLatestBucketActivity(second) - getLatestBucketActivity(first),
  )[0];
  const items = row.bucket_items ?? [];
  const totalItems = items.length;
  const completedItems = items.filter((item) => item.completed).length;
  const latestItem = items
    .map((item) => ({ ...item, listTitle: row.title }))
    .sort(
      (first, second) =>
        new Date(second.created_at).getTime() -
        new Date(first.created_at).getTime(),
    )[0];

  return {
    ...toBucketList(row),
    totalItems,
    completedItems,
    progressPercent: totalItems
      ? Math.round((completedItems / totalItems) * 100)
      : 0,
    latestItemTitle: latestItem?.title ?? null,
    latestItemCompleted: latestItem?.completed ?? null,
    latestItemListTitle: latestItem?.listTitle ?? null,
  };
}
