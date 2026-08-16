import type { MetadataRoute } from "next";
import { SITE_URL } from "./sitemap";

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
//   2. EDUCATION that happens to be gated today — the exposure library, the
//      book, whole health, the C&P exam page. Those are not listed, on
//      purpose. They are invisible to search only because of the auth wall,
//      not because we want them hidden, and this is the single biggest SEO
//      question open for this site. If any of them is opened up later, robots
//      should not be silently blocking it.
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
          // Tokenised witness links — never crawl someone else's statement.
          "/statement/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
