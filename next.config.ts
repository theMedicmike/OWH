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

const nextConfig: NextConfig = {
  async redirects() {
    return bookRedirects();
  },
};

export default nextConfig;
