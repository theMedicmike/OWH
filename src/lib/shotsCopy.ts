// Frozen copy for the shots/vaccines feature (council ruling, 2026-08-07).
// Byte-identical for every user, not derived from anything a veteran logged.
// scripts/coi-firewall.cjs bans body-repair verbs and retention vocabulary in
// this file — see its "shots-vocabulary" rule. Do not reword these passages to
// sound warmer; the discipline IS the content.

export const RETRIEVED = "2026-08-08";

// ── The locator (/shots/record) ──────────────────────────────────────────────

export type LocatorRoute = { branch: string; window: string; office: string };

export const LOCATOR_ROUTES: LocatorRoute[] = [
  { branch: "Army", window: "October 1992 – December 2013", office: "VA (Records Management Center)" },
  { branch: "Army", window: "January 2014 – present", office: "AMEDD Record Processing Center" },
  { branch: "Air Force / Space Force", window: "May 1994 – December 2013", office: "VA (Records Management Center)" },
  { branch: "Air Force / Space Force", window: "2014 – present", office: "AF STR Processing Center" },
  { branch: "Navy", window: "1903 – January 1994", office: "National Personnel Records Center (NPRC)" },
  { branch: "Navy", window: "January 1994 – December 2013", office: "VA (Records Management Center)" },
  { branch: "Navy", window: "2014 – present", office: "BUMED Navy Medicine Records Activity" },
  { branch: "Marine Corps", window: "1905 – April 1994", office: "National Personnel Records Center (NPRC)" },
  { branch: "Marine Corps", window: "May 1994 – December 2013", office: "VA (Records Management Center)" },
  { branch: "Marine Corps", window: "2014 – present", office: "BUMED Navy Medicine Records Activity" },
  { branch: "Coast Guard", window: "April 1998 – September 2014", office: "VA (Records Management Center)" },
  { branch: "Coast Guard", window: "October 2014 – present", office: "USCG HSWL SC" },
];

export const LOCATOR_SOURCE_STAMP = `Routing as published by the National Archives (archives.gov, veterans' service records locations), retrieved ${RETRIEVED}.`;

const ROUTE_BRANCH_ALIAS: Record<string, string> = { "Space Force": "Air Force / Space Force" };

// Windows above are month-boundary strings ("October 1992"), parsed once here
// so the lookup can compare against a plain separation year.
function windowCoversYear(window: string, year: number): boolean {
  const [startPart, endPart] = window.split(/\s+[–-]\s+/);
  const parseEdge = (s: string, edge: "start" | "end") => {
    if (/present/i.test(s)) return edge === "start" ? Infinity : Infinity;
    const m = s.match(/([A-Za-z]+)?\s*(\d{4})/);
    if (!m) return edge === "start" ? -Infinity : Infinity;
    return Number(m[2]);
  };
  const startYear = parseEdge(startPart, "start");
  const endYear = /present/i.test(endPart) ? Infinity : parseEdge(endPart, "end");
  return year >= startYear && year <= endYear;
}

/** The office holding a veteran's shot record, by branch and separation year. Still serving → the current-era office. */
export function officeFor(branch: string, separationYear: number): LocatorRoute | null {
  const key = ROUTE_BRANCH_ALIAS[branch] ?? branch;
  return LOCATOR_ROUTES.find((r) => r.branch === key && windowCoversYear(r.window, separationYear)) ?? null;
}

export const LOCATOR_MILCONNECT_LINE =
  "milConnect will get you your DD214 and your personnel file. It will not get you your shot record. Those are two different files, kept in two different places. This is where most people lose a month.";

export const LOCATOR_EXPECTATION_LINE =
  "You'll get a stack, not a list. Look inside it for SF 601, DD Form 2766, and DD Form 2766C — that's where shots were written down. It takes a while. Start now.";

export const LOCATOR_NO_FEE_LINE = "No wait time, no fee — nobody publishes one.";

export const LOCATOR_MHS_GENESIS_NOTE =
  "For separations on or after 1 January 2014, you may also find records in MHS GENESIS. TRICARE notes that records with sensitive content may not appear there.";

export const LOCATOR_STATE_REGISTRY_NOTE =
  "Your state's immunization registry is a second door. CDC keeps a state-by-state contact list.";

export const LOCATOR_VA_FORM_NOTE = "For your VA-side records specifically, VA Form 10-5345a authorizes a release of information.";

// NA Form 13055 — the 1973 National Personnel Records Center fire. Shown ONLY
// to the exact cohort archives.gov names.
export const NA_13055_ELIGIBLE = (branch: string, dischargeDate: Date | null): boolean => {
  if (!dischargeDate) return false;
  const y = dischargeDate.getUTCFullYear();
  const start = new Date(Date.UTC(y, dischargeDate.getUTCMonth(), dischargeDate.getUTCDate()));
  if (branch === "Army") {
    return start >= new Date("1912-11-01T00:00:00Z") && start <= new Date("1960-01-01T00:00:00Z");
  }
  if (branch === "Air Force") {
    return start >= new Date("1947-09-25T00:00:00Z") && start <= new Date("1964-01-01T00:00:00Z");
  }
  return false;
};
export const NA_13055_NOTE =
  "A 1973 fire at the National Personnel Records Center destroyed many records for this exact service window. NA Form 13055 lets the Center reconstruct what it can from alternate sources.";

// ── /shots landing page — "What would warrant getting looked at" ────────────
// Never "What you can do about it," never "Reverse the cascade" — a title the
// honest content cannot fill is an open invitation to fill it dishonestly.

export const INTERRUPT_SPINE =
  "Two things are true at once. If something is wrong with you now, it deserves a real evaluation now, whatever's on these pages — you don't need anyone to agree with you about the cause to get properly worked up. And there's no test that finds a shot you were given years ago. Not a blood test, not a scan, not a panel.";

export const INTERRUPT_SYMPTOM_LINE =
  "If you get a vaccine from here on — a flu shot, anything — and you develop chest pain, shortness of breath, or a pounding or fluttering heartbeat in the two weeks after, get seen rather than waiting it out. That's what CDC tells clinicians to look for. It's about the symptom and the timing, not about which shot you got. If that happened years ago and resolved, there's nothing to check for now.";

export const INTERRUPT_SAFETY_VALVE =
  "There's no validated test that measures a vaccine, an adjuvant, or a preservative in your body years later, and no treatment that removes one. What's sold under those names is real, and some of it is dangerous. Provoked or challenge urine testing, hair and nail mineral panels, and \"vaccine injury\" antibody panels are not validated — the same sample can come back different at two labs. If someone's answer to your service history is a product, walk.";

export type FreeDoor = { name: string; detail: string };
export const INTERRUPT_FREE_DOORS: FreeDoor[] = [
  { name: "PACT Act toxic exposure screening", detail: "VA must offer every enrolled veteran one, and another at least every five years. Five to ten minutes — ask at your next appointment." },
  { name: "Your VA Environmental Health Coordinator", detail: "A named person for your state, with a phone number and an email." },
  { name: "VET-HOME", detail: "833-633-8846, weekdays 9:00 a.m.–7:30 p.m. Eastern." },
  { name: "Quit VET", detail: "1-855-784-8838, weekdays 9 to 9 Eastern — free if you get your care through VA, and what you say there does not go in your chart." },
];

// ── /shots/history — era, custody, and the federal lists ────────────────────

export type EraEvent = { year: string; text: string };
export const ERA_TIMELINE: EraEvent[] = [
  { year: "1953", text: "U.S. Navy and Marine Corps recruit training centers begin intramuscular benzathine penicillin G for group A streptococcus prophylaxis." },
  { year: "1971", text: "Adenovirus types 4 and 7 given as two oral tablets to enlisted basic trainees begins." },
  { year: "1990–1991", text: "Pyridostigmine bromide issued during the Gulf War as a nerve-agent pretreatment, under an FDA informed-consent waiver for investigational products (interim rule, 21 December 1990, 21 CFR 50.23(d))." },
  { year: "1999", text: "Adenovirus tablet supply runs out; the program lapses." },
  { year: "5 October 1999", text: "FDA publishes a rule change (64 FR 54180) moving to injected polio, stating the new requirements exist \"in order to help ensure better recordkeeping than occurred during the Gulf War.\"" },
  { year: "18 May 1998", text: "The Department of Defense begins the mandatory Anthrax Vaccine Immunization Program for the Total Force." },
  { year: "27 October 2004", text: "A federal court vacates FDA's anthrax rule and enjoins the mandatory program (Doe v. Rumsfeld, 341 F. Supp. 2d 1)." },
  { year: "December 2002", text: "Smallpox vaccination restarts for designated forces, using the existing Dryvax stock." },
  { year: "19 December 2005", text: "FDA issues its Final Order on the anthrax vaccine (70 FR 75180–75198, Docket 1980N-0208)." },
  { year: "October 2006", text: "The Department resumes requiring the anthrax vaccine for designated personnel." },
  { year: "2007", text: "ACAM2000 is licensed, replacing the Dryvax smallpox vaccine stock." },
  { year: "October 2011", text: "Adenovirus vaccination resumes at basic training installations under a new manufacturing contract (Lyons et al., Vaccine 2013, PMID 23291475; CDC Emerging Infectious Diseases 18(3))." },
  { year: "24 August 2021", text: "COVID-19 vaccination is mandated for the military." },
  { year: "10 January 2023", text: "The COVID-19 vaccination mandate is rescinded." },
];

export const CONFIRM_GAP_HEADING = "What we could and could not confirm";
export const CONFIRM_GAP_TEXT =
  "AR 40-562's 7 October 2013 edition is what we can quote; earlier editions were never obtained. We cannot state the year hepatitis A, hepatitis B, or varicella entered the military accession schedule, and we cannot state the year routine smallpox vaccination of recruits stopped before the 2002 restart. Jet injectors — the \"air gun\" some veterans remember — were discontinued in the late 1990s; we could not verify an exact date to a primary source. This is not a list we're ashamed of. It's the actual state of the record, and a man who served decades ago can tell the difference between a sourced date and a plausible one in about four seconds.";

export const CUSTODY_OPENING = [
  "No study has ever followed US service members' vaccination records against their later health. One reason is that, for large stretches, the records to build it from were not kept.",
  "In 2003 the Government Accountability Office reviewed 1,071 medical records, from a universe of 8,742, at selected Army and Air Force installations supporting operations in Afghanistan and the Balkans. Between 14 and 46 percent were missing at least one of the required immunizations, and 8 to 93 percent of immunization documentation was missing from the central database. The Department of Defense agreed with the finding (GAO-03-1041, September 2003). A follow-on review found compliance mixed but better for more recent deployments (GAO-05-120, November 2004). Nobody has audited the decades before that.",
  "When the FDA rewrote its rules in 1999, it put the reason in the rule itself: the new requirements exist \"in order to help ensure better recordkeeping than occurred during the Gulf War\" (64 FR 54180, 5 October 1999).",
];

export const CONSENT_WAIVER_FACT =
  "For two investigational products, FDA granted a waiver of informed consent under an interim rule dated 21 December 1990 (21 CFR 50.23(d)). Licensed vaccines were given under a lawful order, which is a different thing.";

export const CAUSATION_ANSWER = [
  "Did this shot cause my illness?",
  "Nobody can tell you, and this app will not pretend to. There is no established link between any military vaccine and any long-lasting condition.",
  "Separately — and this is the part that belongs to you — the record of what you were given was often not kept. That's the thing we can still help you fix.",
  "There is no VA presumptive list for vaccines. A reaction that happened in service is claimed as direct service connection under 38 CFR 3.303, which requires the event in your service record, a current diagnosis, and a doctor connecting the two. This app documents. It does not advise you, does not file for you, and is not your representative (38 CFR 14.629). Whether any of that describes you is your VSO's call.",
];

export const INJURY_TABLE_DISCLAIMER =
  "This is a fact about which federal list a shot's reactions were placed on, not about which shot is more or less safe. The Vaccine Injury Table (42 CFR 100.3) does not list anthrax, smallpox, adenovirus, yellow fever, Japanese encephalitis, rabies, or typhoid. A separate program (42 CFR Part 110, \"Injury Tables\") publishes injury tables for public-health countermeasures, including one for smallpox countermeasures — there is no anthrax table under either program.";

export const VACCINE_INJURY_TABLE_STAMP = `As published at 42 CFR 100.3, retrieved ${RETRIEVED}. Amended by rulemaking — check ecfr.gov for the current version.`;
export const COUNTERMEASURES_TABLE_STAMP = `As published at 42 CFR 110.100, retrieved ${RETRIEVED}. Amended by rulemaking — check ecfr.gov for the current version.`;
