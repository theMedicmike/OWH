import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// ROBOTS — keep crawlers out of anything personal, and out of anything that
// would only ever serve them a login screen.
//
// The disallow list is deliberately narrow rather than "everything gated."
// Two different kinds of route are behind the auth wall right now:
//
//   1. A veteran's OWN record — the dashboard, the packet, their conditions,
//      their locations, an uploaded document, a witness link. These must
//      never be crawled, and they are listed below. /statement/ matters most:
//      those are tokenised no-login URLs sent to a witness, and a crawler
//      following one would be reading a third party's account of a veteran's
//      service.
//
//   2. EDUCATION, which is now PUBLIC — the exposure library, the book, whole
//      health, the C&P exam page, what VA presumes, the VSO finder. Opened
//      2026-08-16. They are deliberately absent from the list below: they are
//      the reason this site should be crawled at all, and 127 of them are in
//      the sitemap. Nothing here may ever block them.
//
// Updated 2026-09-07: the personal routes added since this list was written
// (shots, injuries, medications, buddies, the map, Medic Mike) were missing, so
// a crawler was being pointed at six more login screens.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/account",
          "/dashboard",
          "/report",
          "/journey",
          "/health",
          "/locations",
          "/exposures",
          "/conditions",
          "/estimator",
          "/intake",
          "/welcome",
          "/reset",
          "/map",
          "/mike",
          "/shots",
          "/injuries",
          "/medications",
          "/buddies",
          // Tokenised witness links — never crawl someone else's statement.
          "/statement/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
