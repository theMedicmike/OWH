import type { NextConfig } from "next";
import { readFileSync } from "fs";
import { join } from "path";

// Book chapters were renumbered when "The Smoke and the Fire" was inserted at
// position 9, so every old /book/<slug> URL for chapters 9+ changed. These
// redirects keep old links alive. Generated into book-redirects.json alongside
// the static book site's stubs. Defensive: a missing/invalid file never breaks
// the build — it just yields no redirects.
function bookRedirects(): { source: string; destination: string; permanent: boolean }[] {
  try {
    const raw = readFileSync(join(process.cwd(), "book-redirects.json"), "utf8");
    const pairs = JSON.parse(raw) as { source: string; destination: string }[];
    return pairs.map((r) => ({ ...r, permanent: false }));
  } catch {
    return [];
  }
}

// SECURITY HEADERS. Production was sending exactly one -- the Strict-Transport-
// Security Vercel adds by itself -- because this file had no headers() at all
// (pre-launch audit, 2026-10-05). The expensive one to be missing was
// X-Frame-Options: until now any site on the internet could put
// tracethecascade.com in an iframe and overlay it, on screens where a veteran
// types his medical history.
//
// Deliberately NOT a Content-Security-Policy yet. A real CSP here has to clear
// MapLibre's web workers and blob: URLs, Vercel Analytics and Speed Insights,
// and Google Fonts -- and a CSP that half-works silently breaks the map
// instead of failing loudly. These five cost nothing and break nothing; the
// CSP is its own job, done with the preview open beside it.
// ---------------------------------------------------------------- THE CSP
//
// Every host below was enumerated from the running app, not guessed, because a
// CSP that is merely plausible breaks things quietly. What the browser actually
// talks to at runtime:
//
//   Supabase      REST, auth and storage. Also the SIGNED URLs that the DD-214
//                 preview and the document list open.
//   openfreemap   the map's style, tiles, sprites AND glyph fonts -- all four
//                 are on tiles.openfreemap.org, confirmed by reading the
//                 liberty style JSON rather than assuming.
//   Vercel        Analytics and Speed Insights. They normally load same-origin
//                 from /_vercel/..., but va.vercel-scripts.com is compiled into
//                 the bundle as the fallback, so it has to be allowed or
//                 analytics dies silently on the fallback path.
//
// Everything else in the codebase that looks like an external host -- va.gov,
// dailymed, the FDA, the crisis line -- is a LINK, and CSP does not govern
// navigation. openFDA is fetched by a server component, so it never touches a
// browser's CSP either.
//
// WHY object-src IS NOT 'none'. Every guide says to set it to 'none'. Doing so
// here would break the DD-214 preview: DD214Assist renders the veteran's own
// uploaded discharge paper with <object data={signedUrl} type="application/pdf">.
// A man uploads his DD-214 and gets an empty grey box. frame-src carries the
// same allowance because browsers disagree about which directive governs a PDF
// in an <object>.
//
// WHY script-src KEEPS 'unsafe-inline'. Next's App Router injects inline
// hydration scripts on every page. The alternative is a per-request nonce from
// middleware, which forces all 122 prerendered pages to render dynamically and
// gives up the edge caching the public education layer runs on. That is a real
// cost for a small gain in an app with no HTML-injection surface: one
// dangerouslySetInnerHTML, fed by a typed object literal, and no eval, no
// Function, no innerHTML anywhere.
//
// So the value of this policy is NOT XSS. It is connect-src: if a dependency in
// this tree were ever compromised, it could not post a veteran's service
// history to an attacker's server, because the browser would refuse to open the
// connection. For an app holding this data that is the control worth having.
const SUPABASE_ORIGIN = (() => {
  // Read from the env rather than hardcoded, so the policy cannot rot if the
  // project ever moves. Build-time only -- this never reaches the browser.
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return "";
  }
})();
const SUPABASE_WS = SUPABASE_ORIGIN.replace(/^https:/, "wss:");
const MAP = "https://tiles.openfreemap.org";
const VERCEL = "https://va.vercel-scripts.com";

const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  `script-src 'self' 'unsafe-inline' ${VERCEL}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${MAP} ${SUPABASE_ORIGIN}`,
  "font-src 'self' data:",
  `connect-src 'self' ${SUPABASE_ORIGIN} ${SUPABASE_WS} ${MAP} ${VERCEL}`,
  // MapLibre does its tile work in a web worker created from a blob.
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  `object-src 'self' ${SUPABASE_ORIGIN}`,
  `frame-src 'self' ${SUPABASE_ORIGIN}`,
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

// ENFORCING since 2026-10-05.
//
// It shipped Report-Only first, deliberately. The public pages were walked in a
// real browser -- /, /vso with a live ZIP search, /learn, /presumptives,
// /cp-exam -- and reported zero violations. The three screens that load
// everything external sit behind the auth wall and could not be checked that
// way: /map (MapLibre's workers, tiles, sprites and glyphs), /account (the
// DD-214 preview's <object>), and /mike. Michael walked all three signed in and
// confirmed a clean console on 2026-10-05, so this went to enforcing.
//
// IF YOU ADD AN EXTERNAL RESOURCE, IT WILL BE BLOCKED until you add its host
// above -- silently, from the browser's point of view, with only a console
// error. Check the console on the page you changed. The most likely future
// casualties are a new map style host, an embedded video, or a font loaded at
// runtime instead of through next/font.
//
// To debug a suspected CSP break, set this back to false, reproduce, read the
// violations, add the host, and set it true again.
const CSP_ENFORCE = true;

const SECURITY_HEADERS = [
  {
    key: CSP_ENFORCE ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only",
    value: CSP,
  },
  // Nothing in this app is ever framed by anything, including by itself.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send the origin off-site but never the path: a veteran following a link out
  // of /learn/<toxicant> should not hand the destination his reading history.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // geolocation stays self-allowed -- the map offers to find him. The rest are
  // things this app has no business asking a browser for.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=(), usb=()" },
  // Vercel's own HSTS carries no includeSubDomains. Two years, all subdomains.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

// THE STRAY PUBLIC COPY.
//
// Vercel auto-assigns <project>.vercel.app as a production domain, so
// owh-three.vercel.app served this entire app to the public -- 200, no SSO, no
// noindex (pre-launch audit, 2026-10-05). The other two vercel.app hosts are
// deployment URLs and Vercel's SSO covers those; this one is a project domain
// and slips through "all_except_custom_domains".
//
// Two reasons it had to stop. Google can index a second copy of every page. And
// AuthCard builds the password-reset link from window.location.origin, so a
// veteran who signed up on that host got a reset email pointing at an address
// that is not this site.
//
// An auto-assigned .vercel.app domain cannot be deleted, so it is redirected
// here rather than removed. Narrow on purpose: it names that one host, so
// localhost and preview deployments keep working normally. If another stray
// alias ever appears, add it to this list -- do not widen it to a pattern,
// because a pattern would catch the previews this project tests on.
const STRAY_HOSTS = ["owh-three.vercel.app"];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      ...STRAY_HOSTS.map((host) => ({
        source: "/:path*",
        has: [{ type: "host" as const, value: host }],
        destination: "https://www.tracethecascade.com/:path*",
        permanent: true,
      })),
      ...bookRedirects(),
    ];
  },
  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
