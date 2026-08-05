// ─────────────────────────────────────────────────────────────────────────────
// PRESUMPTIVE SCOPE — the difference between a legal status and a study.
//
// A VA presumption is NEVER a property of a condition, and NEVER a property of
// an exposure class. It attaches to a VETERAN whose service meets specific
// locations, dates, and sometimes a minimum duration. The app previously
// asserted presumptive status from the exposure class alone, which meant a
// water-contamination pin at any base in any year printed as a Camp Lejeune
// presumptive pathway — twenty years outside the statutory window.
//
// RULE OF THIS MODULE: if we cannot AFFIRMATIVELY verify that a veteran's own
// logged service falls inside a presumption's scope, we do not claim the
// presumption. We say what is documented, and we route the question to an
// accredited VSO. Under-claiming costs a veteran a conversation; over-claiming
// costs them credibility with a rater — and costs a VSO their trust in us.
//
// SOURCES (verified 2026-08):
//   PACT locations/dates .... 38 U.S.C. §1119(c)
//   PACT conditions ......... 38 U.S.C. §1120; 38 CFR §§3.320, 3.320a, 3.320b
//   Agent Orange locations .. 38 U.S.C. §1116(d) (PACT Act §403)
//   Agent Orange conditions . 38 CFR §3.309(e); 38 U.S.C. §1116(a)(2)
//   Camp Lejeune ............ 38 CFR §3.307(a)(7) (30+ days, Aug 1953–Dec 1987)
//   Camp Lejeune diseases ... 38 CFR §3.309(f)
//   Gulf War ................ 38 CFR §3.317
//   Radiation ............... 38 CFR §3.309(d); §3.311 (dose assessment)
// ─────────────────────────────────────────────────────────────────────────────

export type ScopeResult = {
  /** 'in-scope' = the veteran's own logged service plausibly meets the scope.
   *  'out-of-scope' = we can affirmatively tell it does not.
   *  'unknown' = we cannot tell from what's logged — the honest default. */
  status: "in-scope" | "out-of-scope" | "unknown";
  /** The scope itself, in plain English, always printed with the claim. */
  scope: string;
  /** What to say when status !== 'in-scope'. */
  note?: string;
};

export type TourFacts = { place: string; year: number | null };

const has = (place: string, needles: string[]) => {
  const p = place.toLowerCase();
  return needles.some((n) => p.includes(n));
};

// 38 U.S.C. §1119(c) — two independent branches, different start dates.
const PACT_GULF = ["bahrain", "iraq", "kuwait", "oman", "qatar", "saudi", "somalia", "united arab emirates", "u.a.e", "uae", "persian gulf", "red sea", "gulf of aden", "gulf of oman", "arabian sea"];
const PACT_POST911 = ["afghanistan", "djibouti", "egypt", "jordan", "lebanon", "syria", "yemen", "uzbekistan"];

export const PACT_SCOPE =
  "Presumed exposure applies to service in — or the airspace above — Bahrain, Iraq, Kuwait, Oman, Qatar, Saudi Arabia, Somalia or the UAE (including the Persian Gulf, Red Sea, Gulf of Aden, Gulf of Oman and Arabian Sea) on or after August 2, 1990; OR Afghanistan, Djibouti, Egypt, Jordan, Lebanon, Syria, Yemen or Uzbekistan on or after September 11, 2001. (38 U.S.C. §1119(c).) Service elsewhere carries no PACT presumption.";

export const AGENT_ORANGE_SCOPE =
  "Presumed herbicide exposure covers: Vietnam 1/9/1962–5/7/1975 (including inland waterways and within 12 nautical miles of the Vietnam/Cambodia demarcation line); Thailand, any U.S. or Royal Thai base, 1/9/1962–6/30/1976; Laos 12/1/1965–9/30/1969; Cambodia at Mimot or Krek 4/16–4/30/1969; Guam or American Samoa 1/9/1962–7/31/1980; Johnston Atoll or a ship that called there 1/1/1972–9/30/1977; the Korean DMZ 9/1/1967–8/31/1971; and C-123 aircrew. (38 U.S.C. §1116(d).) Commercial pesticide exposure carries no presumption.";

export const LEJEUNE_SCOPE =
  "Requires 30 or more days — consecutive or not — at Camp Lejeune or MCAS New River between August 1, 1953 and December 31, 1987. Applies to veterans, reservists and National Guard. (38 CFR §3.307(a)(7).) The eight presumptive diseases are listed at 38 CFR §3.309(f). No VA presumption of exposure applies to contaminated water at any other installation.";

export const GULF_WAR_SCOPE =
  // The two gates that actually decide a §3.317 claim — the no-clinical-
  // diagnosis rule (a)(1)(ii) and the 6-month chronicity rule (a)(4) — were
  // both absent from the app before 2026-08. The deadline is appended
  // separately by gulfWarScope() so it can never be edited away from here.
  "38 CFR §3.317 covers a qualifying chronic disability only if NO clinical diagnosis explains it (§3.317(a)(1)(ii)) — except chronic fatigue syndrome, fibromyalgia and functional gastrointestinal disorders, which the regulation names and which DO qualify even though they are diagnoses. The symptoms must also have lasted 6 months or more, or come and gone across a 6-month period measured from when they first appeared (§3.317(a)(4)).";

export const RADIATION_SCOPE =
  "A radiation presumption applies only to veterans who took part in a listed radiation-risk activity: atmospheric nuclear test participation; the occupation of Hiroshima or Nagasaki (8/6/1945–7/1/1946); POW in Japan; qualifying service at Paducah, Portsmouth or K-25; Amchitka before 1/1/1974; the Enewetak cleanup (1977–1980); Palomares (1/17/1966–3/31/1967); or Thule (1/21–9/25/1968). (38 CFR §3.309(d)(3)(ii).) Other radiation work — including radar, shipyard and depleted uranium — goes through a dose assessment under 38 CFR §3.311, not a presumption.";

export function pactScope(tours: TourFacts[]): ScopeResult {
  const anyGulf = tours.some((t) => has(t.place, PACT_GULF) && (t.year ?? 0) >= 1990);
  const any911 = tours.some((t) => has(t.place, PACT_POST911) && (t.year ?? 0) >= 2001);
  if (anyGulf || any911) return { status: "in-scope", scope: PACT_SCOPE };
  const namedButWrongDate = tours.some((t) => has(t.place, [...PACT_GULF, ...PACT_POST911]));
  return {
    status: namedButWrongDate ? "out-of-scope" : "unknown",
    scope: PACT_SCOPE,
    note: namedButWrongDate
      ? "The place matches, but the years you logged fall outside the covered window — check your dates, and ask a VSO."
      : "Nothing you've logged confirms service in a covered location and date range — which doesn't decide anything. A VSO can check your service against the list.",
  };
}

export function agentOrangeScope(tours: TourFacts[]): ScopeResult {
  const inScope = tours.some((t) => {
    const y = t.year ?? 0;
    if (has(t.place, ["vietnam", "da nang", "bien hoa", "tan son nhut", "cam ranh", "phu bai"])) return y >= 1962 && y <= 1975;
    if (has(t.place, ["thailand", "udorn", "u-tapao", "korat", "nakhon phanom", "ubon", "takhli"])) return y >= 1962 && y <= 1976;
    if (has(t.place, ["laos"])) return y >= 1965 && y <= 1969;
    if (has(t.place, ["guam", "american samoa"])) return y >= 1962 && y <= 1980;
    if (has(t.place, ["johnston atoll"])) return y >= 1972 && y <= 1977;
    if (has(t.place, ["dmz", "korea"])) return y >= 1967 && y <= 1971;
    return false;
  });
  if (inScope) return { status: "in-scope", scope: AGENT_ORANGE_SCOPE };
  return {
    status: "unknown",
    scope: AGENT_ORANGE_SCOPE,
    note: "Nothing you've logged confirms service in a covered herbicide location and date range. A VSO can check — including Thailand base perimeters, the Korean DMZ, and C-123 aircrew.",
  };
}

export function lejeuneScope(tours: TourFacts[]): ScopeResult {
  const matched = tours.some((t) => has(t.place, ["lejeune", "new river"]));
  const inWindow = tours.some((t) => has(t.place, ["lejeune", "new river"]) && (t.year ?? 0) >= 1953 && (t.year ?? 0) <= 1987);
  if (inWindow) {
    return {
      status: "in-scope",
      scope: LEJEUNE_SCOPE,
      note: "The app cannot verify the 30-day minimum — that one gate decides many Camp Lejeune claims. Confirm it with your VSO.",
    };
  }
  return {
    status: matched ? "out-of-scope" : "unknown",
    scope: LEJEUNE_SCOPE,
    note: matched
      ? "You logged Camp Lejeune, but outside August 1953 – December 1987. Check your dates with a VSO."
      : "The Camp Lejeune presumption applies only to Camp Lejeune and MCAS New River. Contaminated water documented elsewhere supports a direct claim, not a presumption.",
  };
}

// ⏰ 38 CFR §3.317(a)(1)(i). Grep-verified absent from the whole codebase
// before 2026-08 — with under five months left to run.
export const GULF_WAR_DEADLINE = "December 31, 2026";
export const GULF_WAR_DEADLINE_LINE =
  `⏰ A Gulf War qualifying chronic disability must have become manifest during Southwest Asia service, or to a degree of 10 percent or more not later than ${GULF_WAR_DEADLINE} (38 CFR §3.317(a)(1)(i)). Ask your VSO about this deadline now, and confirm whether VA has extended it.`;

export function gulfWarScope(): ScopeResult {
  return { status: "unknown", scope: `${GULF_WAR_SCOPE} ${GULF_WAR_DEADLINE_LINE}` };
}
export function radiationScope(): ScopeResult {
  return {
    status: "unknown",
    scope: RADIATION_SCOPE,
    note: "The app can't tell whether your service was a listed radiation-risk activity — that's a VSO question.",
  };
}

export function scopeFor(program: string, tours: TourFacts[]): ScopeResult {
  switch (program) {
    case "pact": return pactScope(tours);
    case "agent_orange": return agentOrangeScope(tours);
    case "lejeune": return lejeuneScope(tours);
    case "gulf_war": return gulfWarScope();
    case "radiation": return radiationScope();
    default: return { status: "unknown", scope: "" };
  }
}

// 38 U.S.C. §1120(b)(1) reads "Asthma that was diagnosed after service." The
// app already asks when a condition began (onset_precision), so it can honor
// the qualifier instead of printing a caveat nobody reads.
export function asthmaPostServiceNote(onsetPrecision: string | null | undefined): string | null {
  if (onsetPrecision === "in_service") {
    return "You marked this as beginning while you were in. The PACT Act presumptive for asthma reads \"asthma that was DIAGNOSED AFTER SERVICE\" (38 U.S.C. §1120(b)(1)) — so the presumption may not be the right route here. That does not close the door: asthma that began in service is claimed by direct service connection instead. Ask your VSO which lane fits.";
  }
  return null;
}

// Camp Lejeune health-care eligibility (38 CFR §17.400) is COST-FREE CARE, not
// disability compensation, and its 15-condition list is different from the 8
// presumptives. Conflating the two is the classic Camp Lejeune error.
export const LEJEUNE_HEALTHCARE_NOTE =
  "This condition is on VA's Camp Lejeune HEALTH CARE list (38 CFR §17.400) — cost-free care for that condition. It is NOT one of the eight disability presumptives at 38 CFR §3.309(f). Those are different lists with different benefits; ask your VSO about both.";
