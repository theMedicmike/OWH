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
  pact: "the PACT Act (burn pits & particulate matter)",
  agent_orange: "Agent Orange / tactical herbicides",
  lejeune: "Camp Lejeune / MCAS New River water (30+ days, Aug 1 1953 – Dec 31 1987)",
  // Cost-free CARE under 38 CFR §17.400 — a different list and a different
  // benefit from the eight disability presumptives at §3.309(f). Conflating
  // the two is the classic Camp Lejeune error.
  lejeune_healthcare: "Camp Lejeune health care (cost-free care — not disability compensation)",
  gulf_war: "the Gulf War presumptives (38 CFR §3.317)",
  radiation: "radiation-risk activity presumptives (38 CFR §3.309(d))",
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
  { label: "Asthma", system: "Breathing & sinuses", exposures: ["burn_pit", "particulate", "chemical_solvent", "pfas_afff"], programs: ["pact"], link: "place", alt: "presumptive only if DIAGNOSED AFTER SERVICE — 38 U.S.C. §1120(b)(1)" },
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
  { label: "Peripheral neuropathy (early-onset)", system: "Head & nerves", exposures: ["heavy_metal", "chemical_solvent", "nerve_agent", "pesticide"], programs: ["agent_orange"], link: "both", alt: "numbness, tingling, burning — began within a YEAR of exposure (the window is part of the rule)" },
  { label: "Peripheral neuropathy (later onset)", system: "Head & nerves", exposures: ["heavy_metal", "chemical_solvent", "nerve_agent"], link: "both", alt: "numbness, tingling, burning in hands or feet" },
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
  // §3.309(f) lists LIVER CANCER. Hepatic steatosis is §17.400 health care.
  { label: "Hepatic steatosis (fatty liver)", system: "Stomach & digestion", exposures: ["chemical_solvent", "water_contamination"], programs: ["lejeune_healthcare"], link: "place" },
  { label: "Liver disease (other)", system: "Stomach & digestion", exposures: ["chemical_solvent", "water_contamination", "heavy_metal"], link: "both" },

  // ── Hormones & metabolism ──
  { label: "Type 2 diabetes", system: "Hormones & metabolism", exposures: ["pesticide"], programs: ["agent_orange"], link: "place" },
  // VA's herbicide list names HYPOTHYROIDISM alone — not hyperthyroidism,
  // Graves', goiter, nodules, or euthyroid Hashimoto's. No thyroid condition
  // is on the PACT Act list at all.
  { label: "Hypothyroidism (underactive thyroid)", system: "Hormones & metabolism", exposures: ["chemical_solvent", "pesticide", "pfas_afff"], programs: ["agent_orange"], link: "place", alt: "Hashimoto's causing low thyroid" },
  { label: "Other thyroid disorder", system: "Hormones & metabolism", exposures: ["chemical_solvent", "pfas_afff"], link: "both", alt: "hyperthyroid, Graves', goiter" },
  { label: "Thyroid nodules", system: "Hormones & metabolism", exposures: ["radiation"], link: "both", alt: "non-malignant thyroid nodular disease" },
  { label: "Low testosterone", system: "Hormones & metabolism", exposures: [], link: "both" },
  { label: "Unexplained weight change", system: "Hormones & metabolism", exposures: ["gulf_war_agent"], programs: ["gulf_war"], link: "both" },

  // ── Kidneys & urinary ──
  // §3.309(f) lists KIDNEY CANCER. Non-cancer renal toxicity is on the Camp
  // Lejeune HEALTH CARE list (§17.400) — care, not compensation. DU kidney
  // injury is chemical heavy-metal nephrotoxicity, not radiation.
  { label: "Kidney disease", system: "Kidneys & urinary", exposures: ["heavy_metal", "pfas_afff", "water_contamination"], programs: ["lejeune_healthcare"], link: "place" },
  { label: "Kidney stones", system: "Kidneys & urinary", exposures: [], link: "both" },
  // Non-cancer bladder conditions are on neither §3.309(f) nor §17.400.
  { label: "Bladder problems", system: "Kidneys & urinary", exposures: ["water_contamination"], link: "both" },

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
  // §3.309(e) covers CHRONIC B-CELL leukemias only; §3.309(f) says "adult
  // leukemia". A bare "Leukemia" must never generate an Agent Orange contention.
  { label: "Chronic B-cell leukemia (CLL, hairy-cell)", system: "Cancer", exposures: ["chemical_solvent", "water_contamination", "pesticide"], programs: ["agent_orange", "lejeune", "pact"], link: "place" },
  { label: "Leukemia (other type)", system: "Cancer", exposures: ["chemical_solvent", "water_contamination", "radiation"], programs: ["lejeune", "pact"], link: "place" },
  { label: "Soft tissue sarcoma", system: "Cancer", exposures: ["pesticide"], programs: ["agent_orange"], link: "place" },
  { label: "Reproductive cancer", system: "Cancer", exposures: ["burn_pit", "particulate"], programs: ["pact"], link: "place" },
  // Breast cancer is NOT on §3.309(f); it is §17.400 health care. VA lists
  // female breast cancer under PACT reproductive cancers.
  { label: "Breast cancer", system: "Cancer", exposures: ["burn_pit", "particulate", "water_contamination", "radiation"], programs: ["lejeune_healthcare", "pact"], link: "place" },
  { label: "Thyroid cancer", system: "Cancer", exposures: ["radiation"], programs: ["radiation"], link: "place" },
  { label: "Other cancer", system: "Cancer", exposures: ["burn_pit", "radiation", "pesticide", "chemical_solvent", "heavy_metal", "pfas_afff"], link: "place" },

  // ── Reproductive & sexual health ──
  { label: "Infertility", system: "Reproductive & sexual health", exposures: ["chemical_solvent", "pesticide", "radiation", "pfas_afff"], link: "both" },
  { label: "Erectile dysfunction", system: "Reproductive & sexual health", exposures: [], link: "both" },
  { label: "Menstrual disorders", system: "Reproductive & sexual health", exposures: ["gulf_war_agent", "chemical_solvent"], programs: ["gulf_war"], link: "both" },
  { label: "Pregnancy loss", system: "Reproductive & sexual health", exposures: ["water_contamination", "chemical_solvent"], programs: ["lejeune_healthcare"], link: "place", alt: "miscarriage — on VA's Camp Lejeune health-care list" },
  // A child's birth-defect benefit belongs to the CHILD, not the veteran's own
  // claim — 38 U.S.C. §§1805/1815, 38 CFR §§3.814/3.815, VA Form 21-0304.
  { label: "Birth defect in a child", system: "Reproductive & sexual health", exposures: ["pesticide", "water_contamination", "chemical_solvent"], link: "place", alt: "this benefit belongs to the child — ask your VSO about VA Form 21-0304" },

  // ── Vision ──
  { label: "Vision loss or eye injury", system: "Vision", exposures: [], link: "event" },
  { label: "Light sensitivity", system: "Vision", exposures: [], link: "event" },

  // ── Whole-body symptoms (Gulf War undiagnosed illness lives here) ──
  { label: "Chronic fatigue", system: "Whole-body symptoms", exposures: ["gulf_war_agent"], programs: ["gulf_war"], link: "both" },
  { label: "Undiagnosed symptoms that won't go away", system: "Whole-body symptoms", exposures: ["gulf_war_agent"], programs: ["gulf_war"], link: "both", alt: "Gulf War illness pattern" },

  // ───────────────────────────────────────────────────────────────────────────
  // EXPANDED CAPTURE SET.
  // A veteran must be able to find what they live with — if it isn't findable,
  // it doesn't get recorded, and the record is the whole product.
  //
  // DELIBERATE: these carry NO `programs` tags and minimal `exposures`. A
  // presumptive tag is a LEGAL status claim; asserting one without primary-
  // source verification is the most dangerous thing this file could do. These
  // exist so the condition can be RECORDED. Associations get added only after
  // an accuracy audit confirms them.
  // ───────────────────────────────────────────────────────────────────────────

  // ── Breathing & sinuses ──
  { label: "Allergic rhinitis", system: "Breathing & sinuses", exposures: [], link: "both", alt: "seasonal allergies, hay fever" },
  { label: "Deviated septum", system: "Breathing & sinuses", exposures: [], link: "event" },
  { label: "Bronchiectasis", system: "Breathing & sinuses", exposures: [], link: "both" },
  { label: "Pulmonary hypertension", system: "Breathing & sinuses", exposures: [], link: "both" },
  { label: "Chronic cough", system: "Breathing & sinuses", exposures: [], link: "both" },
  { label: "Vocal cord or throat problems", system: "Breathing & sinuses", exposures: [], link: "both", alt: "hoarseness, laryngitis" },

  // ── Hearing ──
  { label: "Ear pain or recurring ear infections", system: "Hearing", exposures: [], link: "event" },
  { label: "Meniere's disease", system: "Hearing", exposures: [], link: "event" },
  { label: "Perforated eardrum", system: "Hearing", exposures: [], link: "event", alt: "ruptured eardrum, blast" },

  // ── Bones, joints & muscles ──
  { label: "Wrist or hand pain", system: "Bones, joints & muscles", exposures: [], link: "event" },
  { label: "Elbow pain", system: "Bones, joints & muscles", exposures: [], link: "event", alt: "tennis elbow" },
  { label: "Carpal tunnel syndrome", system: "Bones, joints & muscles", exposures: [], link: "event" },
  { label: "Sciatica / radiculopathy", system: "Bones, joints & muscles", exposures: [], link: "event", alt: "shooting leg pain, pinched nerve" },
  { label: "Degenerative joint disease", system: "Bones, joints & muscles", exposures: [], link: "event", alt: "osteoarthritis, worn joints" },
  { label: "Limited range of motion", system: "Bones, joints & muscles", exposures: [], link: "event", alt: "can't bend, stiffness" },
  { label: "Surgical scars or hardware", system: "Bones, joints & muscles", exposures: [], link: "event", alt: "plates, screws, rods" },
  { label: "Amputation or loss of use", system: "Bones, joints & muscles", exposures: [], link: "event" },
  { label: "TMJ / jaw problems", system: "Bones, joints & muscles", exposures: [], link: "event", alt: "jaw pain, clicking" },
  { label: "Chronic pain syndrome", system: "Bones, joints & muscles", exposures: [], link: "both" },
  { label: "Osteoporosis / bone loss", system: "Bones, joints & muscles", exposures: ["heavy_metal"], link: "both" },
  { label: "Stress fractures / shin splints", system: "Bones, joints & muscles", exposures: [], link: "event" },

  // ── Head & nerves ──
  { label: "Post-concussive symptoms", system: "Head & nerves", exposures: [], link: "event", alt: "after a blast or head injury" },
  { label: "Dizziness / balance problems", system: "Head & nerves", exposures: [], link: "event" },
  { label: "Restless legs", system: "Head & nerves", exposures: [], link: "both" },
  { label: "Bell's palsy / facial nerve", system: "Head & nerves", exposures: [], link: "both" },
  { label: "Multiple sclerosis", system: "Head & nerves", exposures: [], link: "both" },
  { label: "Nerve damage from injury", system: "Head & nerves", exposures: [], link: "event" },

  // ── Mental health ──
  { label: "Bipolar disorder", system: "Mental health", exposures: [], link: "event" },
  { label: "Schizophrenia / psychotic disorder", system: "Mental health", exposures: [], link: "event" },
  { label: "Eating disorder", system: "Mental health", exposures: [], link: "event" },
  { label: "Anger / irritability", system: "Mental health", exposures: [], link: "event", alt: "short fuse, rage" },
  { label: "Grief or moral injury", system: "Mental health", exposures: [], link: "event", alt: "guilt, what I did or saw" },
  { label: "Isolation / trouble with people", system: "Mental health", exposures: [], link: "event" },

  // ── Sleep ──
  { label: "Trouble staying asleep", system: "Sleep", exposures: [], link: "both", alt: "waking at 2am" },
  { label: "Narcolepsy / daytime sleep attacks", system: "Sleep", exposures: [], link: "both" },

  // ── Heart & circulation ──
  { label: "Irregular heartbeat", system: "Heart & circulation", exposures: [], link: "both", alt: "AFib, arrhythmia, palpitations" },
  { label: "Heart valve problem or murmur", system: "Heart & circulation", exposures: [], link: "both" },
  { label: "Varicose veins", system: "Heart & circulation", exposures: [], link: "event" },
  { label: "Blood clots / DVT", system: "Heart & circulation", exposures: [], link: "both" },
  { label: "Poor circulation in hands or feet", system: "Heart & circulation", exposures: ["heavy_metal"], link: "both", alt: "Raynaud's, cold hands" },
  { label: "Heart failure", system: "Heart & circulation", exposures: [], link: "both" },

  // ── Stomach & digestion ──
  { label: "Gastritis", system: "Stomach & digestion", exposures: [], link: "both" },
  { label: "Hemorrhoids", system: "Stomach & digestion", exposures: [], link: "event" },
  { label: "Hernia", system: "Stomach & digestion", exposures: [], link: "event" },
  { label: "Gallbladder problems", system: "Stomach & digestion", exposures: [], link: "both" },
  { label: "Pancreatitis", system: "Stomach & digestion", exposures: [], link: "both" },
  { label: "Diverticulitis", system: "Stomach & digestion", exposures: [], link: "both" },
  { label: "Crohn's or ulcerative colitis", system: "Stomach & digestion", exposures: [], link: "both", alt: "inflammatory bowel disease" },
  { label: "Celiac disease", system: "Stomach & digestion", exposures: [], link: "both" },
  { label: "Fatty liver", system: "Stomach & digestion", exposures: ["chemical_solvent"], link: "both" },
  { label: "Trouble swallowing", system: "Stomach & digestion", exposures: [], link: "both", alt: "dysphagia" },

  // ── Hormones & metabolism ──
  // ⚠️ NO metal exposure class may appear in this group. Saturnine gout moved to
  // "Kidneys & urinary" (its mechanism is urate underexcretion via lead
  // nephropathy) and "Vitamin or mineral deficiency" was deleted outright — it
  // is a nutrient claim, not a condition, and there is no validated model from
  // an exposure history to a nutrient deficit in a person. Together they were
  // the last heavy-metal route into a group that also contains "Low
  // testosterone", which rendered "metals → low testosterone" as a browsable
  // path without anyone writing the sentence. Enforced by scripts/coi-firewall.cjs.
  { label: "Adrenal problems", system: "Hormones & metabolism", exposures: [], link: "both" },
  { label: "Prediabetes / insulin resistance", system: "Hormones & metabolism", exposures: [], link: "both" },
  { label: "Metabolic syndrome / obesity", system: "Hormones & metabolism", exposures: [], link: "both" },

  // ── Kidneys & urinary ──
  // Saturnine gout lives here, not under hormones: lead raises urate by
  // impairing its excretion through the kidney, so the kidney is the mechanism.
  { label: "Gout", system: "Kidneys & urinary", exposures: ["heavy_metal"], link: "both", alt: "saturnine gout" },
  { label: "Frequent urination or urgency", system: "Kidneys & urinary", exposures: [], link: "both" },
  { label: "Urinary incontinence", system: "Kidneys & urinary", exposures: [], link: "both" },
  { label: "Enlarged prostate (BPH)", system: "Kidneys & urinary", exposures: [], link: "both" },
  { label: "Recurring urinary infections", system: "Kidneys & urinary", exposures: [], link: "both" },
  { label: "Interstitial cystitis", system: "Kidneys & urinary", exposures: [], link: "both" },

  // ── Skin ──
  { label: "Chronic acne or folliculitis", system: "Skin", exposures: [], link: "both" },
  { label: "Fungal infections", system: "Skin", exposures: [], link: "both", alt: "jungle rot, athlete's foot, tinea" },
  { label: "Excessive sweating", system: "Skin", exposures: [], link: "both", alt: "hyperhidrosis" },
  { label: "Hair loss", system: "Skin", exposures: ["heavy_metal"], link: "both", alt: "alopecia" },
  { label: "Vitiligo / skin discoloration", system: "Skin", exposures: [], link: "both" },
  { label: "Skin cancer (non-melanoma)", system: "Skin", exposures: ["radiation"], link: "place", alt: "basal cell, squamous cell" },
  { label: "Sun damage / chronic sunburn", system: "Skin", exposures: [], link: "event" },

  // ── Immune & blood ──
  { label: "Rheumatoid arthritis", system: "Immune & blood", exposures: ["chemical_solvent"], link: "both" },
  { label: "Lupus", system: "Immune & blood", exposures: ["chemical_solvent"], link: "both" },
  { label: "Chronic infections / low immunity", system: "Immune & blood", exposures: [], link: "both" },
  { label: "Severe allergies", system: "Immune & blood", exposures: [], link: "both" },
  { label: "Low white or red blood cell counts", system: "Immune & blood", exposures: ["chemical_solvent", "radiation"], link: "place" },
  { label: "Blood clotting disorder", system: "Immune & blood", exposures: [], link: "both" },

  // ── Cancer ──
  { label: "Colorectal cancer", system: "Cancer", exposures: [], link: "place" },
  { label: "Esophageal cancer", system: "Cancer", exposures: [], link: "place" },
  { label: "Stomach cancer", system: "Cancer", exposures: [], link: "place" },
  { label: "Testicular cancer", system: "Cancer", exposures: [], link: "place" },
  { label: "Ovarian cancer", system: "Cancer", exposures: [], link: "place" },
  { label: "Cervical or uterine cancer", system: "Cancer", exposures: [], link: "place" },
  { label: "Bladder or urinary tract cancer", system: "Cancer", exposures: [], link: "place" },
  { label: "Laryngeal or throat cancer", system: "Cancer", exposures: [], link: "place" },
  { label: "Oral cancer", system: "Cancer", exposures: [], link: "place" },
  { label: "Bone cancer / sarcoma", system: "Cancer", exposures: [], link: "place" },
  { label: "Salivary gland cancer", system: "Cancer", exposures: [], link: "place" },

  // ── Reproductive & sexual health ──
  { label: "Endometriosis", system: "Reproductive & sexual health", exposures: [], link: "both" },
  { label: "PCOS", system: "Reproductive & sexual health", exposures: [], link: "both", alt: "polycystic ovary syndrome" },
  { label: "Uterine fibroids", system: "Reproductive & sexual health", exposures: [], link: "both" },
  { label: "Painful intercourse or pelvic pain", system: "Reproductive & sexual health", exposures: [], link: "both" },
  { label: "Early menopause", system: "Reproductive & sexual health", exposures: [], link: "both" },
  { label: "Breast condition (non-cancer)", system: "Reproductive & sexual health", exposures: [], link: "both" },

  // ── Vision ──
  { label: "Cataracts", system: "Vision", exposures: ["radiation"], link: "both" },
  { label: "Glaucoma", system: "Vision", exposures: [], link: "both" },
  { label: "Dry eye", system: "Vision", exposures: ["particulate"], link: "both" },
  { label: "Double or blurred vision", system: "Vision", exposures: [], link: "event" },

  // ── Whole-body symptoms ──
  { label: "Widespread pain", system: "Whole-body symptoms", exposures: ["gulf_war_agent"], link: "both" },
  { label: "Trouble regulating temperature", system: "Whole-body symptoms", exposures: [], link: "both", alt: "night sweats, always cold" },
  { label: "Frequent dizziness or fainting", system: "Whole-body symptoms", exposures: [], link: "both" },
  { label: "Chemical or smell sensitivity", system: "Whole-body symptoms", exposures: ["chemical_solvent"], link: "both" },
  { label: "Something else I can't name yet", system: "Whole-body symptoms", exposures: [], link: "both", alt: "not sure what it is" },
];

// The handful most veterans start with — shown above the fold so the common
// case takes one tap, not a hunt through sixteen body systems.
export const COMMON_STARTERS = [
  "Tinnitus", "Hearing loss", "Back pain / degenerative disc", "PTSD",
  "Sleep apnea", "Knee pain / instability", "Migraines / chronic headaches",
  "Anxiety", "Depression", "GERD / acid reflux", "Asthma", "High blood pressure",
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
