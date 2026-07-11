import type { Countdown, CountdownRow } from "@/types/countdowns";

export function toCountdown(row: CountdownRow): Countdown {
  return {
    id: row.id,
    coupleId: row.couple_id,
    title: row.title,
    icon: row.icon,
    targetDate: row.target_date,
    coverImage: row.cover_image,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}
