// TYPE-GATED EVIDENTIARY COPY — one mechanism, never a parallel flow.
//
// Council ruling (2026-08-11): reusing combat-presumption language for every
// incident type — or worse, building a SEPARATE capture path for MST/assault
// "because it's sensitive" — would have quietly reopened the standing
// MST scope-trap ruling (no dedicated MST flow, ever). The fix that protects
// the ruling: identical fields, identical chip-picker, identical database
// row shape for every incident type — only the SENTENCE explaining what
// counts as evidence changes, looked up by incident_class here.
//
// Expanded 2026-08-11 from 3 buckets to 5, following research into VA's own
// stressor taxonomy (38 CFR 3.304(f)), which turns out to have FIVE distinct
// evidentiary standards, not three:
//   (f)(2) combat — §1154(b), the strongest standard
//   (f)(3) fear of hostile/terrorist activity — a liberalized 2010 standard,
//          real but genuinely weaker than full combat presumption
//   (f)(4) POW/captivity — its own subsection with its own presumptive list
//   (f)(5) personal assault/MST — markers-based
//   everything else — the ordinary in-service-event standard
// Collapsing (f)(3) into (f)(2) would overstate the evidence a veteran
// actually has; collapsing POW into "combat" would miss its own presumptive-
// conditions list. Both are real legal distinctions, not just tone.
//
// Register (how gentle the copy feels) is free to vary. The evidentiary path
// (what fields exist, what's claimed as proof) must never vary by type.
import type { IncidentClass } from "./education";

export type EvidentiaryNote = {
  /** One line naming the legal basis, shown near the provenance selector. */
  headline: string;
  /** The fuller explanation — what this specific evidence pathway means. */
  body: string;
};

// (f)(2) Combat presumption — 38 U.S.C. §1154(b): for a veteran who engaged
// in combat, satisfactory lay evidence of an in-service injury is accepted as
// SUFFICIENT PROOF of service incurrence, even with no official record, if
// consistent with the circumstances of that service — rebuttable only by
// clear and convincing evidence to the contrary. "I remember it" is not weak
// evidence here; for many combat veterans it is legally enough on its own.
const COMBAT_NOTE: EvidentiaryNote = {
  headline: "Combat veterans get extra legal weight here (38 U.S.C. §1154(b)).",
  body:
    "If you engaged in combat, VA must accept your own honest account of an in-service injury as sufficient proof it happened — even with no paperwork — as long as it's consistent with the circumstances of your service. That's not a downgrade from \"I remember it\" to a lesser tier; for many combat veterans it can stand on its own. A Purple Heart, a DD-214 wound annotation (or a DD Form 215 to add one that was missed), a medevac or hospital record, or a buddy statement (VA Form 21-10210) all strengthen it further, but none of them are required to log this honestly.",
};

// (f)(3) Fear of hostile military or terrorist activity — a real but
// genuinely DIFFERENT (and slightly less absolute) standard than full combat
// presumption: added in 2010 specifically for veterans threatened by or
// exposed to hostile action without necessarily engaging in combat
// themselves (incoming fire, ambush threat, a base or convoy attack,
// friendly fire, responding to or witnessing a mass-casualty event).
const HOSTILE_ACTIVITY_NOTE: EvidentiaryNote = {
  headline: "A 2010 rule recognizes this even without direct combat (38 CFR §3.304(f)(3)).",
  body:
    "You don't have to have been in a firefight yourself for this to count. VA specifically recognizes fear of hostile or terrorist activity — incoming fire, an ambush threat, a base or convoy attack, friendly fire, responding to or witnessing casualties — as long as it's consistent with the places, types, and circumstances of your service and a VA clinician finds it adequate to support your diagnosis. Log it honestly; your own account carries real weight here.",
};

// (f)(4) Prisoner of war — its own CFR subsection with its own presumptive
// conditions list (38 CFR §3.309(c)), separate from ordinary combat.
const POW_NOTE: EvidentiaryNote = {
  headline: "Captivity has its own recognized status and presumptive conditions (38 CFR §3.304(f)(4)).",
  body:
    "VA treats former POW status as its own category, with its own list of presumptive conditions tied specifically to captivity (38 CFR §3.309(c)) — separate from the ordinary combat or exposure lists. If you were held captive, that status itself is significant; your VSO can confirm which presumptive conditions apply to your specific circumstances.",
};

// (f)(5) Markers-based pathway — MST and personal/physical assault claims
// are typically NOT documented at the time. VA looks instead for indirect
// "markers" — changes noted in records around when it happened.
const MARKERS_NOTE: EvidentiaryNote = {
  headline: "Most of this kind of claim has no official record — that's expected.",
  body:
    "VA knows this rarely gets written down at the time. Instead of requiring a report, VA looks for \"markers\" — indirect signs around when it happened: a sudden request for transfer, a drop in performance evaluations, unexplained changes in behavior, substance use, or a visit for anxiety or depression. You don't need to identify markers yourself — your VSO or an MST coordinator can help find them in records you already have. Every VA medical center has an MST coordinator, and care for MST-related conditions is free regardless of your disability rating or discharge status.",
};

// Ordinary evidence — no special presumption, just the normal standard: an
// in-service event, a current diagnosis, and (eventually) a medical nexus.
const ORDINARY_NOTE: EvidentiaryNote = {
  headline: "Log it the same honest way — no special form applies here.",
  body:
    "This kind of event doesn't carry a special evidence presumption, so the normal standard applies: what happened, roughly when, and anything that backs it up. Unit records, a medical record from the time, or a fellow service member's account (VA Form 21-10210) all help — but your own account, honestly dated, is still real evidence.",
};

// blast_ied, fire_burn, and combat_action are inherently combat-typical
// regardless of exact circumstance. training_injury is deliberately NOT
// included — most training injuries are stateside, not in-theater, and this
// app has no reliable way to tell the two apart from the incident class
// alone; defaulting it to the ordinary pathway is the honest choice rather
// than guessing at a combat connection it can't verify.
const COMBAT_CLASSES = new Set<IncidentClass>(["combat_action", "blast_ied", "fire_burn"]);
const HOSTILE_ACTIVITY_CLASSES = new Set<IncidentClass>(["fear_hostile_activity", "witnessed_death_injury", "friendly_fire"]);
const POW_CLASSES = new Set<IncidentClass>(["captivity_pow"]);
const MARKERS_CLASSES = new Set<IncidentClass>(["military_sexual_trauma", "physical_assault"]);

export function evidentiaryNoteFor(incidentClass: IncidentClass): EvidentiaryNote {
  if (COMBAT_CLASSES.has(incidentClass)) return COMBAT_NOTE;
  if (HOSTILE_ACTIVITY_CLASSES.has(incidentClass)) return HOSTILE_ACTIVITY_NOTE;
  if (POW_CLASSES.has(incidentClass)) return POW_NOTE;
  if (MARKERS_CLASSES.has(incidentClass)) return MARKERS_NOTE;
  return ORDINARY_NOTE;
}
