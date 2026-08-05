import { PACT_SCOPE, AGENT_ORANGE_SCOPE, LEJEUNE_SCOPE, RADIATION_SCOPE, LEJEUNE_HEALTHCARE_NOTE } from "./presumptive";

// ─────────────────────────────────────────────────────────────────────────────
// CITATIONS — what the packet asserts to a VSO and a rater.
//
// ⚠️ An accuracy audit (2026-08) found this file asserting presumptive status
// without the locations/dates the presumptions actually require, and citing
// several conditions to the wrong authority. Rules now:
//   1. Every presumptive cite carries its SCOPE in the same string.
//   2. Statute-only presumptives cite the STATUTE — 38 CFR §3.309(e) is
//      currently narrower than 38 U.S.C. §1116(a)(2).
//   3. VA HEALTH CARE eligibility (38 CFR §17.400) is never called a
//      disability presumptive — different list, different benefit.
//   4. The Camp Lejeune Justice Act names NO diseases; it is a tort action in
//      EDNC whose filing window closed 10 Aug 2024. Never cite it as the source
//      of a disease list.
//
// ⚠️ MAINTENANCE OWNER REQUIRED: presumptive lists change. Nobody owns this
// file's review cadence yet — assign a named person (ideally with an
// accredited VSO) before wide distribution.
// ─────────────────────────────────────────────────────────────────────────────

/** Printed wherever the packet states its currency. ONE source of truth —
 *  the audit found three different strings claiming three different dates. */
export { currencyLine as CITATIONS_CURRENCY } from "./accuracyOwner";

export const EXPOSURE_BASIS: Record<string, string> = {
  burn_pit: `Burn pits / airborne hazards — PACT Act of 2022 (38 U.S.C. §§1119–1120; 38 CFR §§3.320, 3.320a, 3.320b). ${PACT_SCOPE}`,
  particulate: `Fine particulate matter (sand, dust, smoke) — PACT Act airborne hazards (38 U.S.C. §§1119–1120). ${PACT_SCOPE}`,
  pesticide: `Herbicide (Agent Orange) exposure — 38 U.S.C. §1116(d); 38 CFR §3.307(a)(6). ${AGENT_ORANGE_SCOPE}`,
  radiation: `Ionizing radiation — 38 CFR §3.309(d) (presumptive) and §3.311 (dose assessment). ${RADIATION_SCOPE} Depleted uranium is not on either presumptive list; VA describes DU as about 40% less radioactive than natural uranium and treats the kidneys as the first organ of concern, through its Depleted Uranium Follow-Up Program.`,
  water_contamination: `Contaminated water. ${LEJEUNE_SCOPE}`,
  chemical_solvent: "Industrial solvents / chemicals (e.g., TCE, benzene) — ATSDR toxicological profiles; no blanket presumption.",
  nerve_agent: "Chemical-warfare-agent exposure — DoD / VA Gulf War exposure records; 38 CFR §3.317 where applicable.",
  gulf_war_agent: "Gulf War service — undiagnosed illness / medically unexplained chronic multisymptom illness, 38 CFR §3.317.",
  pfas_afff: "PFAS / AFFF (firefighting foam) — ATSDR PFAS toxicological profile. There is no VA PFAS presumptive list; claimed on exposure history and medical evidence.",
  heavy_metal: "Heavy-metal exposure (lead, cadmium, etc.) — ATSDR toxicological profiles; no blanket presumption.",
  asbestos_silica: "Asbestos / silica — VA asbestos guidance; ATSDR profiles; claimed by exposure history. Asbestos and silica are not PACT Act presumed-exposure categories.",
};

export type ConditionBasis = { tag: string; presumptive: boolean; cite: string };

const PACT_TAG = "PACT Act presumptive — if service meets the locations/dates";
const AO_TAG = "Agent Orange presumptive — if service meets the locations/dates";

// LEGACY KEYS (the original 15 labels) are retained deliberately: veterans who
// used the app before the catalog expanded have those exact strings saved on
// their records, and re-keying would blank the basis line on every one.
const LEGACY: Record<string, ConditionBasis> = {
  "Chronic rhinitis / sinusitis": { tag: PACT_TAG, presumptive: true, cite: `Chronic rhinitis and chronic sinusitis are PACT Act presumptive conditions (38 U.S.C. §1120). ${PACT_SCOPE}` },
  "Asthma / reactive airway": { tag: PACT_TAG, presumptive: true, cite: `Asthma DIAGNOSED AFTER SERVICE is a PACT Act presumptive condition (38 U.S.C. §1120(b)(1)) — the post-service qualifier is part of the rule. ${PACT_SCOPE}` },
  "COPD / chronic bronchitis": { tag: PACT_TAG, presumptive: true, cite: `COPD and chronic bronchitis are PACT Act presumptive conditions (38 U.S.C. §1120). ${PACT_SCOPE}` },
  "Constrictive bronchiolitis": { tag: PACT_TAG, presumptive: true, cite: `Constrictive / obliterative bronchiolitis is a PACT Act presumptive condition (38 U.S.C. §1120). ${PACT_SCOPE}` },
  "Respiratory or lung cancer": { tag: PACT_TAG, presumptive: true, cite: `Respiratory cancer of any type is PACT Act presumptive (38 U.S.C. §1120). For Agent Orange the presumptive is narrower — cancer of the lung, bronchus, larynx or trachea only (38 CFR §3.309(e)). For radiation, only cancer of the lung and bronchiolo-alveolar carcinoma are listed (38 CFR §3.309(d)(2)), and only for a veteran who took part in a listed radiation-risk activity. ${PACT_SCOPE}` },
  "Other cancer": { tag: "May be presumptive — the specific type decides", presumptive: false, cite: `Many cancers are presumptive depending on the exact type and the exposure — PACT Act (38 U.S.C. §1120), Agent Orange (38 CFR §3.309(e)), Camp Lejeune (38 CFR §3.309(f)), or radiation (38 CFR §3.309(d)). A generic entry cannot establish any of them. Give your VSO the specific diagnosis.` },
  "Thyroid disorder": { tag: "Hypothyroidism only — Agent Orange", presumptive: false, cite: `HYPOTHYROIDISM is a herbicide presumptive by statute (38 U.S.C. §1116(a)(2)(K)); 38 CFR §3.309(e) has not yet been amended to list it. Hyperthyroidism, Graves', goiter and nodules are NOT on the list. Thyroid cancer may be a radiation presumptive (38 CFR §3.309(d)(2)(ii)) only for a veteran who took part in a listed radiation-risk activity. ${AGENT_ORANGE_SCOPE}` },
  "Kidney disease": { tag: "Not presumptive — document the association", presumptive: false, cite: `KIDNEY CANCER is presumptive (38 CFR §3.309(f) for Camp Lejeune; PACT Act genitourinary cancer). NON-CANCER kidney disease is not a disability presumptive — renal toxicity appears on VA's Camp Lejeune HEALTH CARE list (38 CFR §17.400(b)), which is cost-free care, not compensation. ${LEJEUNE_HEALTHCARE_NOTE}` },
  "Hypertension": { tag: AO_TAG, presumptive: true, cite: `Hypertension is an Agent Orange presumptive condition under 38 U.S.C. §1116(a)(2)(M) (PACT Act §404). 38 CFR §3.309(e) has not yet been amended to list it — VA applies the statute. ${AGENT_ORANGE_SCOPE}` },
  "Neurological / cognitive (TBI)": { tag: "Direct service connection", presumptive: false, cite: "Traumatic brain injury is claimed by direct service connection (event-based), not exposure presumption. Parkinson's disease is presumptive for herbicide exposure (38 CFR §3.309(e)) and for Camp Lejeune (38 CFR §3.309(f)). Parkinsonism is a herbicide presumptive by statute (38 U.S.C. §1116(a)(2)(I)) but is NOT on the Camp Lejeune list." },
  "Peripheral neuropathy": { tag: "Agent Orange presumptive — EARLY-ONSET only", presumptive: true, cite: `EARLY-ONSET peripheral neuropathy is an Agent Orange presumptive: it must have become manifest to 10 percent or more WITHIN ONE YEAR of the last herbicide exposure (38 CFR §3.307(a)(6)(ii), §3.309(e)). Later-onset neuropathy is not presumptive. ATSDR also links solvents and heavy metals to neuropathy. ${AGENT_ORANGE_SCOPE}` },
  "Gut / GI disorder": { tag: "Depends on the diagnosis", presumptive: false, cite: "GI CANCERS are PACT Act presumptive (38 U.S.C. §1120). FUNCTIONAL GI disorders (such as IBS) are named in 38 CFR §3.317 as a qualifying Gulf War chronic multisymptom illness. Other GI conditions are neither. Give your VSO the specific diagnosis." },
  "Autoimmune disorder": { tag: "Condition-specific", presumptive: false, cite: "Most autoimmune conditions are not presumptive. Specific ones are: AL amyloidosis (Agent Orange) and sarcoidosis (PACT Act). Otherwise document an ATSDR-recognized association with your clinician." },
  "Hormonal / reproductive": { tag: "Reproductive cancers only", presumptive: false, cite: `Reproductive CANCERS of any type are PACT Act presumptive (38 U.S.C. §1120). Non-cancer hormonal and reproductive effects are ATSDR-recognized associations (PFAS, dioxins, solvents), not presumptives. ${PACT_SCOPE}` },
  "PTSD / mental health": { tag: "Stressor-based (not exposure)", presumptive: false, cite: "PTSD and mental-health conditions are established through an in-service stressor and a current diagnosis — not exposure presumption. This packet supports your exposure history; document the stressor with your VSO." },
};

// CURRENT catalog labels. The audit found the eight most-used keys had drifted
// dead when the catalog expanded — so the protective disclaimers (PTSD/TBI are
// not exposure presumptives) and the statutory asthma qualifier never printed.
const CURRENT: Record<string, ConditionBasis> = {
  Asthma: LEGACY["Asthma / reactive airway"],
  COPD: LEGACY["COPD / chronic bronchitis"],
  "Chronic bronchitis": LEGACY["COPD / chronic bronchitis"],
  "Chronic rhinitis": LEGACY["Chronic rhinitis / sinusitis"],
  "Chronic sinusitis": LEGACY["Chronic rhinitis / sinusitis"],
  "Constrictive bronchiolitis": LEGACY["Constrictive bronchiolitis"],
  "Respiratory or lung cancer": LEGACY["Respiratory or lung cancer"],
  "Other cancer": LEGACY["Other cancer"],
  "High blood pressure": LEGACY["Hypertension"],
  "Peripheral neuropathy (early-onset)": LEGACY["Peripheral neuropathy"],
  "Autoimmune disorder": LEGACY["Autoimmune disorder"],

  PTSD: LEGACY["PTSD / mental health"],
  Depression: LEGACY["PTSD / mental health"],
  Anxiety: LEGACY["PTSD / mental health"],
  "Traumatic brain injury (TBI)": LEGACY["Neurological / cognitive (TBI)"],

  "Hypothyroidism (underactive thyroid)": LEGACY["Thyroid disorder"],
  "Kidney disease": LEGACY["Kidney disease"],

  // The eight Camp Lejeune DISABILITY presumptives — 38 CFR §3.309(f).
  "Kidney cancer": { tag: "Camp Lejeune presumptive", presumptive: true, cite: `Kidney cancer is one of the eight Camp Lejeune presumptive diseases (38 CFR §3.309(f)) and a PACT Act genitourinary cancer (38 U.S.C. §1120). ${LEJEUNE_SCOPE}` },
  "Liver cancer": { tag: "Camp Lejeune presumptive", presumptive: true, cite: `Liver cancer is one of the eight Camp Lejeune presumptive diseases (38 CFR §3.309(f)). ${LEJEUNE_SCOPE}` },
  "Bladder cancer": { tag: "Camp Lejeune / Agent Orange presumptive", presumptive: true, cite: `Bladder cancer is a Camp Lejeune presumptive (38 CFR §3.309(f)) and a herbicide presumptive by statute (38 U.S.C. §1116(a)(2)(J)). ${LEJEUNE_SCOPE}` },
  "Multiple myeloma": { tag: "Camp Lejeune / Agent Orange presumptive", presumptive: true, cite: `Multiple myeloma is a Camp Lejeune presumptive (38 CFR §3.309(f)) and an Agent Orange presumptive (38 CFR §3.309(e)). ${LEJEUNE_SCOPE}` },
  "Non-Hodgkin's lymphoma": { tag: "Camp Lejeune / Agent Orange presumptive", presumptive: true, cite: `Non-Hodgkin's lymphoma is a Camp Lejeune presumptive (38 CFR §3.309(f)) and an Agent Orange presumptive (38 CFR §3.309(e)). ${LEJEUNE_SCOPE}` },
  "Parkinson's disease": { tag: "Camp Lejeune / Agent Orange presumptive", presumptive: true, cite: "Parkinson's disease is presumptive for herbicide exposure (38 CFR §3.309(e)) and is one of the eight Camp Lejeune presumptive diseases (38 CFR §3.309(f)). Parkinsonism is a herbicide presumptive by statute (38 U.S.C. §1116(a)(2)(I)) but is NOT on the Camp Lejeune list." },
  "Aplastic anemia / MDS": { tag: "Camp Lejeune presumptive", presumptive: true, cite: `Aplastic anemia and other myelodysplastic syndromes are Camp Lejeune presumptive diseases (38 CFR §3.309(f)). Marrow suppression is also a documented acute high-dose radiation effect (ATSDR); these are not on VA's radiation presumptive list (38 CFR §3.309(d)) — a §3.311 dose assessment is that route. ${LEJEUNE_SCOPE}` },

  "Type 2 diabetes": { tag: AO_TAG, presumptive: true, cite: `Type 2 diabetes mellitus is an Agent Orange presumptive condition (38 CFR §3.309(e)). ${AGENT_ORANGE_SCOPE}` },
  "Ischemic heart disease": { tag: AO_TAG, presumptive: true, cite: `Ischemic heart disease is an Agent Orange presumptive condition (38 CFR §3.309(e)). Note 2 to §3.309(e) expressly excludes hypertension from ischemic heart disease — hypertension is presumptive on its own statutory footing (38 U.S.C. §1116(a)(2)(M)). ${AGENT_ORANGE_SCOPE}` },
  "Prostate cancer": { tag: AO_TAG, presumptive: true, cite: `Prostate cancer is an Agent Orange presumptive condition (38 CFR §3.309(e)). ${AGENT_ORANGE_SCOPE}` },
  MGUS: { tag: AO_TAG, presumptive: true, cite: `Monoclonal gammopathy of undetermined significance (MGUS) is a herbicide presumptive by statute (38 U.S.C. §1116(a)(2)(L)); 38 CFR §3.309(e) has not yet been amended to list it. ${AGENT_ORANGE_SCOPE}` },
  "AL amyloidosis": { tag: AO_TAG, presumptive: true, cite: `AL amyloidosis is an Agent Orange presumptive condition (38 CFR §3.309(e)). ${AGENT_ORANGE_SCOPE}` },
  "Hodgkin's disease": { tag: AO_TAG, presumptive: true, cite: `Hodgkin's disease is an Agent Orange presumptive condition (38 CFR §3.309(e)). ${AGENT_ORANGE_SCOPE}` },
  "Soft tissue sarcoma": { tag: AO_TAG, presumptive: true, cite: `Soft-tissue sarcoma (other than osteosarcoma, chondrosarcoma, Kaposi's sarcoma or mesothelioma) is an Agent Orange presumptive condition (38 CFR §3.309(e)). ${AGENT_ORANGE_SCOPE}` },
  Chloracne: { tag: "Agent Orange presumptive — ONE-YEAR window", presumptive: true, cite: `Chloracne must have become manifest to 10 percent or more WITHIN ONE YEAR of the last herbicide exposure (38 CFR §3.307(a)(6)(ii)). ${AGENT_ORANGE_SCOPE}` },
  "Parkinsonism / tremor": { tag: "Agent Orange presumptive (statute)", presumptive: true, cite: `Parkinsonism is a herbicide presumptive by statute (38 U.S.C. §1116(a)(2)(I)). It is NOT on the Camp Lejeune list (38 CFR §3.309(f) names Parkinson's disease only). ${AGENT_ORANGE_SCOPE}` },

  "Chronic fatigue syndrome": { tag: "Gulf War (38 CFR §3.317)", presumptive: true, cite: "Chronic fatigue syndrome is named in 38 CFR §3.317 as a qualifying chronic multisymptom illness — one of the three (with fibromyalgia and functional GI disorders) that qualify even though they ARE clinical diagnoses. Symptoms must have lasted 6 months or more and reached 10 percent or more by December 31, 2026 unless VA extends that date." },
  Fibromyalgia: { tag: "Gulf War (38 CFR §3.317)", presumptive: true, cite: "Fibromyalgia is named in 38 CFR §3.317 as a qualifying chronic multisymptom illness. Symptoms must have lasted 6 months or more and reached 10 percent or more by December 31, 2026 unless VA extends that date." },
  "IBS / functional GI disorder": { tag: "Gulf War (38 CFR §3.317)", presumptive: true, cite: "Functional gastrointestinal disorders are named in 38 CFR §3.317 as qualifying chronic multisymptom illnesses. Symptoms must have lasted 6 months or more and reached 10 percent or more by December 31, 2026 unless VA extends that date." },
  "Undiagnosed symptoms that won't go away": { tag: "Gulf War undiagnosed illness", presumptive: true, cite: "38 CFR §3.317 covers an undiagnosed illness only if NO clinical diagnosis explains it. Symptoms must have lasted 6 months or more (§3.317(a)(4)) and become manifest during Southwest Asia service or to 10 percent or more by December 31, 2026 (§3.317(a)(1)(i)) — ask your VSO about that deadline now." },

  Sarcoidosis: { tag: PACT_TAG, presumptive: true, cite: `Sarcoidosis is a PACT Act presumptive condition (38 U.S.C. §1120). ${PACT_SCOPE}` },
  "Pulmonary fibrosis": { tag: PACT_TAG, presumptive: true, cite: `Pulmonary fibrosis is a PACT Act presumptive condition (38 U.S.C. §1120). Asbestos and silica are documented causes but are NOT PACT presumed-exposure categories. ${PACT_SCOPE}` },
  "Interstitial lung disease": { tag: PACT_TAG, presumptive: true, cite: `Interstitial lung disease is a PACT Act presumptive condition (38 U.S.C. §1120). Asbestos and silica are documented causes but are NOT PACT presumed-exposure categories. ${PACT_SCOPE}` },
  Emphysema: { tag: PACT_TAG, presumptive: true, cite: `Emphysema is a PACT Act presumptive condition (38 U.S.C. §1120). ${PACT_SCOPE}` },

  Tinnitus: { tag: "Event-based, not exposure", presumptive: false, cite: "Tinnitus is claimed on in-service noise or blast exposure and a current diagnosis — not an exposure presumption. VA's Duty MOS Noise Exposure Listing is the reference raters use for the job-code side of that question." },
  "Hearing loss": { tag: "Event-based, not exposure", presumptive: false, cite: "Hearing loss is claimed on in-service noise or blast exposure and current audiometric findings — not an exposure presumption. VA's Duty MOS Noise Exposure Listing is the reference raters use for the job-code side of that question." },
};

export const CONDITION_BASIS: Record<string, ConditionBasis> = { ...LEGACY, ...CURRENT };
