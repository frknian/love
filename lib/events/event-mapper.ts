import type { CoupleEvent, EventRow } from "@/types/events";
import { isEventType } from "@/types/events";

export function toCoupleEvent(
  row: EventRow,
  createdByName: string,
): CoupleEvent {
  return {
    id: row.id,
    coupleId: row.couple_id,
    title: row.title,
    description: row.description,
    eventType: isEventType(row.event_type) ? row.event_type : "other",
    eventDate: row.event_date,
    repeatYearly: row.repeat_yearly,
    coverImage: row.cover_image,
    createdBy: row.created_by,
    createdByName,
    createdAt: row.created_at,
  };
}
