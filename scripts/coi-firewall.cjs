#!/usr/bin/env node
/**
 * coi-firewall — fail the build if the supplement/detox corridor comes back.
 *
 * WHY THIS EXISTS
 * On 2026-08-06 an audit found a complete, unintentional funnel shipping in this
 * app. A veteran who logged heavy-metal exposure was routed to a condition called
 * "Vitamin or mineral deficiency" filed under "Hormones & metabolism" — the same
 * browsable group as "Low testosterone" — and, two taps away, to a Solutions
 * pillar titled "Support natural detox — safely" that was explicitly targeted at
 * his exposure classes and surfaced under a heading reading "Tailored to your
 * record", beside copy promising to "replenish what was lost".
 *
 * Nobody wrote "heavy metals lower your testosterone" and nobody sold anything.
 * The click path was the problem. The founder of this nonprofit separately sells
 * nutritional supplements; the nonprofit sells nothing and he takes nothing from
 * it, which is exactly why the app must never assemble that path by accident.
 *
 * Two of these rules also protect a scientific guardrail, not just a reputational
 * one: the largest human datasets find NO reduction in testosterone from heavy
 * metals (several find the opposite), so any metals→endocrine adjacency is wrong
 * on the evidence before it is wrong on optics. That mistake has re-entered this
 * project four separate times, and every time it hid inside a list rather than in
 * a sentence — which is why this check greps structure, not prose.
 *
 * Run by `prebuild`, so `next build` and any Vercel deploy fail loudly.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const failures = [];
const fail = (rule, detail) => failures.push({ rule, detail });

const walkAll = (dir) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) return walkAll(p);
        return /\.(ts|tsx)$/.test(e.name) ? [p] : [];
      })
    : [];
const rel = (p) => path.relative(root, p).replace(/\\/g, "/");

// Every file the shots/vaccines feature owns — the isolation rules below all
// pivot on this list. Council ruling 2026-08-07: shots content and exposure/
// toxicant content must never link to each other, in either direction.
const SHOTS_FILES = [
  ...walkAll(path.join(root, "src/app/shots")),
  ...walkAll(path.join(root, "src")).filter((p) => /[\\/]lib[\\/]shots/.test(p)),
].map(rel);
const LEARN_FILES = [
  ...walkAll(path.join(root, "src/app/learn")),
  path.join(root, "src/lib/toxlibrary.ts"),
].map(rel);

// ── 1. Solution pillars may never be targeted at a veteran's own record ──────
{
  const src = read("src/lib/education.ts");
  const start = src.indexOf("export const SOLUTION_PILLARS");
  if (start < 0) fail("pillars", "SOLUTION_PILLARS not found — did it move?");
  else {
    const block = src.slice(start);
    if (/^\s{4}(exposures|conditions)\s*:/m.test(block)) {
      fail(
        "pillars",
        "A SOLUTION_PILLAR carries an `exposures:` or `conditions:` field. Targeting wellness " +
          "content at a veteran's own logged record is what turns education into a funnel. " +
          "Pillars are shown to everyone, in the same order, or not at all."
      );
    }
  }
  if (/exposures\s*:\s*string\[\]/.test(src.slice(src.indexOf("export type SolutionPillar"), start))) {
    fail("pillars", "SolutionPillar regained an `exposures` field. Keep the targeting unrepresentable.");
  }
}

// ── 2. No metal-linked condition may sit in an endocrine/reproductive group ──
{
  const src = read("src/lib/conditions.ts");
  // NOTE: this rule targets HEAVY METALS specifically, not every exposure class.
  // Radiation → thyroid nodules and solvents/pesticides → infertility are both
  // well-established and belong exactly where they are. The guardrail being
  // enforced here is narrow and evidence-based: the largest human datasets find
  // no testosterone reduction from heavy metals (several find the opposite), so a
  // metal sitting in an endocrine group is wrong on the science, not just on optics.
  const banned = ["Hormones & metabolism", "Reproductive & sexual health"];
  const re = /\{\s*label:\s*"([^"]+)"[^}]*?system:\s*"([^"]+)"[^}]*?exposures:\s*\[([^\]]*)\]/g;
  let m;
  while ((m = re.exec(src))) {
    const [, label, system, exposures] = m;
    if (banned.includes(system) && /heavy_metal/.test(exposures)) {
      fail(
        "endocrine-adjacency",
        `"${label}" is exposure-linked to a metal AND filed under "${system}". That renders ` +
          `"metals → hormone problem" as a browsable path without anyone writing the sentence. ` +
          `File it under the organ system that carries the actual mechanism.`
      );
    }
  }
}

// ── 3. No nutrient/supplement/detox vocabulary in veteran-facing content ─────
{
  // SCOPE IS DELIBERATE — these are the HEALTH-CONTENT surfaces, the places the
  // app tells a veteran something about his own body. That is where a nutrient or
  // "detox" word does damage, because it sits next to his personal data in an app
  // whose founder separately sells supplements.
  //
  // /app/about and /app/help are NOT in this list, and that is a decision, not an
  // oversight (founder's call, 2026-08-06). Those pages carry Operation Whole
  // Health's MISSION language — "root-cause healing", "restoring the veteran" —
  // which is a statement of what the organisation is for, not advice about what to
  // put in your body. An audit will want to widen this list; widening it would gag
  // the nonprofit's own mission statement without protecting a single veteran.
  // Health advice is gated. A mission is not health advice.
  const files = [
    "src/lib/education.ts",
    "src/lib/toxlibrary.ts",
    "src/lib/medicMike.ts",
    "src/components/SolutionsView.tsx",
    "src/components/EstimatorView.tsx",
    "src/app/learn/[slug]/page.tsx",
    ...SHOTS_FILES,
  ];
  // Matches the word in ordinary prose. Comments are stripped first so the
  // tombstones explaining WHY these are banned don't trip the check.
  const banned = [
    "replenish", "regenerate", "chelate", "cleanse",
    "supplement", "nutrient", "detox",
  ];
  for (const f of files) {
    const stripped = read(f)
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "")
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
    for (const w of banned) {
      const re = new RegExp(`\\b${w}`, "i");
      const lines = stripped.split("\n");
      lines.forEach((line, i) => {
        if (!re.test(line)) return;
        // The ONE permitted home for these words is a passage telling a veteran to
        // AVOID the thing, or an instruction to Medic Mike never to raise it. JSX
        // wraps prose across lines, so judge a window rather than a single line.
        const context = lines.slice(Math.max(0, i - 3), i + 4).join(" ");
        const isProhibition =
          /not validated|avoid|never|killed people|do not|don't|no medical advice|can interact|ask before|caution|run from|be cautious|unsupervised/i.test(
            context
          );
        if (isProhibition) return;
        fail("vocabulary", `"${w}" appears in ${f}: ${line.trim().slice(0, 110)}`);
      });
    }
  }
}

// ── 4. No commercial or founder-owned outbound links ────────────────────────
{
  const allowed = [
    // Government, crisis and scientific sources
    "va.gov", "publichealth.va.gov", "mobile.va.gov", "atsdr.cdc.gov", "cdc.gov",
    "nih.gov", "ncbi.nlm.nih.gov", "kdigo.org", "acmt.org", "988lifeline.org",
    "veteranscrisisline.net", "archives.gov", "dol.gov", "ecfr.gov", "govinfo.gov",
    "federalregister.gov", "milconnect.dmdc.osd.mil", "dmdc.osd.mil", "health.mil",
    "dvidshub.net",
    // Infrastructure the app itself runs on
    "openfreemap.org", "openstreetmap.org", "supabase.co", "vercel.app",
    // Share intents for the challenge coin. Outbound social sharing only — these
    // carry no health content and sell nothing.
    "twitter.com", "x.com", "facebook.com",
    // Added for the shots/vaccines feature (council ruling 2026-08-07) — FDA
    // labels, GAO reports, TRICARE/MHS GENESIS. Deliberately NOT hrsa.gov (no
    // compensation route ships) and NOT law.cornell.edu (regulations cite to
    // ecfr.gov instead).
    "fda.gov", "gao.gov", "tricare.mil",
  ];
  const walk = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) return walk(p);
      return /\.(ts|tsx)$/.test(e.name) ? [p] : [];
    });
  for (const p of walk(path.join(root, "src"))) {
    if (p.endsWith("book.ts")) continue; // the book quotes sources; not app chrome
    const src = fs.readFileSync(p, "utf8");
    for (const m of src.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)) {
      const host = m[1].toLowerCase().replace(/^www\./, "");
      if (host.includes("operationwholehealth")) {
        fail("links", `${path.relative(root, p)} links to the founder's own domain (${host}).`);
      } else if (!allowed.some((a) => host === a || host.endsWith("." + a))) {
        fail("links", `${path.relative(root, p)} links to an unapproved host: ${host}`);
      }
    }
  }
}

// ── 5. Shots ↔ Exposure Library isolation, BOTH directions ──────────────────
// Council ruling 2026-08-07: a vaccine is never an exposure. The Exposure
// Library pattern (clickable ingredient → organ → /solutions) is exactly the
// wrong pattern for a shot page, and the danger is symmetric — a toxicant page
// linking INTO shots content would build the same causal path from the other
// side.
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
{
  for (const f of SHOTS_FILES) {
    const src = stripComments(read(f));
    if (/\/learn\/|\/solutions\b/.test(src)) {
      fail("shots-isolation", `${f} references /learn/ or /solutions — shots content must never link into the Exposure Library.`);
    }
    if (/@\/lib\/toxlibrary|@\/lib\/education/.test(src)) {
      fail("shots-isolation", `${f} imports from lib/toxlibrary or lib/education — those are the Exposure Library's data files.`);
    }
  }
  for (const f of LEARN_FILES) {
    const src = stripComments(read(f));
    if (/\/shots\b/.test(src)) {
      fail("shots-isolation", `${f} references /shots — the Exposure Library must never link into shots content.`);
    }
  }
}

// ── 6. service_events query isolation ────────────────────────────────────────
// Every proposed rule elsewhere was scoped to shots FILES. The real hole is one
// line of supabase.from("service_events") inside EstimatorView or education.ts
// feeding the vaccine list into the exposure-scoring engine with no href
// involved at all. So this greps the whole src tree, not just shots files.
{
  const SERVICE_EVENTS_ALLOWED = ["src/lib/serviceEvents.ts"];
  for (const p of walkAll(path.join(root, "src"))) {
    const f = rel(p);
    if (SERVICE_EVENTS_ALLOWED.includes(f)) continue;
    if (read(f).includes("service_events")) {
      fail(
        "shots-query-isolation",
        `${f} contains the string "service_events" outside the enumerated allowlist (${SERVICE_EVENTS_ALLOWED.join(", ")}). ` +
          `A shot must never be queryable as though it were an exposure.`
      );
    }
  }
}

// ── 7. shotlibrary.ts shape — ingredients is prose, not a chip source ───────
{
  const p = "src/lib/shotlibrary.ts";
  if (fs.existsSync(path.join(root, p))) {
    const src = read(p);
    if (/ingredients\s*:\s*\[/.test(src) || /ingredients\s*:\s*string\[\]/.test(src)) {
      fail("shots-shape", `${p}: "ingredients" must be a single verbatim string, never an array — an array becomes chips, chips become links.`);
    }
    for (const id of ["organs:", "tags:", "related:", "seeAlso:"]) {
      if (src.includes(id)) fail("shots-shape", `${p} contains "${id}" — the Shot type must carry no organ/tag/related/seeAlso field.`);
    }

    // ── 8. Element + organ/neuro co-occurrence ban ───────────────────────────
    // The funnel actually loaded in this repo is element + ORGAN, not element +
    // hormone (that pair is rule 2's job). Scan proximity windows, not whole-file
    // presence, so two unrelated shots each naming one term don't collide.
    const ELEMENT = /(aluminum|aluminium|mercury|thimerosal|formaldehyde|phenol)/i;
    const ORGAN = /(brain|bone|kidney|liver|nervous system|cognitive|neurologic|encephal\w*|marrow)/i;
    const ALLOWLISTED_WARNINGS = [
      // ACAM2000 and RabAvert boxed-warning language legitimately names
      // encephalitis — exact strings only, never a pattern.
      "progressive vaccinia, eczema vaccinatum, and encephalitis",
      "myopericarditis",
    ];
    let scrubbed = src;
    for (const w of ALLOWLISTED_WARNINGS) scrubbed = scrubbed.split(w).join("");
    const blocks = scrubbed.match(/\[[^\[\]]{0,600}\]/g) || [];
    for (const block of blocks) {
      if (ELEMENT.test(block) && ORGAN.test(block)) {
        fail("shots-co-occurrence", `${p}: an array literal contains both an element token and an organ/neuro token — ${block.slice(0, 140)}…`);
      }
    }

    // ── 9. Second-person era grammar ban ─────────────────────────────────────
    const SECOND_PERSON_ERA = [
      "you would have", "you'd have known", "if that happened to you", "so you received", "you were given",
    ];
    for (const phrase of SECOND_PERSON_ERA) {
      if (src.toLowerCase().includes(phrase)) fail("shots-grammar", `${p}: contains second-person era construction "${phrase}" — era statements must stay third-person.`);
    }
  }
}

// ── 10. Shots files: stricter body-verb and retention vocabulary ────────────
// "Interrupt the cascade" content cannot be built for vaccines — nothing is
// established to have been caused, so nothing is established to reverse. This
// list is a verb ALLOWLIST inversion: ban the synonyms the general rule 3
// vocabulary check can't catch, in the files that matter most.
{
  const BANNED_VERBS = [
    "restore", "rebuild", "reset", "boost", "flush", "heal", "recover",
    "natural", "holistic", "root cause", "protocol", "remedy", "interrupt", "reverse",
    "what you can do about it",
  ];
  const RETENTION = ["stays in", "builds up", "body burden", "half-life", "clears from"];
  for (const f of SHOTS_FILES) {
    const stripped = read(f).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    for (const w of [...BANNED_VERBS, ...RETENTION]) {
      const re = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (re.test(stripped)) fail("shots-vocabulary", `${f}: banned word/phrase "${w}" — nothing is established to reverse for a vaccine, so this slot cannot use body-repair language.`);
    }
  }
}

// ── 11. No count anywhere on the shots list ──────────────────────────────────
// recordSteps() completeness meters and any ".length}" interpolated into JSX
// would tell a man by arithmetic that his memory is deficient.
{
  for (const f of SHOTS_FILES) {
    if (/\.length\s*\}/.test(read(f))) {
      fail("shots-no-count", `${f}: interpolates a ".length}" into JSX — no running count of a veteran's shots may ever render.`);
    }
  }
  const nextaction = read("src/lib/nextaction.ts");
  if (/service_events|shots?\b.*recordSteps|recordSteps[\s\S]{0,400}shots?/i.test(nextaction)) {
    fail("shots-no-count", "src/lib/nextaction.ts: a shots-related key appears near recordSteps() — a completeness meter can never fill for a man who cannot remember every year.");
  }
}

// ── report ──────────────────────────────────────────────────────────────────
if (failures.length) {
  console.error("\n  COI FIREWALL FAILED — build stopped\n");
  for (const { rule, detail } of failures) console.error(`  [${rule}] ${detail}\n`);
  console.error(
    "  These rules exist because the click path is the story, regardless of intent.\n" +
      "  If a change genuinely needs an exception, it needs a human decision, not a\n" +
      "  quick edit to this file.\n"
  );
  process.exit(1);
}
console.log("coi-firewall: ok");
