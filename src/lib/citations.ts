// Presumptive-condition citations, curated from the VA's official lists and verified
// against VA.gov (June 2026): the PACT Act of 2022, 38 CFR Part 3 (§3.307, §3.309,
// §3.311, §3.317, §3.320), the Camp Lejeune Justice Act of 2022, and ATSDR
// toxicological profiles. Citations are general — a veteran's actual eligibility
// depends on their dates, locations, and specific diagnosis and must be confirmed
// with an accredited VSO. Maintained for science-board review.

export const EXPOSURE_BASIS: Record<string, string> = {
  burn_pit:
    "Burn pits / airborne hazards — PACT Act of 2022 (38 U.S.C. §1119–1120). Presumption of exposure for qualifying service on or after 9/11/2001 and in the Gulf War theater.",
  particulate: "Fine particulate matter (sand, dust, smoke) — PACT Act airborne hazards (38 U.S.C. §1119–1120).",
  pesticide: "Herbicide (Agent Orange) exposure — 38 CFR §3.307(a)(6), §3.309(e).",
  radiation: "Ionizing radiation / depleted uranium — 38 CFR §3.309(d), §3.311; VA radiation programs.",
  water_contamination:
    "Contaminated water — Camp Lejeune (Aug 1953–Dec 1987), 38 CFR §3.307(a)(7); Camp Lejeune Justice Act of 2022.",
  chemical_solvent: "Industrial solvents / chemicals (e.g., TCE, benzene) — ATSDR toxicological profiles; no blanket presumption.",
  nerve_agent: "Chemical-warfare-agent exposure — DoD / VA Gulf War exposure records; 38 CFR §3.317 where applicable.",
  gulf_war_agent:
    "Gulf War service — undiagnosed illness / medically unexplained chronic multisymptom illness, 38 CFR §3.317.",
  pfas_afff: "PFAS / AFFF (firefighting foam) — ATSDR PFAS toxicological profile; emerging, no blanket presumption.",
  heavy_metal: "Heavy-metal exposure (lead, cadmium, etc.) — ATSDR toxicological profiles; no blanket presumption.",
  asbestos_silica: "Asbestos / silica — VA asbestos guidance; ATSDR profiles; claimed by exposure history.",
};

export type ConditionBasis = { tag: string; presumptive: boolean; cite: string };

// Keyed to the condition labels used in the Health section.
export const CONDITION_BASIS: Record<string, ConditionBasis> = {
  "Chronic rhinitis / sinusitis": {
    tag: "PACT Act presumptive",
    presumptive: true,
    cite: "Chronic rhinitis and chronic sinusitis are PACT Act presumptive conditions for airborne-hazard / burn-pit exposure (38 U.S.C. §1120).",
  },
  "Asthma / reactive airway": {
    tag: "PACT Act presumptive",
    presumptive: true,
    cite: "Asthma diagnosed after service is a PACT Act presumptive condition for airborne-hazard / burn-pit exposure (38 U.S.C. §1120).",
  },
  "COPD / chronic bronchitis": {
    tag: "PACT Act presumptive",
    presumptive: true,
    cite: "COPD and chronic bronchitis are PACT Act presumptive conditions for airborne-hazard / burn-pit exposure (38 U.S.C. §1120).",
  },
  "Constrictive bronchiolitis": {
    tag: "PACT Act presumptive",
    presumptive: true,
    cite: "Constrictive / obliterative bronchiolitis is a PACT Act presumptive condition for airborne-hazard / burn-pit exposure (38 U.S.C. §1120).",
  },
  "Respiratory or lung cancer": {
    tag: "PACT Act presumptive",
    presumptive: true,
    cite: "Respiratory (breathing-related) cancer of any type is PACT Act presumptive (38 U.S.C. §1120); also an Agent Orange and a radiation presumptive cancer.",
  },
  "Other cancer": {
    tag: "May be presumptive — confirm type",
    presumptive: true,
    cite: "Many cancers are presumptive depending on the specific type and exposure — PACT Act (brain, GI, glioblastoma, genitourinary, head/neck, hematologic, lymphoma, melanoma, pancreatic, reproductive), Agent Orange (§3.309(e)), Camp Lejeune, or radiation (§3.309(d)). Confirm your cancer type with your VSO.",
  },
  "Thyroid disorder": {
    tag: "Presumptive (Agent Orange / radiation)",
    presumptive: true,
    cite: "Hypothyroidism is an Agent Orange presumptive (38 CFR §3.309(e)); thyroid cancer may be a radiation presumptive (§3.309(d)). Confirm the specific diagnosis with your VSO.",
  },
  "Kidney disease": {
    tag: "Kidney cancer presumptive",
    presumptive: true,
    cite: "Kidney cancer is presumptive (PACT Act genitourinary cancer; Camp Lejeune). Non-cancer kidney disease is not broadly presumptive — ATSDR links heavy metals / solvents to kidney effects; discuss with your clinician.",
  },
  "Hypertension": {
    tag: "Agent Orange presumptive",
    presumptive: true,
    cite: "Hypertension is listed as an Agent Orange presumptive condition (38 CFR §3.309(e)). Confirm current effective date and herbicide-exposure eligibility with your VSO.",
  },
  "Neurological / cognitive (TBI)": {
    tag: "Direct service connection",
    presumptive: false,
    cite: "Traumatic brain injury is claimed by direct service connection (event-based), not exposure presumption. If the diagnosis is Parkinson's / Parkinsonism, it is presumptive (Agent Orange §3.309(e); Camp Lejeune). Confirm the basis with your VSO.",
  },
  "Peripheral neuropathy": {
    tag: "Agent Orange presumptive (early-onset)",
    presumptive: true,
    cite: "Early-onset peripheral neuropathy is an Agent Orange presumptive (38 CFR §3.309(e)); ATSDR also links solvents / heavy metals to neuropathy. Discuss timing with your VSO.",
  },
  "Gut / GI disorder": {
    tag: "Presumptive (PACT Act / Gulf War)",
    presumptive: true,
    cite: "GI cancers are PACT Act presumptive (38 U.S.C. §1120). Functional GI disorders may qualify as Gulf War illness (38 CFR §3.317). Confirm the specific diagnosis with your VSO.",
  },
  "Autoimmune disorder": {
    tag: "Condition-specific",
    presumptive: false,
    cite: "Most autoimmune conditions are not broadly presumptive; specific ones are (AL amyloidosis — Agent Orange; sarcoidosis — PACT Act). Otherwise document an ATSDR-recognized association with your clinician.",
  },
  "Hormonal / reproductive": {
    tag: "Reproductive cancer presumptive",
    presumptive: true,
    cite: "Reproductive cancers of any type are PACT Act presumptive (38 U.S.C. §1120). Other hormonal / reproductive effects are ATSDR-recognized associations (PFAS, dioxins, solvents) — discuss with your clinician.",
  },
  "PTSD / mental health": {
    tag: "Stressor-based (not exposure)",
    presumptive: false,
    cite: "PTSD and mental-health conditions are established through an in-service stressor and a current diagnosis — not exposure presumption. This packet supports your exposure history; document the stressor with your VSO.",
  },
};
