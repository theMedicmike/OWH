#!/usr/bin/env node
/**
 * verify-gating — confirm every crisis/dignity gate in heavyChapters.ts still
 * resolves to a real chapter in book.ts.
 *
 * Run after EVERY `node scripts/genbook.cjs`, and before every deploy.
 *
 * Why this exists: heavyChapters.ts decides which chapters show the Veterans
 * Crisis Line (988), which suppress celebratory/promo UI, and which may never
 * be minted into shareable cards. A key that stops matching does not throw and
 * does not fail `npm run build` — the gate just silently stops firing. That has
 * already happened once on this project: a renumber left four chapters,
 * including the private testimony chapter, unprotected in production.
 *
 * Exits non-zero if any key is orphaned.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const bookSrc = fs.readFileSync(path.join(root, "src/content/book.ts"), "utf8");
const gateSrc = fs.readFileSync(path.join(root, "src/content/heavyChapters.ts"), "utf8");

const marker = "BOOK_CHAPTERS: BookChapter[] =";
const chapters = JSON.parse(
  bookSrc.slice(bookSrc.indexOf("[", bookSrc.indexOf(marker) + marker.length), bookSrc.lastIndexOf("]") + 1)
);

const base = (slug) => slug.replace(/^\d+-/, "");
const byKey = new Map(chapters.map((c) => [base(c.slug), c]));

// Strip comments so prose in them is never read as a key. This must cover
// TRAILING comments too, not just whole-line ones: on 2026-09-23 a trailing
// // exclusion; "not being here at all"
// beside a real key was picked up as a fourteenth key and reported as a broken
// gate. A verifier that cries wolf gets ignored, which is how a real broken gate
// ships. The (?<!:) guard keeps a "https://..." inside a string intact.
const code = gateSrc.replace(/^\s*\/\/.*$/gm, "").replace(/(?<!:)\/\/.*$/gm, "");

function setKeys(name) {
  const re = new RegExp(name + "\\s*=\\s*new Set<string>\\(\\[([\\s\\S]*?)\\]\\)");
  const m = code.match(re);
  if (!m) return null;
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
}

let broken = 0;
let checked = 0;

for (const name of ["HEAVY_CHAPTERS", "MEMORIAM_ONLY", "NO_SHARE"]) {
  const keys = setKeys(name);
  if (keys === null) {
    console.log(`*** ${name}: SET NOT FOUND (was it renamed?)`);
    broken++;
    continue;
  }
  console.log(`\n${name} (${keys.length}):`);
  for (const key of keys) {
    checked++;
    const c = byKey.get(key);
    if (!c) {
      console.log(`   *** ORPHANED KEY: "${key}" matches no chapter`);
      broken++;
    } else {
      console.log(`   ok   ch${String(c.number).padStart(2)}  ${c.title}`);
    }
  }
}

console.log(
  broken === 0
    ? `\n*** GATING INTACT: all ${checked} keys resolve against ${chapters.length} chapters ***`
    : `\n*** ${broken} BROKEN GATE(S) — DO NOT DEPLOY ***`
);
process.exit(broken ? 1 : 0);
