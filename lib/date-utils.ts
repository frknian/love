const DAY_MS = 24 * 60 * 60 * 1000;

/** Yerel saat dilimine göre YYYY-MM-DD üretir. */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** YYYY-MM-DD dizesini yerel gece yarısına çözer. */
export function fromIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function isSameDay(first: Date, second: Date): boolean {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

/** İki tarih arasındaki tam gün farkı (saat bileşenleri yok sayılır). */
export function differenceInDays(target: Date, from: Date): number {
  return Math.round(
    (startOfDay(target).getTime() - startOfDay(from).getTime()) / DAY_MS,
  );
}

/** İlişki başlangıcından itibaren geçen gün sayısı; gelecek tarihleri sıfırlar. */
export function daysSince(isoDate: string, now = new Date()): number {
  return Math.max(0, differenceInDays(now, fromIsoDate(isoDate)));
}

/** Pazartesi başlangıçlı hafta başı. */
export function startOfWeek(date: Date): Date {
  const day = startOfDay(date);
  const weekday = (day.getDay() + 6) % 7;
  return addDays(day, -weekday);
}

export function formatDateTr(
  date: Date,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  },
): string {
  return new Intl.DateTimeFormat("tr-TR", options).format(date);
}

export function formatTimeTr(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** "3 dk önce", "Dün", "12 Mayıs" tarzı kısa görece zaman. */
export function formatRelativeTimeTr(
  isoDateTime: string,
  now = new Date(),
): string {
  const date = new Date(isoDateTime);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Az önce";
  if (diffMinutes < 60) return `${diffMinutes} dk önce`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24 && isSameDay(date, now)) return `${diffHours} sa önce`;
  if (isSameDay(date, addDays(now, -1))) return `Dün ${formatTimeTr(date)}`;
  return formatDateTr(date, { day: "numeric", month: "long" });
}
