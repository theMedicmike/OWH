// THE INJURY LIBRARY — evidence-graded, citation-driven, procedural only.
//
// Same discipline as lib/shotlibrary.ts and lib/citations.ts: name the real
// DBQ, the real diagnostic code, the real CFR section — never a diagnosis,
// never a severity label, never a rating or a dollar figure. What VA asks
// for, not what your injury means.
//
// Scoped narrowly on purpose (council ruling 2026-08-11): four entries for
// the first mockup, not the full taxonomy. More get added after Michael
// reacts to what's actually here.
export type InjuryEntry = {
  slug: string;
  name: string;
  /** One line — how a veteran would describe it, not a clinical label. */
  hook: string;
  /** Which incident_class values this entry is relevant to. */
  incidentClasses: string[];
  /** "What VA usually asks for" — the named DBQ(s), who can complete them. */
  evidence: string;
  /** The specific diagnostic-code / rating-structure fact worth knowing. */
  ratingStructure: string;
  /** Commonly-associated or secondary conditions worth also documenting. Never a suggestion to file — a citation-backed fact only. */
  associatedNote: string;
  citations: { label: string; detail: string }[];
};

const RETRIEVED = "2026-08-11";

export const INJURY_LIBRARY: InjuryEntry[] = [
  {
    slug: "blast-tbi",
    name: "Blast exposure / TBI",
    hook: "The concussion nobody wrote down because you walked away from it.",
    incidentClasses: ["blast_ied", "fire_burn", "training_injury", "combat_action", "aircraft_mishap", "electrical_injury", "vehicle_accident"],
    evidence:
      "The exam VA uses is called the Initial Evaluation of Residuals of Traumatic Brain Injury DBQ. Unlike most of VA's 70-plus DBQs, this one can only be completed by a VA-trained or VA-certified examiner — a private doctor's version isn't accepted as a substitute. If you've already paid for a private TBI evaluation hoping it would count, ask your VSO whether it still needs to be redone by a VA-credentialed examiner.",
    ratingStructure:
      "TBI is rated under Diagnostic Code 8045 across ten separate facets — things like memory and judgment, motor function, vision-spatial skills, mood, and consciousness. It is never one number. Any residual that has its own diagnosis — headaches, hearing loss, seizures, a sleep disorder, a mood disorder — gets evaluated separately under its own diagnostic code, and the results are combined. In practice, a single blast event usually becomes several separate claims, each needing its own evidence, not one.",
    associatedNote:
      "Headaches, hearing loss and tinnitus, sleep problems, and mood or memory changes are the residuals most often claimed alongside a TBI event. Each still needs its own current diagnosis to be claimed — this app can only show you the association, never diagnose one.",
    citations: [
      { label: "38 CFR §4.124a, Diagnostic Code 8045", detail: "Traumatic Brain Injury — the ten-facet rating structure; residuals with a separate diagnosis are rated separately, then combined." },
      { label: "TBI DBQ (Initial Evaluation of Residuals of TBI)", detail: `Restricted to VA-trained/certified examiners; not privately completable. Retrieved ${RETRIEVED}.` },
    ],
  },
  {
    slug: "amputation-loss-of-limb",
    name: "Amputation / loss of limb",
    hook: "What's left, and what it takes to still call it a leg.",
    incidentClasses: ["blast_ied", "vehicle_accident", "fire_burn", "combat_action", "industrial_accident", "aircraft_mishap"],
    evidence:
      "There's no single \"amputation form.\" The exam depends on which limb or joint is involved — VA has separate DBQs for Knee and Lower Leg, Hip and Thigh, Shoulder and Arm, and Hand and Fingers. Even short of an actual amputation, \"loss of use\" is claimable: the examiner is specifically asked whether the remaining limb's function is so diminished that it serves no better purpose than an amputation with a prosthesis would.",
    ratingStructure:
      "Actual amputations are rated under Diagnostic Codes 5120–5125 (arm/hand) or 5160–5170 (leg/foot). A rule called the Amputation Rule (38 CFR §4.68) caps what a limb's combined rating can reach at whatever a straight amputation at that level would earn — worth knowing before assuming every related condition simply adds on top.",
    associatedNote:
      "Phantom limb pain and stump-related skin or nerve conditions are the immediate, well-documented companions to an amputation claim. Longer-term, added strain on the opposite limb or joint — a bad hip or knee on the \"good\" side, showing up years later from changed gait — is a recognized secondary condition under 38 CFR §3.310. It doesn't have to be claimed the same day as the amputation; it can be added to the record whenever it starts.",
    citations: [
      { label: "38 CFR §4.71a, DC 5120–5125 / 5160–5170", detail: "Amputation ratings by limb and level." },
      { label: "38 CFR §4.68", detail: "The Amputation Rule — caps a limb's combined rating." },
      { label: "38 CFR §3.310", detail: "Secondary service connection — a later condition caused or aggravated by an already-connected one." },
      { label: "VA limb DBQs", detail: `Knee and Lower Leg, Hip and Thigh, Shoulder and Arm, Hand and Fingers — each asks whether remaining function equals amputation with prosthesis. Retrieved ${RETRIEVED}.` },
    ],
  },
  {
    slug: "hearing-damage",
    name: "Hearing damage / blast or ordnance noise",
    hook: "The ringing that started on the range and never fully left.",
    incidentClasses: ["noise_acoustic", "blast_ied", "combat_action", "aircraft_mishap", "diving_injury"],
    evidence:
      "VA hearing exams follow one specific protocol: a state-licensed audiologist, using the Maryland CNC controlled speech-discrimination test plus puretone audiometry in a sound-isolated booth that meets ANSI standards, scored at 500/1000/2000/3000/4000 Hz. A general hearing check at a walk-in clinic or a hearing-aid retailer will not meet this standard — if you've had one done that way, it likely needs to be redone through the correct exam.",
    ratingStructure:
      "Hearing loss and tinnitus are each their own diagnostic entity and are typically claimed together when both are present, but they are evaluated on separate criteria under 38 CFR §4.85.",
    associatedNote:
      "Tinnitus and hearing loss commonly appear together after the same noise exposure, but each needs to be logged and diagnosed on its own — one does not automatically cover the other in a claim.",
    citations: [
      { label: "38 CFR §4.85", detail: "Evaluation of hearing impairment — the Maryland CNC + puretone protocol." },
      { label: "Hearing Loss and Tinnitus DBQ", detail: `Requires a state-licensed audiologist; not a general hearing screening. Retrieved ${RETRIEVED}.` },
    ],
  },
  {
    slug: "burns-disfigurement",
    name: "Burns / disfigurement",
    hook: "The scar, and whatever it took with it.",
    incidentClasses: ["fire_burn", "blast_ied", "electrical_injury", "chemical_incident", "combat_action"],
    evidence:
      "Burn and scar claims use the Scars/Disfigurement DBQ. Where a burn also destroyed function — vision from an eyelid burn, grip from a hand burn, hearing from an ear — that functional loss is evaluated under its own separate diagnostic code, not folded into the scar rating.",
    ratingStructure:
      "Facial, head, and neck scarring is rated under Diagnostic Code 7800 based on specific, counted characteristics of disfigurement (things like tissue loss and distortion). This is deliberately a \"rated twice\" pattern: disfigurement and any resulting loss of function are evaluated separately, then combined — claiming only one half under-documents what actually happened.",
    associatedNote:
      "If a burn affected a joint's range of motion, an eye, or hearing, that functional loss is a separate, real thing to document alongside the scar itself — not a lesser detail of it.",
    citations: [
      { label: "38 CFR §4.79, Diagnostic Code 7800", detail: "Burn scar and disfigurement of the head, face, or neck." },
      { label: "Scars/Disfigurement DBQ", detail: `Function loss from a burn is evaluated separately from the scar itself. Retrieved ${RETRIEVED}.` },
    ],
  },
];

export const INJURY_BY_SLUG: Record<string, InjuryEntry> = Object.fromEntries(
  INJURY_LIBRARY.map((i) => [i.slug, i]),
);

export function injuryEntriesFor(incidentClass: string): InjuryEntry[] {
  return INJURY_LIBRARY.filter((i) => i.incidentClasses.includes(incidentClass));
}
