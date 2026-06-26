// Lightweight in-memory rate limiter — a first-line cap on abuse and runaway AI
// cost. Memory is per server instance (not shared across serverless instances),
// so this is a sane default, not a hard guarantee; for strict limits use a shared
// store (e.g. Upstash/Redis). Good enough to stop a single bad actor hammering the
// AI endpoints.

type Entry = { count: number; reset: number };
const buckets = new Map<string, Entry>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const e = buckets.get(key);
  if (!e || now > e.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (e.count >= limit) return false;
  e.count++;
  return true;
}

export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = (fwd ? fwd.split(",")[0].trim() : "") || req.headers.get("x-real-ip") || "anon";
  return ip;
}
