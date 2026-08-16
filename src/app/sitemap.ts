import type { MetadataRoute } from "next";
import { TOXICANTS, ORGANS } from "@/lib/toxlibrary";
import { BOOK_CHAPTERS } from "@/content/book";

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
type Freq = MetadataRoute.Sitemap[number]["changeFrequency"];

const PUBLIC_ROUTES: { path: string; priority: number; changeFrequency: Freq }[] = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },

  // The education layer, opened to the public 2026-08-16. These are the
  // pages worth finding: hub pages first, then the deep content below.
  { path: "/learn", priority: 0.9, changeFrequency: "monthly" },
  { path: "/presumptives", priority: 0.9, changeFrequency: "monthly" },
  { path: "/cp-exam", priority: 0.8, changeFrequency: "monthly" },
  { path: "/solutions", priority: 0.8, changeFrequency: "monthly" },
  { path: "/book", priority: 0.8, changeFrequency: "monthly" },
  { path: "/vso", priority: 0.8, changeFrequency: "weekly" },
  { path: "/learn/timeline", priority: 0.7, changeFrequency: "monthly" },
  { path: "/learn/women-veterans", priority: 0.7, changeFrequency: "monthly" },

  { path: "/trust", priority: 0.8, changeFrequency: "monthly" },
  { path: "/clinician", priority: 0.7, changeFrequency: "monthly" },
  { path: "/support", priority: 0.6, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.4, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  // Generated from the same data the pages render from, so a new toxicant,
  // organ or chapter appears in the sitemap the moment it ships — there is no
  // second list to forget to update.
  const generated: { path: string; priority: number; changeFrequency: Freq }[] = [
    ...TOXICANTS.map((t) => ({ path: `/learn/${t.slug}`, priority: 0.7, changeFrequency: "monthly" as Freq })),
    ...ORGANS.map((o) => ({ path: `/learn/organ/${o.slug}`, priority: 0.6, changeFrequency: "monthly" as Freq })),
    ...BOOK_CHAPTERS.map((c) => ({ path: `/book/${c.slug}`, priority: 0.6, changeFrequency: "yearly" as Freq })),
  ];

  return [...PUBLIC_ROUTES, ...generated].map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
