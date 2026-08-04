// ─────────────────────────────────────────────────────────────────────────────
// THE CONDITION CATALOG
//
// What a veteran can actually be living with — grouped by body system so a long
// list still scans as tappable pills. The old list was 15 items and did not
// include tinnitus, the single most-claimed VA disability; a veteran whose
// condition wasn't on it had nowhere to put it.
//
// Each entry carries:
//   exposures  — exposure classes with a DOCUMENTED association (drives the
//                "connect the dots" line). Empty is normal and fine.
//   programs   — VA programs where this appears on a presumptive list. This
//                NEVER means "you qualify" — dates, locations and service
//                details decide that, and only VA decides it. It means
//                "worth asking an accredited VSO about."
//   link       — 'place'  connects to WHERE you were (air, water, soil)
//                'event'  connects to WHAT HAPPENED (blast, noise, injury, trauma)
//                'both'
//                This is the honest fix for the dead end: tinnitus, PTSD, TBI
//                and bad backs will never match a map pin, and the app should
//                say so instead of showing "no match" like a rejection.
//
// ⚠️ MAINTENANCE: presumptive lists change (the PACT Act keeps adding). A stale
// list quietly points veterans at the wrong questions. Review on a set cadence
// with an accredited VSO. This is documentation, never advice, never a promise.
// ─────────────────────────────────────────────────────────────────────────────

export type LinkType = "place" | "event" | "both";

export type ConditionDef = {
  label: string;
  system: string;
  exposures: string[];
  programs?: string[];
  link: LinkType;
  /** shown under the pill in search results to disambiguate plain-language names */
  alt?: string;
};

export const PROGRAM_LABEL: Record<string, string> = {
  pact: "PACT Act (burn pits & particulate matter)",
  agent_orange: "Agent Orange",
  lejeune: "Camp Lejeune water",
  gulf_war: "Gulf War illness",
  radiation: "Radiation exposure",
};

// Body systems, in the order a person thinks about their own body — breathing
// and pain first, because that's what people lead with.
export const SYSTEMS = [
  "Breathing & sinuses",
  "Hearing",
  "Bones, joints & muscles",
  "Head & nerves",
  "Mental health",
  "Sleep",
  "Heart & circulation",
  "Stomach & digestion",
  "Hormones & metabolism",
  "Kidneys & urinary",
  "Skin",
  "Immune & blood",
  "Cancer",
  "Reproductive & sexual health",
  "Vision",
  "Whole-body symptoms",
] as const;

export const CONDITIONS: ConditionDef[] = [
  // ── Breathing & sinuses ──
  { label: "Asthma", system: "Breathing & sinuses", exposures: ["burn_pit", "particulate", "chemical_solvent", "pfas_afff"], programs: ["pact"], link: "place" },
  { label: "Chronic sinusitis", system: "Breathing & sinuses", exposures: ["burn_pit", "particulate", "chemical_solvent"], programs: ["pact"], link: "place" },
  { label: "Chronic rhinitis", system: "Breathing & sinuses", exposures: ["burn_pit", "particulate", "chemical_solvent"], programs: ["pact"], link: "place", alt: "constant congestion, runny nose" },
  { label: "COPD", system: "Breathing & sinuses", exposures: ["burn_pit", "particulate"], programs: ["pact"], link: "place", alt: "chronic obstructive pulmonary disease" },
  { label: "Chronic bronchitis", system: "Breathing & sinuses", exposures: ["burn_pit", "particulate"], programs: ["pact"], link: "place" },
  { label: "Emphysema", system: "Breathing & sinuses", exposures: ["burn_pit", "particulate"], programs: ["pact"], link: "place" },
  { label: "Constrictive bronchiolitis", system: "Breathing & sinuses", exposures: ["burn_pit", "particulate"], programs: ["pact"], link: "place", alt: "obliterative bronchiolitis" },
  { label: "Pulmonary fibrosis", system: "Breathing & sinuses", exposures: ["burn_pit", "particulate", "asbestos_silica"], programs: ["pact"], link: "place", alt: "scarring in the lungs" },
  { label: "Interstitial lung disease", system: "Breathing & sinuses", exposures: ["burn_pit", "particulate", "asbestos_silica"], programs: ["pact"], link: "place" },
  { label: "Sarcoidosis", system: "Breathing & sinuses", exposures: ["burn_pit", "particulate"], programs: ["pact"], link: "place" },
  { label: "Asbestosis", system: "Breathing & sinuses", exposures: ["asbestos_silica"], link: "place" },
  { label: "Shortness of breath (undiagnosed)", system: "Breathing & sinuses", exposures: ["burn_pit", "particulate"], programs: ["gulf_war"], link: "place" },

  // ── Hearing — the most-claimed VA disability, and it was missing entirely ──
  { label: "Tinnitus", system: "Hearing", exposures: [], link: "event", alt: "ringing in the ears" },
  { label: "Hearing loss", system: "Hearing", exposures: [], link: "event" },
  { label: "Vertigo / balance problems", system: "Hearing", exposures: [], link: "event" },

  // ── Bones, joints & muscles — the most-claimed category overall ──
  { label: "Back pain / degenerative disc", system: "Bones, joints & muscles", exposures: [], link: "event" },
  { label: "Neck pain / cervical strain", system: "Bones, joints & muscles", exposures: [], link: "event" },
  { label: "Knee pain / instability", system: "Bones, joints & muscles", exposures: [], link: "event" },
  { label: "Shoulder pain / rotator cuff", system: "Bones, joints & muscles", exposures: [], link: "event" },
  { label: "Hip pain", system: "Bones, joints & muscles", exposures: [], link: "event" },
  { label: "Ankle or foot pain", system: "Bones, joints & muscles", exposures: [], link: "event", alt: "plantar fasciitis, flat feet" },
  { label: "Arthritis", system: "Bones, joints & muscles", exposures: [], link: "event" },
  { label: "Chronic muscle or joint pain", system: "Bones, joints & muscles", exposures: ["gulf_war_agent"], programs: ["gulf_war"], link: "both" },
  { label: "Fibromyalgia", system: "Bones, joints & muscles", exposures: ["gulf_war_agent"], programs: ["gulf_war"], link: "both" },

  // ── Head & nerves ──
  { label: "Traumatic brain injury (TBI)", system: "Head & nerves", exposures: [], link: "event", alt: "blast exposure, concussion" },
  { label: "Migraines / chronic headaches", system: "Head & nerves", exposures: ["gulf_war_agent", "chemical_solvent"], programs: ["gulf_war"], link: "both" },
  { label: "Peripheral neuropathy", system: "Head & nerves", exposures: ["heavy_metal", "chemical_solvent", "nerve_agent", "pesticide"], programs: ["agent_orange"], link: "both", alt: "numbness, tingling, burning in hands or feet" },
  { label: "Memory or concentration problems", system: "Head & nerves", exposures: ["heavy_metal", "nerve_agent", "gulf_war_agent"], programs: ["gulf_war"], link: "both" },
  { label: "Parkinson's disease", system: "Head & nerves", exposures: ["pesticide", "chemical_solvent", "water_contamination"], programs: ["agent_orange", "lejeune"], link: "place" },
  { label: "Parkinsonism / tremor", system: "Head & nerves", exposures: ["pesticide", "chemical_solvent", "heavy_metal"], programs: ["agent_orange"], link: "place" },
  { label: "ALS (Lou Gehrig's disease)", system: "Head & nerves", exposures: [], link: "both" },
  { label: "Seizure disorder", system: "Head & nerves", exposures: [], link: "event" },

  // ── Mental health ──
  { label: "PTSD", system: "Mental health", exposures: [], link: "event", alt: "post-traumatic stress" },
  { label: "Depression", system: "Mental health", exposures: [], link: "event" },
  { label: "Anxiety", system: "Mental health", exposures: [], link: "event" },
  { label: "Panic attacks", system: "Mental health", exposures: [], link: "event" },
  { label: "Military sexual trauma (MST) related condition", system: "Mental health", exposures: [], link: "event" },
  { label: "Substance use / alcohol", system: "Mental health", exposures: [], link: "event" },
  { label: "Adjustment disorder", system: "Mental health", exposures: [], link: "event" },

  // ── Sleep ──
  { label: "Sleep apnea", system: "Sleep", exposures: [], link: "both" },
  { label: "Insomnia", system: "Sleep", exposures: ["gulf_war_agent"], programs: ["gulf_war"], link: "both" },
  { label: "Nightmares / night terrors", system: "Sleep", exposures: [], link: "event" },

  // ── Heart & circulation ──
  { label: "High blood pressure", system: "Heart & circulation", exposures: ["heavy_metal", "chemical_solvent", "pesticide"], programs: ["agent_orange"], link: "both", alt: "hypertension" },
  { label: "Ischemic heart disease", system: "Heart & circulation", exposures: ["pesticide"], programs: ["agent_orange"], link: "place", alt: "coronary artery disease" },
  { label: "Heart attack / cardiac event", system: "Heart & circulation", exposures: ["pesticide"], programs: ["agent_orange"], link: "both" },
  { label: "Stroke", system: "Heart & circulation", exposures: [], link: "both" },
  { label: "High cholesterol", system: "Heart & circulation", exposures: [], link: "both" },

  // ── Stomach & digestion ──
  { label: "IBS / functional GI disorder", system: "Stomach & digestion", exposures: ["gulf_war_agent", "water_contamination"], programs: ["gulf_war"], link: "both", alt: "irritable bowel" },
  { label: "GERD / acid reflux", system: "Stomach & digestion", exposures: [], link: "both" },
  { label: "Ulcers", system: "Stomach & digestion", exposures: [], link: "both" },
  { label: "Chronic diarrhea or constipation", system: "Stomach & digestion", exposures: ["gulf_war_agent", "water_contamination"], programs: ["gulf_war"], link: "both" },
  { label: "Liver disease", system: "Stomach & digestion", exposures: ["chemical_solvent", "water_contamination", "heavy_metal"], programs: ["lejeune"], link: "place" },

  // ── Hormones & metabolism ──
  { label: "Type 2 diabetes", system: "Hormones & metabolism", exposures: ["pesticide"], programs: ["agent_orange"], link: "place" },
  { label: "Thyroid disorder", system: "Hormones & metabolism", exposures: ["radiation", "chemical_solvent", "pesticide", "pfas_afff"], programs: ["agent_orange", "pact"], link: "place", alt: "hypothyroidism, Hashimoto's" },
  { label: "Low testosterone", system: "Hormones & metabolism", exposures: [], link: "both" },
  { label: "Unexplained weight change", system: "Hormones & metabolism", exposures: ["gulf_war_agent"], programs: ["gulf_war"], link: "both" },

  // ── Kidneys & urinary ──
  { label: "Kidney disease", system: "Kidneys & urinary", exposures: ["heavy_metal", "radiation", "pfas_afff", "water_contamination"], programs: ["lejeune"], link: "place" },
  { label: "Kidney stones", system: "Kidneys & urinary", exposures: [], link: "both" },
  { label: "Bladder problems", system: "Kidneys & urinary", exposures: ["water_contamination"], programs: ["lejeune"], link: "place" },

  // ── Skin ──
  { label: "Chronic rash or skin condition", system: "Skin", exposures: ["pesticide", "chemical_solvent", "gulf_war_agent"], programs: ["gulf_war"], link: "place" },
  { label: "Chloracne", system: "Skin", exposures: ["pesticide"], programs: ["agent_orange"], link: "place" },
  { label: "Eczema or psoriasis", system: "Skin", exposures: [], link: "both" },
  { label: "Scars or burns", system: "Skin", exposures: [], link: "event" },

  // ── Immune & blood ──
  { label: "Autoimmune disorder", system: "Immune & blood", exposures: ["chemical_solvent", "pesticide", "heavy_metal", "asbestos_silica"], link: "place", alt: "lupus, RA, and others" },
  { label: "Chronic fatigue syndrome", system: "Immune & blood", exposures: ["gulf_war_agent"], programs: ["gulf_war"], link: "both" },
  { label: "Anemia", system: "Immune & blood", exposures: ["heavy_metal", "chemical_solvent"], link: "both" },
  { label: "Aplastic anemia / MDS", system: "Immune & blood", exposures: ["chemical_solvent", "water_contamination", "radiation"], programs: ["lejeune"], link: "place" },
  { label: "MGUS", system: "Immune & blood", exposures: ["pesticide"], programs: ["agent_orange"], link: "place", alt: "monoclonal gammopathy" },
  { label: "AL amyloidosis", system: "Immune & blood", exposures: ["pesticide"], programs: ["agent_orange"], link: "place" },

  // ── Cancer ──
  { label: "Respiratory or lung cancer", system: "Cancer", exposures: ["burn_pit", "radiation", "chemical_solvent", "particulate", "asbestos_silica"], programs: ["pact", "agent_orange"], link: "place" },
  { label: "Head or neck cancer", system: "Cancer", exposures: ["burn_pit", "particulate"], programs: ["pact"], link: "place" },
  { label: "Gastrointestinal cancer", system: "Cancer", exposures: ["burn_pit", "particulate"], programs: ["pact"], link: "place" },
  { label: "Kidney cancer", system: "Cancer", exposures: ["burn_pit", "water_contamination", "heavy_metal"], programs: ["pact", "lejeune"], link: "place" },
  { label: "Bladder cancer", system: "Cancer", exposures: ["water_contamination", "pesticide"], programs: ["agent_orange", "lejeune"], link: "place" },
  { label: "Liver cancer", system: "Cancer", exposures: ["water_contamination", "chemical_solvent"], programs: ["lejeune"], link: "place" },
  { label: "Pancreatic cancer", system: "Cancer", exposures: ["burn_pit", "particulate"], programs: ["pact"], link: "place" },
  { label: "Brain cancer", system: "Cancer", exposures: ["burn_pit", "radiation"], programs: ["pact"], link: "place" },
  { label: "Melanoma", system: "Cancer", exposures: ["burn_pit"], programs: ["pact"], link: "place" },
  { label: "Prostate cancer", system: "Cancer", exposures: ["pesticide"], programs: ["agent_orange"], link: "place" },
  { label: "Multiple myeloma", system: "Cancer", exposures: ["pesticide", "water_contamination"], programs: ["agent_orange", "lejeune"], link: "place" },
  { label: "Non-Hodgkin's lymphoma", system: "Cancer", exposures: ["pesticide", "water_contamination"], programs: ["agent_orange", "lejeune"], link: "place" },
  { label: "Hodgkin's disease", system: "Cancer", exposures: ["pesticide"], programs: ["agent_orange"], link: "place" },
  { label: "Leukemia", system: "Cancer", exposures: ["chemical_solvent", "water_contamination", "radiation"], programs: ["agent_orange", "lejeune"], link: "place" },
  { label: "Soft tissue sarcoma", system: "Cancer", exposures: ["pesticide"], programs: ["agent_orange"], link: "place" },
  { label: "Reproductive cancer", system: "Cancer", exposures: ["burn_pit", "particulate"], programs: ["pact"], link: "place" },
  { label: "Breast cancer", system: "Cancer", exposures: ["water_contamination", "radiation"], programs: ["lejeune"], link: "place" },
  { label: "Thyroid cancer", system: "Cancer", exposures: ["radiation"], programs: ["radiation"], link: "place" },
  { label: "Other cancer", system: "Cancer", exposures: ["burn_pit", "radiation", "pesticide", "chemical_solvent", "heavy_metal", "pfas_afff"], link: "place" },

  // ── Reproductive & sexual health ──
  { label: "Infertility", system: "Reproductive & sexual health", exposures: ["chemical_solvent", "pesticide", "radiation", "pfas_afff"], link: "both" },
  { label: "Erectile dysfunction", system: "Reproductive & sexual health", exposures: [], link: "both" },
  { label: "Menstrual disorders", system: "Reproductive & sexual health", exposures: ["gulf_war_agent", "chemical_solvent"], programs: ["gulf_war"], link: "both" },
  { label: "Pregnancy loss or birth defect in a child", system: "Reproductive & sexual health", exposures: ["pesticide", "water_contamination", "chemical_solvent"], programs: ["agent_orange", "lejeune"], link: "place" },

  // ── Vision ──
  { label: "Vision loss or eye injury", system: "Vision", exposures: [], link: "event" },
  { label: "Light sensitivity", system: "Vision", exposures: [], link: "event" },

  // ── Whole-body symptoms (Gulf War undiagnosed illness lives here) ──
  { label: "Chronic fatigue", system: "Whole-body symptoms", exposures: ["gulf_war_agent"], programs: ["gulf_war"], link: "both" },
  { label: "Undiagnosed symptoms that won't go away", system: "Whole-body symptoms", exposures: ["gulf_war_agent"], programs: ["gulf_war"], link: "both", alt: "Gulf War illness pattern" },
];

export const CONDITION_BY_LABEL: Record<string, ConditionDef> =
  Object.fromEntries(CONDITIONS.map((c) => [c.label, c]));

export function conditionsBySystem(): { system: string; items: ConditionDef[] }[] {
  return SYSTEMS.map((system) => ({
    system,
    items: CONDITIONS.filter((c) => c.system === system),
  })).filter((g) => g.items.length > 0);
}

// Substring search across label + alt so "ringing" finds Tinnitus and
// "congestion" finds chronic rhinitis.
export function searchConditions(q: string): ConditionDef[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return CONDITIONS.filter(
    (c) => c.label.toLowerCase().includes(s) || (c.alt ?? "").toLowerCase().includes(s),
  ).slice(0, 12);
}

// Free-text entries are kept verbatim and never coerced into a catalog item;
// they simply carry no documented associations.
export function defFor(label: string): ConditionDef | null {
  return CONDITION_BY_LABEL[label] ?? null;
}
