export const eventTypes = [
  "birthday",
  "anniversary",
  "first_meet",
  "first_date",
  "travel",
  "holiday",
  "movie_night",
  "coffee_date",
  "special",
  "other",
] as const;

export type EventType = (typeof eventTypes)[number];

export function isEventType(value: string): value is EventType {
  return (eventTypes as readonly string[]).includes(value);
}

export interface EventTypeDefinition {
  type: EventType;
  label: string;
  icon: string;
  /** Rozet arka planı + metin sınıfları. */
  badge: string;
  /** Takvim hücrelerindeki nokta rengi. */
  dot: string;
}

export interface EventRow {
  id: string;
  couple_id: string;
  title: string;
  description: string | null;
  event_type: string;
  event_date: string;
  repeat_yearly: boolean;
  cover_image: string | null;
  created_by: string;
  created_at: string;
}

export interface CoupleEvent {
  id: string;
  coupleId: string;
  title: string;
  description: string | null;
  eventType: EventType;
  eventDate: string;
  repeatYearly: boolean;
  coverImage: string | null;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

/** Yıllık tekrar eden etkinliklerin belirli bir yıla yansıtılmış hali. */
export interface EventOccurrence {
  event: CoupleEvent;
  /** ISO tarih (YYYY-MM-DD) — bu yılki gerçekleşme tarihi. */
  date: string;
  daysUntil: number;
}

export const calendarViews = ["month", "week", "list"] as const;

export type CalendarView = (typeof calendarViews)[number];
