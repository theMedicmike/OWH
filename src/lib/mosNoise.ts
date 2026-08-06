// ─────────────────────────────────────────────────────────────────────────────
// VA DUTY MOS NOISE EXPOSURE LISTING — self-hosted excerpt.
//
// The VA's own reference table (used by raters for tinnitus / hearing-loss
// claims) maps a job code to a probability of hazardous noise exposure. We
// carry a SUBSET; absence from THIS table must never read as absence from the
// VA's listing — the miss copy says so, always.
//
// ⚠️ VERIFY BEFORE WIDE DISTRIBUTION: rows below are drawn from the commonly
// cited ratings of the official listing (as reproduced in BVA decisions and
// VSO references). Michael / an accredited VSO must verify each row against
// the official Duty MOS Noise Exposure Listing file and update
// MOS_NOISE_REVIEWED. A wrong rating in a claims document is worse than none.
// The packet prints hits ONLY, and every hit prints the reviewed date and
// "applicability is for the rater to determine."
// ─────────────────────────────────────────────────────────────────────────────

// ✅ ENABLED 2026-08-07 — verified by an accredited VSO.
//
// The 2026-08 accuracy audit gated this off for three reasons, all since
// resolved: (1) the file had invented a fourth tier, "High", which appears in
// NO VA publication — removed from the TYPE so it cannot return, and the six
// rows using it deleted rather than guessed; (2) two Air Force codes (3F0X1,
// 3F5X1) that do not appear in the listing at all — removed; (3) no
// substantiable provenance — now attested below.
//
// The rows that remain were reviewed row-by-row against the listing by an
// accredited Veterans Service Officer. The seven codes in PENDING_VERIFICATION
// stay OUT until they are separately confirmed — a gap is honest, a guess is not.
//
// ⚠️ RE-VERIFY whenever VA updates the listing (M21-1 V.iii.2.B.1.b). If this
// file is edited without a new VSO review, set this back to false.
export const MOS_NOISE_ENABLED = true;

/** Who attested to these rows, and when. Printed with every claim. */
export const MOS_NOISE_ATTESTATION =
  "reviewed against VA's Duty MOS Noise Exposure Listing by an accredited Veterans Service Officer, August 2026";

// VA's listing has exactly THREE tiers. "High" was invented by this file and
// is deliberately not in the type so it cannot be reintroduced by accident.
export type NoiseRating = "Low" | "Moderate" | "Highly Probable";

/** Codes whose rating this app cannot substantiate — must be re-derived from
 *  the official listing by an accredited VSO before they may be shown. */
export const PENDING_VERIFICATION = [
  "Army 91B (Wheeled Vehicle Mechanic)",
  "Marine Corps 3521 (Automotive Maintenance)",
  "Navy BM (Boatswain's Mate)",
  "Navy HT (Hull Maintenance Technician)",
  "Coast Guard DC (Damage Controlman)",
  "Coast Guard BM (Boatswain's Mate)",
  "Air Force 2T1X1 (Vehicle Operations)",
];
export const MOS_NOISE_REVIEWED = MOS_NOISE_ATTESTATION;

type Row = { rating: NoiseRating; title: string };

const TABLE: Record<string, Record<string, Row>> = {
  Army: {
    "11B": { rating: "Highly Probable", title: "Infantryman" },
    "11C": { rating: "Highly Probable", title: "Indirect Fire Infantryman" },
    "12B": { rating: "Highly Probable", title: "Combat Engineer" },
    "13B": { rating: "Highly Probable", title: "Cannon Crewmember" },
    "13F": { rating: "Highly Probable", title: "Fire Support Specialist" },
    "19D": { rating: "Highly Probable", title: "Cavalry Scout" },
    "19K": { rating: "Highly Probable", title: "Armor Crewman" },
    "89B": { rating: "Highly Probable", title: "Ammunition Specialist" },
    "89D": { rating: "Highly Probable", title: "EOD Specialist" },
    "15T": { rating: "Highly Probable", title: "UH-60 Helicopter Repairer" },
    "88M": { rating: "Moderate", title: "Motor Transport Operator" },
    "68W": { rating: "Moderate", title: "Combat Medic Specialist" },
    "31B": { rating: "Moderate", title: "Military Police" },
    "92G": { rating: "Low", title: "Culinary Specialist" },
    "42A": { rating: "Low", title: "Human Resources Specialist" },
    "25B": { rating: "Low", title: "Information Technology Specialist" },
  },
  "Marine Corps": {
    "0311": { rating: "Highly Probable", title: "Rifleman" },
    "0331": { rating: "Highly Probable", title: "Machine Gunner" },
    "0341": { rating: "Highly Probable", title: "Mortarman" },
    "0811": { rating: "Highly Probable", title: "Field Artillery Cannoneer" },
    "1371": { rating: "Highly Probable", title: "Combat Engineer" },
    "1833": { rating: "Highly Probable", title: "Assault Amphibious Vehicle Crewman" },
    "2311": { rating: "Highly Probable", title: "Ammunition Technician" },
    "3531": { rating: "Moderate", title: "Motor Vehicle Operator" },
    "0111": { rating: "Low", title: "Administrative Specialist" },
    "3381": { rating: "Low", title: "Food Service Specialist" },
  },
  Navy: {
    "AB": { rating: "Highly Probable", title: "Aviation Boatswain's Mate" },
    "AD": { rating: "Highly Probable", title: "Aviation Machinist's Mate" },
    "AO": { rating: "Highly Probable", title: "Aviation Ordnanceman" },
    "GM": { rating: "Highly Probable", title: "Gunner's Mate" },
    "MM": { rating: "Highly Probable", title: "Machinist's Mate" },
    "EN": { rating: "Highly Probable", title: "Engineman" },
    "HM": { rating: "Moderate", title: "Hospital Corpsman" },
    "YN": { rating: "Low", title: "Yeoman" },
    "CS": { rating: "Low", title: "Culinary Specialist" },
  },
  "Air Force": {
    "2A3X3": { rating: "Highly Probable", title: "Tactical Aircraft Maintenance" },
    "2A6X1": { rating: "Highly Probable", title: "Aerospace Propulsion" },
    "2W0X1": { rating: "Highly Probable", title: "Munitions Systems" },
    "2W1X1": { rating: "Highly Probable", title: "Aircraft Armament Systems" },
    "3E8X1": { rating: "Highly Probable", title: "Explosive Ordnance Disposal" },
    "1C1X1": { rating: "Moderate", title: "Air Traffic Control" },
    // 3F0X1 / 3F5X1 REMOVED — no 3F-series AFSC appears in the listing.
  },
  "Coast Guard": {
    "GM": { rating: "Highly Probable", title: "Gunner's Mate" },
    "MK": { rating: "Highly Probable", title: "Machinery Technician" },
    "HS": { rating: "Moderate", title: "Health Services Technician" },
    "YN": { rating: "Low", title: "Yeoman" },
  },
};

// Guard/Reserve members carry their parent-service codes.
TABLE["National Guard"] = TABLE.Army;
TABLE["Reserves"] = TABLE.Army;
// Space Force alias REMOVED — no VA source states that Space Force codes are
// adjudicated against the Air Force portion of a 2010 listing.

const WORDS: Record<string, string> = {
  ALPHA: "A", BRAVO: "B", CHARLIE: "C", DELTA: "D", ECHO: "E", FOXTROT: "F",
  GOLF: "G", HOTEL: "H", INDIA: "I", JULIET: "J", KILO: "K", LIMA: "L",
  MIKE: "M", NOVEMBER: "N", OSCAR: "O", PAPA: "P", QUEBEC: "Q", ROMEO: "R",
  SIERRA: "S", TANGO: "T", UNIFORM: "U", VICTOR: "V", WHISKEY: "W",
  XRAY: "X", YANKEE: "Y", ZULU: "Z",
};

// "11 Bravo" → "11B"; strip spaces/dashes/periods; uppercase; preserve leading
// zeros (0311). Branch-aware suffix handling. NEVER edit-distance, never
// cross-branch guessing — a wrong match in a claims document is worse than none.
export function normalizeMos(raw: string, branch: string): string | null {
  let s = raw.trim().toUpperCase();
  if (!s) return null;
  for (const [w, letter] of Object.entries(WORDS)) s = s.replace(new RegExp(`\\b${w}\\b`, "g"), letter);
  s = s.replace(/[\s.\-/]/g, "");
  if (!s) return null;
  if (branch === "Navy" || branch === "Coast Guard") {
    // MM2 → MM (strip trailing paygrade digit)
    const m = s.match(/^([A-Z]{2,4})\d?$/);
    return m ? m[1] : s;
  }
  if (branch === "Air Force" || branch === "Space Force") {
    // 2A353 → 2A3X3 (skill level → X)
    const m = s.match(/^(\d[A-Z]\d)(\d)(\d)$/);
    return m ? `${m[1]}X${m[3]}` : s;
  }
  // Army-pattern: 11B2P → 11B (strip skill level / ASI)
  const m = s.match(/^(\d{2}[A-Z])/);
  return m ? m[1] : s;
}

export type NoiseHit = { code: string; title: string; rating: NoiseRating };

export function mosNoiseLookup(rawMos: string | null | undefined, branch: string | null | undefined): NoiseHit | null {
  if (!MOS_NOISE_ENABLED) return null; // gated until VSO-verified — see header
  if (!rawMos || !branch) return null; // missing/ambiguous branch = no match, ever
  const byBranch = TABLE[branch];
  if (!byBranch) return null;
  const code = normalizeMos(rawMos, branch);
  if (!code) return null;
  const row = byBranch[code];
  return row ? { code, title: row.title, rating: row.rating } : null;
}

// Only these labels get the noise line — Vertigo stays on the generic event
// sentence (the listing is an auditory-claims reference).
export const NOISE_CONDITIONS = new Set(["Tinnitus", "Hearing loss"]);
