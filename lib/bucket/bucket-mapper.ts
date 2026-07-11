import type {
  BucketItem,
  BucketItemRow,
  BucketList,
  BucketListRow,
  BucketListWithProgress,
} from "@/types/bucket";

export function toBucketList(row: BucketListRow): BucketList {
  return {
    id: row.id,
    coupleId: row.couple_id,
    title: row.title,
    description: row.description,
    coverImage: row.cover_image,
    color: row.color,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export function toBucketItem(
  row: BucketItemRow,
  completedByName: string | null,
): BucketItem {
  return {
    id: row.id,
    bucketListId: row.bucket_list_id,
    coupleId: row.couple_id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    position: row.position,
    completed: row.completed,
    completedAt: row.completed_at,
    completedBy: row.completed_by,
    completedByName,
    createdAt: row.created_at,
  };
}

export function withProgress(
  list: BucketList,
  items: BucketItem[],
): BucketListWithProgress {
  const listItems = items.filter((item) => item.bucketListId === list.id);
  const totalItems = listItems.length;
  const completedItems = listItems.filter((item) => item.completed).length;
  const progressPercent = totalItems
    ? Math.round((completedItems / totalItems) * 100)
    : 0;
  return { ...list, totalItems, completedItems, progressPercent };
}
