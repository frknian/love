import type { TimeCapsuleMeta, TimeCapsuleRow } from "@/types/capsule";

export function toTimeCapsuleMeta(
  row: TimeCapsuleRow,
  authorName: string,
  now = new Date(),
): TimeCapsuleMeta {
  return {
    id: row.id,
    coupleId: row.couple_id,
    authorId: row.author_id,
    authorName,
    title: row.title,
    unlockDate: row.unlock_date,
    opened: row.opened,
    openedAt: row.opened_at,
    createdAt: row.created_at,
    isUnlocked: new Date(row.unlock_date).getTime() <= now.getTime(),
  };
}
