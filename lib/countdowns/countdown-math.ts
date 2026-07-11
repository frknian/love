import type { Countdown, CountdownRemaining } from "@/types/countdowns";

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** Hedefe kalan süreyi gün/saat/dakika/saniye olarak ayrıştırır. */
export function getRemaining(
  targetDate: string,
  now = new Date(),
): CountdownRemaining {
  const totalMs = new Date(targetDate).getTime() - now.getTime();
  if (totalMs <= 0) {
    return {
      totalMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isPast: true,
    };
  }
  return {
    totalMs,
    days: Math.floor(totalMs / DAY_MS),
    hours: Math.floor((totalMs % DAY_MS) / HOUR_MS),
    minutes: Math.floor((totalMs % HOUR_MS) / MINUTE_MS),
    seconds: Math.floor((totalMs % MINUTE_MS) / SECOND_MS),
    isPast: false,
  };
}

/** Oluşturulma anından hedefe geçen sürenin yüzdesi (0-100). */
export function getProgressPercent(
  countdown: Countdown,
  now = new Date(),
): number {
  const start = new Date(countdown.createdAt).getTime();
  const end = new Date(countdown.targetDate).getTime();
  if (end <= start) return 100;
  const ratio = (now.getTime() - start) / (end - start);
  return Math.min(100, Math.max(0, Math.round(ratio * 100)));
}

/** En yakın hedefe göre sıralar; geçmiş olanlar sona düşer. */
export function sortCountdowns(
  countdowns: Countdown[],
  now = new Date(),
): Countdown[] {
  return [...countdowns].sort((first, second) => {
    const firstRemaining = new Date(first.targetDate).getTime() - now.getTime();
    const secondRemaining =
      new Date(second.targetDate).getTime() - now.getTime();
    const firstPast = firstRemaining <= 0;
    const secondPast = secondRemaining <= 0;
    if (firstPast !== secondPast) return firstPast ? 1 : -1;
    return firstPast
      ? secondRemaining - firstRemaining
      : firstRemaining - secondRemaining;
  });
}
