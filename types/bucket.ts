export const bucketListColors = [
  "rose",
  "amber",
  "sky",
  "emerald",
  "violet",
  "slate",
] as const;

export type BucketListColor = (typeof bucketListColors)[number];

export const bucketItemPriorities = ["low", "medium", "high"] as const;

export type BucketItemPriority = (typeof bucketItemPriorities)[number];

export interface BucketListRow {
  id: string;
  couple_id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  color: BucketListColor;
  created_by: string;
  created_at: string;
}

export interface BucketList {
  id: string;
  coupleId: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  color: BucketListColor;
  createdBy: string;
  createdAt: string;
}

export interface BucketItemRow {
  id: string;
  bucket_list_id: string;
  couple_id: string;
  title: string;
  description: string | null;
  priority: BucketItemPriority;
  position: number;
  completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
}

export interface BucketItem {
  id: string;
  bucketListId: string;
  coupleId: string;
  title: string;
  description: string | null;
  priority: BucketItemPriority;
  position: number;
  completed: boolean;
  completedAt: string | null;
  completedBy: string | null;
  completedByName: string | null;
  createdAt: string;
}

export interface BucketListWithProgress extends BucketList {
  totalItems: number;
  completedItems: number;
  progressPercent: number;
  /** Ana ekran özetinde gösterilecek en son eklenen istek. */
  latestItemTitle?: string | null;
  latestItemCompleted?: boolean | null;
  latestItemListTitle?: string | null;
}

export interface BucketContext {
  userId: string;
  coupleId: string;
  displayName: string;
}
