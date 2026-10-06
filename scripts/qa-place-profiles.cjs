#!/usr/bin/env node
/**
 * qa-place-profiles — make 361 generated profiles reviewable by a human.
 *
 * 449 KB of prose is not something anyone reads cold, so nobody does, and the
 * seed gets applied unread. This sorts the profiles by how much checkable
 * assertion they contain, so the review starts where a mistake would actually
 * cost something.
 *
 * It flags the things the base-info prompt FORBIDS inventing — specific years,
 * unit designations, named operations, headcounts, superlatives. A flag is not
 * an error: "established in 1941" may be perfectly true. It means a human has to
 * agree with it, because that is the sentence a veteran will repeat.
 *
 * Usage: node scripts/qa-place-profiles.cjs
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MD = path.join(ROOT, "docs", "place-profiles-review.md");
const OUT = path.join(ROOT, "docs", "place-profiles-qa.md");

const RULES = [
  ["year",        /\b(1[6-9]\d{2}|20[0-2]\d)\b/g],
  ["unit",        /\b(\d+(?:st|nd|rd|th)\s+(?:Infantry|Armored|Airborne|Marine|Cavalry|Aviation|Air|Fighter|Bomb|Division|Brigade|Regiment|Battalion|Wing|Squadron|Group|Corps|Army|Fleet)[a-z ]*)\b|\b(?:VMFA|VFA|VAW|HMLA|HSC|VP)-\d+\b/gi],
  ["operation",   /\bOperation\s+[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?/g],
  ["headcount",   /\b\d{1,3},\d{3}\b|\b(?:tens of thousands|hundreds of thousands|\d+,\d+ (?:personnel|troops|service members))\b/g],
  ["superlative", /\b(?:the largest|the biggest|the first|the only|the oldest|the busiest|the most)\b/gi],
  ["precise-geo", /\b\d+\s*(?:miles|kilometers|km|acres|square miles)\b/gi],
];

const text = fs.readFileSync(MD, "utf8");
// Sections look like:  "## Name\n\n<body>\n"
const sections = [];
const re = /^## (.+)$/gm;
let m, prev = null;
while ((m = re.exec(text))) {
  if (prev) sections.push({ name: prev.name, body: text.slice(prev.at, m.index).trim() });
  prev = { name: m[1], at: re.lastIndex };
}
if (prev) sections.push({ name: prev.name, body: text.slice(prev.at).trim() });

const scored = sections.map((s) => {
  const hits = {};
  let total = 0;
  for (const [label, rx] of RULES) {
    const found = [...new Set((s.body.match(rx) || []).map((x) => x.trim()))];
    if (found.length) { hits[label] = found; total += found.length; }
  }
  return { ...s, hits, total };
}).sort((a, b) => b.total - a.total);

const withFlags = scored.filter((s) => s.total > 0);
const clean = scored.filter((s) => s.total === 0);

const out = [
  "# Place profiles — what to check, in priority order",
  "",
  `${sections.length} profiles. ${withFlags.length} contain at least one checkable assertion; ${clean.length} stay general enough to need no verification.`,
  "",
  "A flag is NOT an error. It means the profile states something specific that a",
  "veteran will believe and repeat, so a human has to agree with it before this",
  "is seeded. Work down from the top; the tail is mostly safe prose.",
  "",
  "If one is wrong, the cheapest fix is to delete that row's line from",
  "`supabase/migrations/0035_seed_place_profiles.sql` before applying it — the",
  "place then falls through to the live model call exactly as it does today.",
  "",
  "---",
  "",
  ...withFlags.flatMap((s) => [
    `## ${s.name}  — ${s.total} to check`,
    "",
    ...Object.entries(s.hits).map(([k, v]) => `- **${k}**: ${v.slice(0, 8).join(" · ")}`),
    "",
    "> " + s.body.replace(/\n+/g, "\n> "),
    "",
  ]),
  "---",
  "",
  `## No specific claims to verify (${clean.length})`,
  "",
  clean.map((s) => s.name).join(" · "),
  "",
];
fs.writeFileSync(OUT, out.join("\n"), "utf8");

console.log(`${sections.length} profiles`);
console.log(`  ${withFlags.length} with checkable assertions`);
console.log(`  ${clean.length} general enough to need no check`);
console.log("");
console.log("  top 12 by how much they assert:");
for (const s of withFlags.slice(0, 12)) {
  console.log(`    ${String(s.total).padStart(3)}  ${s.name}  [${Object.keys(s.hits).join(", ")}]`);
}
console.log(`\nwrote ${path.relative(ROOT, OUT)}`);
