import {
  addDays,
  differenceInDays,
  fromIsoDate,
  startOfDay,
  startOfWeek,
  toIsoDate,
} from "@/lib/date-utils";
import type { CoupleEvent, EventOccurrence } from "@/types/events";

/**
 * Yıllık tekrar eden bir etkinliğin belirli bir yıldaki karşılığı.
 * 29 Şubat gibi tarihler artık yılı olmayan yıllarda JS Date'in kendi
 * taşma davranışıyla 1 Mart'a kayar — bu taşma `nextOccurrenceDate` ve
 * `occurrencesOnDay` arasında tutarlı olsun diye tek yerden hesaplanır.
 */
function occurrenceInYear(event: CoupleEvent, year: number): Date {
  const original = fromIsoDate(event.eventDate);
  if (!event.repeatYearly) return original;
  return new Date(year, original.getMonth(), original.getDate());
}

/**
 * Yıllık tekrar eden bir etkinliğin `from` gününde ya da sonrasındaki
 * ilk gerçekleşme tarihini döner; tekrar etmeyenlerde orijinal tarih.
 */
export function nextOccurrenceDate(event: CoupleEvent, from: Date): Date {
  if (!event.repeatYearly) return fromIsoDate(event.eventDate);

  const today = startOfDay(from);
  const candidate = occurrenceInYear(event, today.getFullYear());
  if (candidate < today)
    return occurrenceInYear(event, today.getFullYear() + 1);
  return candidate;
}

/** Etkinlikleri bir sonraki gerçekleşmelerine göre yansıtır ve sıralar. */
export function toUpcomingOccurrences(
  events: CoupleEvent[],
  from = new Date(),
): EventOccurrence[] {
  const today = startOfDay(from);
  return events
    .map((event) => {
      const date = nextOccurrenceDate(event, today);
      return {
        event,
        date: toIsoDate(date),
        daysUntil: differenceInDays(date, today),
      };
    })
    .filter((occurrence) => occurrence.daysUntil >= 0)
    .sort(
      (first, second) =>
        first.daysUntil - second.daysUntil ||
        first.event.title.localeCompare(second.event.title, "tr-TR"),
    );
}

/** Belirli bir güne düşen etkinlikler (yıllık tekrarlar dahil). */
export function occurrencesOnDay(
  events: CoupleEvent[],
  day: Date,
): CoupleEvent[] {
  const targetIso = toIsoDate(day);
  return events.filter(
    (event) =>
      toIsoDate(occurrenceInYear(event, day.getFullYear())) === targetIso,
  );
}

export interface CalendarDay {
  date: Date;
  isoDate: string;
  inCurrentMonth: boolean;
  isToday: boolean;
}

/** Pazartesi başlangıçlı, 6 haftalık ay matrisi. */
export function getMonthMatrix(year: number, month: number): CalendarDay[][] {
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = startOfWeek(firstOfMonth);
  const today = new Date();

  const weeks: CalendarDay[][] = [];
  for (let week = 0; week < 6; week += 1) {
    const days: CalendarDay[] = [];
    for (let weekday = 0; weekday < 7; weekday += 1) {
      const date = addDays(gridStart, week * 7 + weekday);
      days.push({
        date,
        isoDate: toIsoDate(date),
        inCurrentMonth: date.getMonth() === month,
        isToday: toIsoDate(date) === toIsoDate(today),
      });
    }
    weeks.push(days);
  }
  return weeks;
}

export function getWeekDays(anchor: Date): CalendarDay[] {
  const weekStart = startOfWeek(anchor);
  const today = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    return {
      date,
      isoDate: toIsoDate(date),
      inCurrentMonth: true,
      isToday: toIsoDate(date) === toIsoDate(today),
    };
  });
}

export const weekdayLabelsTr = [
  "Pzt",
  "Sal",
  "Çar",
  "Per",
  "Cum",
  "Cmt",
  "Paz",
];

export function formatDaysUntilTr(daysUntil: number): string {
  if (daysUntil === 0) return "Bugün!";
  if (daysUntil === 1) return "Yarın";
  return `${daysUntil} gün kaldı`;
}
