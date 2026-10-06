// Lightweight in-memory rate limiter — a first-line cap on abuse and runaway AI
// cost. Memory is per server instance (not shared across serverless instances),
// so this is a sane default, not a hard guarantee; for strict limits use a shared
// store (e.g. Upstash/Redis). Good enough to stop a single bad actor hammering the
// AI endpoints.
//
// WHAT THIS CANNOT DO, so nobody mistakes it for the budget control it is not:
// the caps are per instance, so a client spread across N Vercel instances gets
// N times the allowance. The only hard ceiling on AI spend is the spend limit
// set in the Anthropic console. This narrows the blast radius; it does not
// close it. Measured 2026-10-05: at the old 40/min the worst case for a single
// authenticated account was roughly $164/hr, dominated by Medic Mike's ~9,900
// character system prompt being re-sent on every request.

type Entry = { count: number; reset: number };
const buckets = new Map<string, Entry>();

// EVICTION. Keys are `route:userId:ip`, and nothing ever removed them, so on a
// warm instance this Map grew once per unique user-and-network pair and never
// shrank. At ten members that is invisible; on a launch day it is a slow leak
// inside a function that is supposed to be cheap, and the thing it eventually
// takes down is the rate limiter that was meant to protect the budget.
//
// Swept lazily, on call, because a serverless instance has no reliable timer and
// setInterval would keep it alive.
const SWEEP_EVERY_MS = 60_000;
const MAX_KEYS = 10_000;
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < SWEEP_EVERY_MS && buckets.size < MAX_KEYS) return;
  lastSweep = now;
  for (const [k, v] of buckets) if (now > v.reset) buckets.delete(k);
  // Still oversized after dropping every expired bucket means this instance is
  // seeing something abnormal. Drop the half closest to expiry rather than grow
  // without bound: a limiter that exhausts the function's memory is worse than
  // one that briefly forgets somebody.
  if (buckets.size > MAX_KEYS) {
    const live = [...buckets.entries()].sort((a, b) => a[1].reset - b[1].reset);
    for (let i = 0; i < Math.floor(live.length / 2); i++) buckets.delete(live[i][0]);
  }
}

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  sweep(now);
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
