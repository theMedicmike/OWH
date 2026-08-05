// The "what happens next" engine — the single source of truth for the bridge
// between a built record and a filed VA claim. Used by the dashboard resume
// banner, the Connect-the-Dots journey, and the claim packet.
//
// Guardrail: this is documentation and wayfinding, not legal advice. Every VA
// form referenced here is a real, public VA form; we point veterans to the
// official VA.gov page and always route them to an accredited VSO.

export type VaForm = {
  number: string;
  name: string;
  url: string;
  blurb: string;
};

// Official VA.gov "About this form" pages — stable, public URLs.
export const VA_FORMS: Record<string, VaForm> = {
  intent: {
    number: "21-0966",
    name: "Intent to File",
    url: "https://www.va.gov/find-forms/about-form-21-0966/",
    blurb:
      "File this first. It locks in your effective date — the date your benefits can be paid from — and gives you up to a year to complete the full claim without losing that date.",
  },
  claim: {
    number: "21-526EZ",
    name: "Application for Disability Compensation",
    url: "https://www.va.gov/find-forms/about-form-21-526ez/",
    blurb:
      "The main disability claim. You can file it online at VA.gov or on paper. Your packet from this app is built to support it.",
  },
  buddy: {
    number: "21-10210",
    name: "Lay / Witness Statement",
    url: "https://www.va.gov/find-forms/about-form-21-10210/",
    blurb:
      "A buddy statement. A fellow service member who was there can corroborate an exposure or event. Your Battle buddies corroborations map to this.",
  },
  supplemental: {
    number: "20-0995",
    name: "Supplemental Claim",
    url: "https://www.va.gov/find-forms/about-form-20-0995/",
    blurb:
      "Denied? If you have new and relevant evidence — like a stronger record or a nexus letter — this reopens the claim. A denial is not the end.",
  },
  hlr: {
    number: "20-0996",
    name: "Higher-Level Review",
    url: "https://www.va.gov/find-forms/about-form-20-0996/",
    blurb:
      "Denied and you believe the VA made an error on the evidence they already had? A more senior reviewer takes a fresh look. No new evidence needed.",
  },
  board: {
    number: "10182",
    name: "Board Appeal",
    url: "https://www.va.gov/find-forms/about-form-10182/",
    blurb:
      "Take your appeal to a Veterans Law Judge at the Board of Veterans' Appeals. An accredited VSO or attorney can help you choose this lane.",
  },
};

// File a claim online at VA.gov (front door for 21-526EZ).
export const FILE_ONLINE_URL =
  "https://www.va.gov/disability/file-disability-claim-form-21-526ez/introduction";

// VA's official "find an accredited representative" (VSO) locator.
export const VSO_LOCATOR_URL =
  "https://www.va.gov/get-help-from-accredited-representative/find-rep/";

// ---------------------------------------------------------------------------
// Record completeness — the steps that turn "I served there and I feel like
// hell" into a claim-ready record. Single source of truth; the journey view
// and the dashboard both render from this.
// ---------------------------------------------------------------------------

export type RecordState = {
  hasService: boolean;
  locations: number;
  exposures: number;
  conditions: number;
  connectedConditions: number;
  corroborations: number;
  hasDD214: boolean;
  /** conditions the veteran has marked filed/granted/denied — the record's afterlife */
  filedConditions?: number;
};

export type RecordStep = {
  key: string;
  label: string;
  done: boolean;
  href: string;
  cta: string;
};

export function recordSteps(s: RecordState): RecordStep[] {
  return [
    { key: "service", label: "Service details", done: s.hasService, href: "/account", cta: "Add your branch and years" },
    { key: "locations", label: "Where you served", done: s.locations > 0, href: "/map", cta: "Map where you served" },
    { key: "exposures", label: "Exposures", done: s.exposures > 0, href: "/map", cta: "Document your exposures" },
    { key: "conditions", label: "Conditions", done: s.conditions > 0, href: "/health", cta: "Add the conditions you live with" },
    { key: "link", label: "A documented link", done: s.connectedConditions > 0, href: "/conditions", cta: "Connect a condition to an exposure" },
    { key: "corroboration", label: "Corroboration", done: s.corroborations > 0, href: "/buddies", cta: "Ask a battle buddy to corroborate" },
    { key: "dd214", label: "DD-214 on file", done: s.hasDD214, href: "/account", cta: "Upload your DD-214 (discharge papers)" },
    // The step after the packet: filing is the point of all of this, and
    // marking it filed is what lets the record keep walking with the claim.
    { key: "filed", label: "Claim filed", done: (s.filedConditions ?? 0) > 0, href: "/journey", cta: "When you file, mark the condition Filed" },
  ];
}

export function recordProgress(s: RecordState) {
  const steps = recordSteps(s);
  const done = steps.filter((x) => x.done);
  const remaining = steps.filter((x) => !x.done);
  const total = steps.length;
  const pct = Math.round((done.length / total) * 100);
  // "claim-ready" once the core evidence chain exists: a place, an exposure,
  // a condition, and a documented link between them.
  const claimReady =
    s.locations > 0 && s.exposures > 0 && s.conditions > 0 && s.connectedConditions > 0;
  return { steps, done: done.length, total, pct, remaining, next: remaining[0] ?? null, claimReady };
}

// ---------------------------------------------------------------------------
// Per-condition next action — turns the Logged → Filed → Rated tracker from a
// picture into a path. Given where a claim stands, what does the veteran do
// next, and with which real VA form.
// ---------------------------------------------------------------------------

export type ConditionNext = {
  headline: string;
  detail: string;
  form: VaForm | null;
  online?: boolean;
};

export function conditionNextAction(
  claimStatus: string,
  opts: { recognized: boolean } = { recognized: false }
): ConditionNext {
  switch (claimStatus) {
    case "filed":
      return {
        headline: "Filed — now track it",
        detail:
          "Your claim is in. Watch VA.gov for a C&P (Compensation & Pension) exam letter, and keep this record handy. Mark it Granted or Denied here as it moves.",
        form: null,
      };
    case "granted":
      return {
        headline: "Granted",
        detail:
          "This one's recognized. If your symptoms worsen later, you can file for an increased rating — your record here supports that too.",
        form: null,
      };
    case "denied":
      return {
        headline: "Denied isn't the end",
        detail:
          "You have three lanes: a Supplemental Claim if you have new evidence, a Higher-Level Review if you think the VA erred on the evidence they had, or a Board Appeal. An accredited VSO can help you pick the right one.",
        form: VA_FORMS.supplemental,
      };
    default:
      // not filed yet
      return {
        headline: opts.recognized ? "Recognized — file your claim" : "Ready to file",
        detail: opts.recognized
          ? "The VA already recognizes this pathway. File an Intent to File first to lock your effective date, then submit the claim. Bring your packet to a VSO."
          : "File an Intent to File first to lock your effective date, then submit the claim with your packet. A VSO can strengthen it before you send it.",
        form: VA_FORMS.intent,
      };
  }
}
