import type { EventType, EventTypeDefinition } from "@/types/events";

/**
 * Etkinlik türü kataloğu.
 * Yeni bir tür eklemek için `types/events.ts` içindeki `eventTypes` dizisine
 * anahtarı, buraya da görsel tanımını eklemek yeterlidir.
 */
export const eventTypeCatalog: EventTypeDefinition[] = [
  {
    type: "birthday",
    label: "Doğum Günü",
    icon: "🎂",
    badge: "bg-rose-100 text-rose-600",
    dot: "bg-rose-400",
  },
  {
    type: "anniversary",
    label: "Yıldönümü",
    icon: "💍",
    badge: "bg-purple-100 text-purple-600",
    dot: "bg-purple-400",
  },
  {
    type: "first_meet",
    label: "İlk Tanışma",
    icon: "✨",
    badge: "bg-amber-100 text-amber-600",
    dot: "bg-amber-400",
  },
  {
    type: "first_date",
    label: "İlk Buluşma",
    icon: "🌹",
    badge: "bg-pink-100 text-pink-600",
    dot: "bg-pink-400",
  },
  {
    type: "travel",
    label: "Seyahat",
    icon: "✈️",
    badge: "bg-sky-100 text-sky-600",
    dot: "bg-sky-400",
  },
  {
    type: "holiday",
    label: "Tatil",
    icon: "🏖️",
    badge: "bg-teal-100 text-teal-600",
    dot: "bg-teal-400",
  },
  {
    type: "movie_night",
    label: "Film Gecesi",
    icon: "🎬",
    badge: "bg-indigo-100 text-indigo-600",
    dot: "bg-indigo-400",
  },
  {
    type: "coffee_date",
    label: "Kahve Randevusu",
    icon: "☕",
    badge: "bg-orange-100 text-orange-700",
    dot: "bg-orange-400",
  },
  {
    type: "special",
    label: "Özel Gün",
    icon: "💖",
    badge: "bg-fuchsia-100 text-fuchsia-600",
    dot: "bg-fuchsia-400",
  },
  {
    type: "other",
    label: "Diğer",
    icon: "📌",
    badge: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
  },
];

const eventTypesByKey = new Map(
  eventTypeCatalog.map((definition) => [definition.type, definition]),
);

export function getEventTypeDefinition(type: EventType): EventTypeDefinition {
  return (
    eventTypesByKey.get(type) ?? eventTypeCatalog[eventTypeCatalog.length - 1]
  );
}
