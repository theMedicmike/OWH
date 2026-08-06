// ─────────────────────────────────────────────────────────────────────────────
// THE ACCURACY GUARDRAIL.
//
// The 2026-08 verification swarm's closing finding: every ⚠️ MAINTENANCE note
// in this codebase assigned its review to nobody. Presumptive lists change —
// the PACT Act keeps adding conditions, and 38 CFR §3.309(e) is currently
// NARROWER than 38 U.S.C. §1116(a)(2). A list that silently goes stale
// generates WRONG claims, which is worse than generating none.
//
// This module is the single place the app states how current its legal content
// is, and it is printed in both deliverables so a VSO can judge it for
// themselves. If REVIEW_DUE passes without a review, the app says so out loud
// rather than quietly asserting stale law.
// ─────────────────────────────────────────────────────────────────────────────

/** Who is accountable for re-checking presumptive lists. NEVER leave blank. */
export const ACCURACY_OWNER = "Operation Whole Health — Michael Andrew Feller Jones, with an accredited VSO";

/** Last date a human verified the legal content against primary sources. */
export const LAST_REVIEWED = "2026-08-07";

/** Presumptive lists move; two reviews a year is the floor. */
export const REVIEW_DUE = "2027-02-07";

/** What was verified, so a reviewer knows where to start. */
export const REVIEW_SCOPE = [
  "38 U.S.C. §1116(a)(2) and §1116(d) — Agent Orange conditions and covered locations/dates",
  "38 U.S.C. §§1119–1120 — PACT Act covered locations/dates and conditions",
  "38 CFR §3.307(a)(6)–(7), §3.309(d)(e)(f), §3.311, §3.317, §3.320 series",
  "VA Duty MOS Noise Exposure Listing (enabled Aug 2026 — verified by an accredited VSO)",
  "VA form numbers, titles and about-form URLs",
];

export function isReviewOverdue(now: Date = new Date()): boolean {
  return now > new Date(REVIEW_DUE + "T00:00:00Z");
}

/** One currency string, printed in the packet, the PDF and the trust page —
 *  the audit found three different ones claiming three different dates. */
export function currencyLine(now: Date = new Date()): string {
  const base = `Legal content last verified against primary sources on ${LAST_REVIEWED} by ${ACCURACY_OWNER}; next review due ${REVIEW_DUE}.`;
  return isReviewOverdue(now)
    ? `${base} ⚠️ THAT REVIEW IS NOW OVERDUE — treat every presumptive statement here as possibly out of date and confirm each one with an accredited VSO before relying on it.`
    : `${base} Presumptive lists change — confirm current status with an accredited VSO.`;
}
