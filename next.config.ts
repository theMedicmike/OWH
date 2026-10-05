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
const SECURITY_HEADERS = [
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
