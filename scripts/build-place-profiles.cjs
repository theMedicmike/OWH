#!/usr/bin/env node
/**
 * build-place-profiles — generate the seed for `place_profiles` (migration 0033).
 *
 * WHY THIS IS A SCRIPT AND NOT A RUNTIME WRITE. These are shared text that every
 * veteran reads, attributed to the app — not one person's record. Generating
 * them at request time means a fabricated detail appears for one man and not the
 * next, so nobody can catch it and there is nothing to correct. Generated here,
 * reviewed by a human, committed as data. See src/lib/placeProfiles.ts.
 *
 * Usage:
 *   node scripts/build-place-profiles.cjs --limit 5     # trial run, 5 places
 *   node scripts/build-place-profiles.cjs               # the whole gazetteer
 *   node scripts/build-place-profiles.cjs --resume      # skip places already done
 *
 * Writes two files:
 *   src/data/place-profiles.json    — what the app reads
 *   docs/place-profiles-review.md   — the same text, readable, for spot-checking
 *
 * Costs real money (one model call per place). Run it deliberately.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DATA = path.join(ROOT, "src", "data", "place-profiles.json");
const OUT_MD = path.join(ROOT, "docs", "place-profiles-review.md");
const STATE = path.join(ROOT, "scripts", ".place-profiles-cache.json");
const MODEL = "claude-sonnet-4-6";

// Must stay byte-identical to the SYSTEM_PROMPT in src/app/api/base-info/route.ts.
// If they drift, a cached profile and a live one read like different products.
const SYSTEM_PROMPT = fs
  .readFileSync(path.join(ROOT, "src/app/api/base-info/route.ts"), "utf8")
  .match(/const SYSTEM_PROMPT = `([\s\S]*?)`;/)[1];

function apiKey() {
  const env = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
  const m = env.match(/^ANTHROPIC_API_KEY=(.*)$/m);
  if (!m) throw new Error("ANTHROPIC_API_KEY not found in .env.local");
  return m[1].trim().replace(/^["']|["']$/g, "");
}

/** The same normalisation src/lib/placeProfiles.ts uses. Keep them in step. */
const placeKey = (n) => n.trim().toLowerCase().replace(/\s+/g, " ");

/** ONE profile per gazetteer entry, keyed on the bare installation name.
 *
 *  It used to emit the "Name, Region" spelling as well, because that is how
 *  IntakeFormView stores place_name. That doubled the bill and produced two
 *  different texts for one place, so what a veteran read depended on which
 *  spelling his check-in carried. The region spelling is now resolved at read
 *  time by placeKeyCandidates() in src/lib/placeProfiles.ts — keep the two in
 *  step if either changes. */
function targets() {
  const src = fs.readFileSync(path.join(ROOT, "src/lib/gazetteer.ts"), "utf8");
  const out = new Map();
  for (const m of src.matchAll(/\{\s*name:\s*"([^"]+)",\s*region:\s*"([^"]+)"/g)) {
    out.set(placeKey(m[1]), m[1]);
  }
  return [...out.entries()].map(([key, display]) => ({ key, display }));
}

async function profileFor(key, display) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Place: ${display}` }],
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  return j.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
}

const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";

(async () => {
  const args = process.argv.slice(2);
  const limit = args.includes("--limit") ? Number(args[args.indexOf("--limit") + 1]) : Infinity;
  const resume = args.includes("--resume");

  const done = resume && fs.existsSync(STATE)
    ? JSON.parse(fs.readFileSync(STATE, "utf8"))
    : {};

  const all = targets();
  const todo = all.filter((t) => !done[t.key]).slice(0, limit);
  console.log(`${all.length} place names; ${Object.keys(done).length} already generated; doing ${todo.length}`);

  const key = apiKey();
  let failed = 0;
  let n = 0;

  // A small worker pool. Serially this is a ~40 minute run for the full
  // gazetteer, which is long enough that nobody does it; four at a time brings
  // it under ten. Deliberately modest -- this is one nonprofit's API key, and
  // burying it in a burst to save five minutes is a poor trade.
  const CONCURRENCY = Number(args.includes("--concurrency")
    ? args[args.indexOf("--concurrency") + 1] : 4);

  const queue = [...todo];
  async function worker() {
    for (;;) {
      const t = queue.shift();
      if (!t) return;
      const i = ++n;
      try {
        done[t.key] = { display: t.display, profile: await profileFor(key, t.display) };
        console.log(`  ${i}/${todo.length}  ${t.display}`);
      } catch (e) {
        failed++;
        console.log(`  ${i}/${todo.length}  FAILED ${t.display}: ${e.message}`);
      }
      // Written after every completion, so an interrupted run loses at most the
      // handful currently in flight -- and --resume picks up exactly there.
      fs.writeFileSync(STATE, JSON.stringify(done, null, 1));
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));

  const rows = Object.entries(done).filter(([, v]) => v.profile);
  if (!rows.length) return console.log("nothing to write");

  // Written as a DATA FILE, not a seed migration. The prose then moves
  // file-to-file and is never retyped by anything — see the header of
  // src/lib/placeProfiles.ts for why that matters for 361 historical profiles.
  const data = {
    generated: new Date().toISOString().slice(0, 10),
    model: MODEL,
    places: Object.fromEntries(rows.map(([k, v]) => [k, { n: v.display, p: v.profile }])),
  };
  fs.mkdirSync(path.dirname(DATA), { recursive: true });
  fs.writeFileSync(DATA, JSON.stringify(data), "utf8");

  const md = [
    "# Place profiles — for review",
    "",
    `${rows.length} profiles, ${MODEL}, generated ${data.generated}.`,
    "",
    "Read for invented specifics: unit names, dates, operations, casualty figures.",
    "The prompt forbids them, which is exactly why they are worth looking for. A",
    "profile that stays general is fine; a confidently wrong one is not. Run",
    "scripts/qa-place-profiles.cjs to sort these by how much they assert.",
    "",
    "To pull one: delete its entry from src/data/place-profiles.json. That place",
    "then falls through to the live model call exactly as it does today.",
    "",
    ...rows.flatMap(([, v]) => [`## ${v.display}`, "", v.profile, ""]),
  ].join("\n");
  fs.mkdirSync(path.dirname(OUT_MD), { recursive: true });
  fs.writeFileSync(OUT_MD, md, "utf8");

  console.log(`\nwrote ${path.relative(ROOT, DATA)}  (${rows.length} profiles)`);
  console.log(`wrote ${path.relative(ROOT, OUT_MD)}`);
  if (failed) console.log(`${failed} failed — re-run with --resume to retry just those`);
})();
