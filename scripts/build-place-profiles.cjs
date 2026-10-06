#!/usr/bin/env node
/**
 * build-place-profiles — generate the seed for `place_profiles` (migration 0033).
 *
 * WHY THIS IS A SCRIPT AND NOT A RUNTIME WRITE. The app holds no service-role
 * key on purpose, so every query — including from route handlers — runs with the
 * publishable key that ships in the browser bundle. A policy letting the server
 * write to a SHARED table of text every veteran reads would let any signed-in
 * user write it too. So profiles are generated here, read by a human, and
 * applied as a migration. See the header of 0033 for the full reasoning.
 *
 * Usage:
 *   node scripts/build-place-profiles.cjs --limit 5     # trial run, 5 places
 *   node scripts/build-place-profiles.cjs               # the whole gazetteer
 *   node scripts/build-place-profiles.cjs --resume      # skip places already done
 *
 * Writes two files into supabase/migrations/ and docs/:
 *   <next>_seed_place_profiles.sql  — the migration to apply
 *   docs/place-profiles-review.md   — the same text, readable, for spot-checking
 *
 * Costs real money (one model call per place). Run it deliberately.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT_SQL_DIR = path.join(ROOT, "supabase", "migrations");
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

  // Next free migration number.
  const nums = fs.readdirSync(OUT_SQL_DIR).map((f) => Number(f.slice(0, 4))).filter(Number.isFinite);
  const next = String(Math.max(...nums) + 1).padStart(4, "0");
  const sqlPath = path.join(OUT_SQL_DIR, `${next}_seed_place_profiles.sql`);

  const sql = [
    `-- ${next} — seed for place_profiles (see 0033 for why this is a seed and not a runtime write).`,
    "--",
    `-- ${rows.length} profiles, generated by scripts/build-place-profiles.cjs with ${MODEL},`,
    "-- using the SAME system prompt /api/base-info uses, so a cached profile and a",
    "-- live one cannot read like different products.",
    "--",
    "-- APPLYING THIS MIGRATION IS THE ACT OF REVIEW. Read",
    "-- docs/place-profiles-review.md first — that is the same text, laid out to be",
    "-- read rather than parsed. These rows land reviewed = true and are served",
    "-- immediately; a profile found to be wrong later is pulled from circulation",
    "-- with `update place_profiles set reviewed = false where name_key = '...'`,",
    "-- which falls that place back to the live model call rather than deleting",
    "-- anything.",
    "",
    "insert into place_profiles (name_key, display_name, profile, model, reviewed, reviewed_at) values",
    rows
      .map(([k, v]) => `  (${q(k)}, ${q(v.display)}, ${q(v.profile)}, ${q(MODEL)}, true, now())`)
      .join(",\n"),
    "on conflict (name_key) do update set",
    "  display_name = excluded.display_name,",
    "  profile      = excluded.profile,",
    "  model        = excluded.model,",
    "  reviewed     = excluded.reviewed,",
    "  reviewed_at  = excluded.reviewed_at;",
    "",
  ].join("\n");
  fs.writeFileSync(sqlPath, sql, "utf8");

  const md = [
    "# Place profiles — for review",
    "",
    `${rows.length} profiles, ${MODEL}, generated ${new Date().toISOString().slice(0, 10)}.`,
    "",
    "Read for invented specifics: unit names, dates, operations, casualty figures.",
    "The prompt forbids them, which is exactly why they are worth looking for. Any",
    "profile that states a fact you cannot place, cut from the seed before applying",
    "it — a vague paragraph is fine, a confident wrong one is not.",
    "",
    ...rows.flatMap(([, v]) => [`## ${v.display}`, "", v.profile, ""]),
  ].join("\n");
  fs.mkdirSync(path.dirname(OUT_MD), { recursive: true });
  fs.writeFileSync(OUT_MD, md, "utf8");

  console.log(`\nwrote ${path.relative(ROOT, sqlPath)}  (${rows.length} rows)`);
  console.log(`wrote ${path.relative(ROOT, OUT_MD)}`);
  if (failed) console.log(`${failed} failed — re-run with --resume to retry just those`);
})();
