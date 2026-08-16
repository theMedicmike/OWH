import type { MetadataRoute } from "next";

export const SITE_URL = "https://owh-three.vercel.app";

// THE SITEMAP — only what a crawler can actually read.
//
// Measured 2026-08-14: 46 of this app's 52 routes sit behind a Supabase auth
// wall and return a sign-in prompt to anyone not logged in. Listing those
// would submit ~46 identical thin pages to Google, which is worse than
// listing nothing — it spends crawl budget on a login screen and teaches the
// index that this domain is mostly empty.
//
// So this lists the genuinely public pages only. If a page is ever moved
// outside the auth wall, it gets added here in the same commit; that is the
// whole maintenance rule.
//
// Deliberately absent: /reviewer. It is a beta-feedback sheet for VSOs and
// clinicians we hand out directly, not a page that should surface in search.
const PUBLIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/trust", priority: 0.8, changeFrequency: "monthly" },
  { path: "/clinician", priority: 0.7, changeFrequency: "monthly" },
  { path: "/support", priority: 0.6, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.4, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PUBLIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
