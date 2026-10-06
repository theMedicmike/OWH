#!/usr/bin/env node
/**
 * qa-place-profiles — make 361 generated profiles reviewable by a human.
 *
 * 450 KB of prose is not something anyone reads cold, so nobody does, and the
 * set gets shipped unread. This sorts the profiles by how much checkable
 * assertion they contain, so the review starts where a mistake would actually
 * cost something.
 *
 * It flags what the base-info prompt FORBIDS inventing — specific years, unit
 * designations, named operations, headcounts, superlatives, precise distances.
 * A flag is not an error. "Established in 1941" may be perfectly true. It means
 * a human has to agree with it, because that is the sentence a veteran repeats.
 *
 * BOTH documents are derived from src/data/place-profiles.json. Nothing here
 * reads the markdown it writes — a profile corrected in the data would otherwise
 * leave a stale paragraph sitting in a review document, which is exactly how a
 * fixed error gets "found" a second time and re-fixed wrongly.
 *
 * Usage: node scripts/qa-place-profiles.cjs
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DATA = path.join(ROOT, "src", "data", "place-profiles.json");
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

const data = JSON.parse(fs.readFileSync(DATA, "utf8"));
const sections = Object.values(data.places).map((v) => ({ name: v.n, body: v.p }));

fs.mkdirSync(path.dirname(MD), { recursive: true });

// 1. the plain read-through, regenerated so it always matches the data
fs.writeFileSync(MD, [
  "# Place profiles — for review",
  "",
  `${sections.length} profiles, ${data.model}, generated ${data.generated}.`,
  "",
  "Read for invented specifics: unit names, dates, operations, casualty figures.",
  "The prompt forbids them, which is exactly why they are worth looking for.",
  "Run scripts/qa-place-profiles.cjs to sort these by how much they assert.",
  "",
  "To pull one: delete its entry from src/data/place-profiles.json. That place",
  "then falls through to the live model call exactly as it does today.",
  "",
  ...sections.flatMap((s) => [`## ${s.name}`, "", s.body, ""]),
].join("\n"), "utf8");

// 2. the same profiles, ordered by how much they assert
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

fs.writeFileSync(OUT, [
  "# Place profiles — what to check, in priority order",
  "",
  `${sections.length} profiles. ${withFlags.length} contain at least one checkable assertion; ${clean.length} stay general enough to need no verification.`,
  "",
  "A flag is NOT an error. It means the profile states something specific that a",
  "veteran will believe and repeat, so a human has to agree with it. Work down",
  "from the top; the tail is mostly safe prose.",
  "",
  "If one is wrong, delete that place's entry from src/data/place-profiles.json",
  "and deploy — it then falls through to the live model call as it does today.",
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
].join("\n"), "utf8");

console.log(`${sections.length} profiles (${data.model}, ${data.generated})`);
console.log(`  ${withFlags.length} with checkable assertions`);
console.log(`  ${clean.length} general enough to need no check`);
console.log("");
console.log("  top 10 by how much they assert:");
for (const s of withFlags.slice(0, 10)) {
  console.log(`    ${String(s.total).padStart(3)}  ${s.name}  [${Object.keys(s.hits).join(", ")}]`);
}
console.log(`\nwrote ${path.relative(ROOT, MD)}`);
console.log(`wrote ${path.relative(ROOT, OUT)}`);
