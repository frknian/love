interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const requests = new Map<string, RateLimitEntry>();

export function checkRateLimit(key: string, limit = 10, windowMs = 60_000) {
  const now = Date.now();
  const entry = requests.get(key);
  if (!entry || entry.resetAt <= now) {
    requests.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }
  entry.count += 1;
  return {
    allowed: entry.count <= limit,
    retryAfterMs: Math.max(0, entry.resetAt - now),
  };
}
