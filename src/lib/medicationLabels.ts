import { MEDICATION_EFFECTS, type MedicationEffect } from "./medicationEffects";

// Called from the medication detail page's SERVER component — no client fetch,
// no loading flash, and Next caches the upstream call for a day.

// ─────────────────────────────────────────────────────────────────────────────
// openFDA DRUG LABEL CLIENT
//
// This is what lets the Medications feature cover every prescription a veteran
// might have been given instead of a hand-typed list of forty. The label text
// is the FDA's own, fetched live and quoted verbatim — the app never writes,
// paraphrases, or summarizes what a drug does.
//
// API shape below was verified against live calls (2026-08-13). Three findings
// that will silently break this if anyone "simplifies" them later:
//
//   1. A zero-result search returns HTTP 404 with an {error} body — NOT an
//      empty results array. Treating 404 as a hard failure would make every
//      unrecognized drug name look like an outage.
//   2. EVERY content field is an array of strings, never a bare string —
//      `adverse_reactions[0]`, `openfda.brand_name[0]`. Arrays are usually
//      length 1 but not always, so join rather than blindly indexing [0].
//   3. The corpus is enormously duplicated (ibuprofen alone returns ~1,185
//      labels, one per repackager) and many are near-empty stubs. Fetching
//      limit=1 gets you a random repackager's blank label. Hence pickBest().
//
// On percentages: the firewall bans rating percentages in this feature's
// source. FDA label PROSE sometimes contains incidence figures ("reported in
// 2% of patients"). That is the FDA's own text and it stays verbatim — it is
// epidemiology, not a VA rating, and editing a quoted federal label to satisfy
// a lint rule would be the actual error.
// ─────────────────────────────────────────────────────────────────────────────

const OPENFDA_URL = "https://api.fda.gov/drug/label.json";

/** Cap per section. Real `adverse_reactions` sections run ~10,000 chars and a
 *  whole label can reach ~191,000 — unbounded text would wreck the page. */
const SECTION_CAP = 7000;

export type LabelSection = { key: string; title: string; text: string };

export type DrugLabel = {
  brandName: string | null;
  genericName: string | null;
  manufacturer: string | null;
  productType: string | null;
  /** YYYYMMDD, as the API returns it. */
  effectiveTime: string | null;
  setId: string | null;
  sections: LabelSection[];
};

export type DrugLabelResult =
  | { status: "ok"; label: DrugLabel; effects: MedicationEffect[] }
  | { status: "not-found" }
  | { status: "unavailable"; message: string };

type RawLabel = Record<string, unknown>;

/** Sections worth showing, in the order a reader should meet them. Rx labels
 *  carry `warnings_and_cautions`; older/OTC labels carry `warnings` instead,
 *  and OTC labels have no `adverse_reactions` at all — so this list covers
 *  both formats and simply skips whatever is absent. */
const SECTION_SPEC: { key: string; title: string }[] = [
  { key: "boxed_warning", title: "Boxed warning — the FDA's most serious" },
  { key: "adverse_reactions", title: "Adverse reactions" },
  { key: "warnings_and_cautions", title: "Warnings and cautions" },
  { key: "warnings", title: "Warnings" },
  { key: "do_not_use", title: "Do not use" },
  { key: "stop_use", title: "Stop use and ask a doctor if" },
  { key: "contraindications", title: "Contraindications" },
  { key: "drug_interactions", title: "Drug interactions" },
];

function joinField(raw: RawLabel, key: string): string | null {
  const v = raw[key];
  if (!Array.isArray(v)) return null;
  const text = v.filter((x): x is string => typeof x === "string").join("\n\n").trim();
  return text || null;
}

function firstOf(raw: RawLabel, path: string[]): string | null {
  let cur: unknown = raw;
  for (const p of path) {
    if (!cur || typeof cur !== "object") return null;
    cur = (cur as Record<string, unknown>)[p];
  }
  if (Array.isArray(cur)) {
    const s = cur.find((x): x is string => typeof x === "string");
    return s ?? null;
  }
  return typeof cur === "string" ? cur : null;
}

/** The corpus is one label per repackager, many of them stubs. Score for the
 *  one an actual human should read: original packager, most real content,
 *  newest. */
function pickBest(results: RawLabel[]): RawLabel | null {
  let best: RawLabel | null = null;
  let bestScore = -1;
  for (const r of results) {
    let score = 0;
    for (const { key } of SECTION_SPEC) if (joinField(r, key)) score += 10;
    const openfda = r.openfda;
    if (openfda && typeof openfda === "object") {
      const orig = (openfda as Record<string, unknown>).is_original_packager;
      if (Array.isArray(orig) && orig[0] === true) score += 25;
      if (firstOf(r, ["openfda", "generic_name"])) score += 3;
    }
    const eff = typeof r.effective_time === "string" ? parseInt(r.effective_time, 10) : 0;
    // Recency breaks ties without ever outweighing having real content.
    const recency = Number.isFinite(eff) ? eff / 100_000_000 : 0;
    if (score + recency > bestScore) {
      bestScore = score + recency;
      best = r;
    }
  }
  return bestScore > 0 ? best : null;
}

function normalize(raw: RawLabel): DrugLabel {
  const sections: LabelSection[] = [];
  for (const { key, title } of SECTION_SPEC) {
    const text = joinField(raw, key);
    if (!text) continue;
    sections.push({
      key,
      title,
      text: text.length > SECTION_CAP ? `${text.slice(0, SECTION_CAP).trimEnd()}…` : text,
    });
  }
  return {
    brandName: firstOf(raw, ["openfda", "brand_name"]),
    genericName: firstOf(raw, ["openfda", "generic_name"]),
    manufacturer: firstOf(raw, ["openfda", "manufacturer_name"]),
    productType: firstOf(raw, ["openfda", "product_type"]),
    effectiveTime: typeof raw.effective_time === "string" ? raw.effective_time : null,
    setId: typeof raw.set_id === "string" ? raw.set_id : null,
    sections,
  };
}

/** Which curated conditions this label's own text actually mentions. Pure text
 *  matching against the FDA's words — the app never infers an effect the label
 *  doesn't name, and never claims the veteran HAS any of them. */
export function matchEffects(label: DrugLabel): MedicationEffect[] {
  const haystack = label.sections.map((s) => s.text).join("\n").toLowerCase();
  if (!haystack) return [];
  return MEDICATION_EFFECTS.filter((e) => e.labelTerms.some((t) => haystack.includes(t.toLowerCase())));
}

/** YYYYMMDD → "11 August 2026". Returns null rather than inventing a date. */
export function formatEffectiveTime(t: string | null): string | null {
  if (!t || !/^\d{8}$/.test(t)) return null;
  const d = new Date(`${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

export async function fetchDrugLabel(name: string): Promise<DrugLabelResult> {
  const q = name.trim();
  if (!q) return { status: "not-found" };
  // Quote the value so multi-word names ("hydrocodone acetaminophen") don't
  // fragment the query, and escape the quotes a user might type themselves.
  const safe = q.replace(/["\\]/g, " ").trim();
  if (!safe) return { status: "not-found" };
  const search = `(openfda.brand_name:"${safe}"+OR+openfda.generic_name:"${safe}"+OR+openfda.substance_name:"${safe}")`;
  const key = process.env.OPENFDA_API_KEY;
  const url =
    `${OPENFDA_URL}?search=${encodeURI(search)}&sort=effective_time:desc&limit=25` +
    (key ? `&api_key=${encodeURIComponent(key)}` : "");

  let res: Response;
  try {
    // Cached for a day: the label for a given drug changes rarely, and the
    // un-keyed openFDA quota is 1,000 requests per day per IP.
    res = await fetch(url, { next: { revalidate: 86400 } });
  } catch {
    return { status: "unavailable", message: "Couldn't reach the FDA's label database just now." };
  }

  // A search with no hits is a 404 here, not an empty list — that is a real
  // "we don't have this drug," not an outage, and it reads very differently.
  if (res.status === 404) return { status: "not-found" };
  if (!res.ok) {
    return { status: "unavailable", message: "The FDA's label database returned an error just now." };
  }

  let body: { results?: RawLabel[] };
  try {
    body = (await res.json()) as { results?: RawLabel[] };
  } catch {
    return { status: "unavailable", message: "Couldn't read the response from the FDA's label database." };
  }

  const best = pickBest(body.results ?? []);
  if (!best) return { status: "not-found" };
  const label = normalize(best);
  if (!label.sections.length) return { status: "not-found" };
  return { status: "ok", label, effects: matchEffects(label) };
}
