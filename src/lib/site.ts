// THE SITE'S OWN ADDRESS — one constant, imported everywhere.
//
// This exists because it was wrong in eleven places at once. The site moved to
// tracethecascade.com, but layout.tsx, sitemap.ts, robots.ts and challengeCoin.ts
// each carried their own hardcoded "https://owh-three.vercel.app". The result,
// measured live on 2026-09-07: every page on the real domain emitted
// <link rel="canonical" href="https://owh-three.vercel.app/…">, which tells
// Google the page it is reading is a copy and the vercel.app address is the
// original. The sitemap served from tracethecascade.com listed 129 URLs on a
// different host, which a crawler is entitled to ignore outright. Every ranking
// signal the site earned was being handed to a throwaway address.
//
// WWW, not the apex, and not a guess: https://tracethecascade.com answers 308
// and redirects to https://www.tracethecascade.com/. A canonical URL must be the
// address that actually serves the page, never one that redirects to it — so
// this matches the redirect target exactly. If the apex is ever made primary in
// Vercel, change this one line and everything below follows.
//
// No trailing slash. Paths are appended as `${SITE_URL}/learn`.
export const SITE_URL = "https://www.tracethecascade.com";

// What a human types when someone reads the address out loud, or when it is
// printed on a shareable card. Kept beside the URL so the two can never drift.
export const SITE_HOST = "tracethecascade.com";
