// Educational content for the learning pages (Exposures, Conditions, Solutions).
// This is EDUCATION, not medical or legal advice. No product names, no doses, no
// treatment claims — only what documented science describes and what a veteran can
// reasonably discuss with their own clinician or practitioner. Sources: ATSDR
// toxicological profiles, VA / PACT Act materials, and peer-reviewed literature.
// Legal/claim citations live in citations.ts and are reused on these pages.

import { CONDITIONS as CONDITION_CATALOG } from "./conditions";

// ─────────────────────────────────────────────────────────────────────────────
// THE RECORD'S ONE BRAIN.
// Exposure classes, their labels, and the condition↔exposure mapping live HERE
// and nowhere else. Every view (map, intake, journey, health, dashboard,
// buddies, estimator) and the claim packet must import from this file — copies
// silently drift, and when they do, the screen the veteran trusts and the packet
// they file disagree. That is disqualifying for a quasi-legal document.
//
// ⚠️ MAINTENANCE: CONDITION_EXPOSURES must track actual VA presumptive law as
// the PACT Act and its rulemaking evolve. Assign an owner and review it on a set
// cadence — a stale mapping quietly generates WRONG claims, which is worse than
// generating none.
// ─────────────────────────────────────────────────────────────────────────────

// The canonical ordered option list shown anywhere a veteran picks exposures.
export const EXPOSURES: { label: string; value: string }[] = [
  { label: "Burn pits", value: "burn_pit" },
  { label: "Heavy metals", value: "heavy_metal" },
  { label: "Chemical / solvent", value: "chemical_solvent" },
  { label: "Water contamination", value: "water_contamination" },
  { label: "Pesticide / herbicide", value: "pesticide" },
  { label: "Asbestos / silica", value: "asbestos_silica" },
  { label: "Nerve agent", value: "nerve_agent" },
  { label: "Particulate / dust", value: "particulate" },
  { label: "Radiation / depleted uranium", value: "radiation" },
  { label: "PFAS / AFFF", value: "pfas_afff" },
  { label: "Gulf War agent", value: "gulf_war_agent" },
  // These two exist in the database's exposure_class enum and are seeded on
  // real recognized sites (Qarmat Ali, Hanford, Fort Ord). Without chips here
  // they were saved to a veteran's record invisibly — under a banner telling
  // them to "uncheck anything that doesn't apply" — and printed into the packet
  // as the raw enum string.
  { label: "Industrial chemical / PCBs", value: "industrial_chemical" },
  { label: "Other exposure", value: "other" },
];

export const EXPOSURE_LABEL: Record<string, string> = Object.fromEntries(
  EXPOSURES.map((e) => [e.value, e.label]),
);

// Exposure classes that CAN lead to a presumption for SOME veterans — never a
// determination on its own.
//
// ⚠️ This set must NEVER drive a "presumptive" badge or flag. A presumption
// attaches to a veteran whose service meets specific locations and dates; use
// `scopeFor()` in lib/presumptive.ts. Radiation was removed: 38 CFR
// §3.309(d)(3)(ii) is a CLOSED list of radiation-risk activities, and radar,
// shipyard, weapons work and depleted uranium confer nothing — those go
// through a §3.311 dose assessment instead.
export const RECOGNIZED_CLASSES = new Set([
  "burn_pit", "particulate", "pesticide", "water_contamination", "gulf_war_agent",
]);

export type ExposureEdu = {
  short: string;
  where: string;
  body: string[];
  systems: string[];
  ask: string[];
};

export const EXPOSURE_EDU: Record<string, ExposureEdu> = {
  burn_pit: {
    short: "Open-air burning of waste — plastics, metals, electronics, fuel, medical and human waste — often acres wide and burning around the clock.",
    where:
      "Forward operating bases across Iraq, Afghanistan, and the wider Gulf theater used burn pits to dispose of nearly everything. Smoke drifted over living and working areas day and night, so exposure was constant rather than occasional.",
    body: [
      "Burning mixed waste with jet fuel releases a complex mixture of fine particulate matter, dioxins, volatile organic compounds, polycyclic aromatic hydrocarbons, and heavy metals. Because the fires burned at uncontrolled temperatures, the smoke carried a far wider range of toxicants than ordinary combustion.",
      "The smallest particles (PM2.5 and ultrafine) lodge deep in the lungs and can pass into the bloodstream, which is why burn-pit injury is not limited to the airway. The body responds with sustained inflammation — a recurring thread behind many of the conditions veterans report years later.",
    ],
    systems: ["Lungs and airway", "Heart and blood vessels", "Immune / inflammatory", "Possible cancers"],
    ask: [
      "Should I have baseline lung-function (spirometry) testing on record?",
      "Could my symptoms reflect airway inflammation rather than ordinary aging?",
      "Which PACT Act presumptive conditions should I be screened for?",
    ],
  },
  particulate: {
    short: "Fine sand, dust, and smoke — the everyday air of a desert deployment — small enough to reach the deepest part of the lung.",
    where:
      "Sandstorms, vehicle and rotor wash, and constant dry dust meant inhaled particulate was unavoidable across Southwest Asia. It often traveled alongside burn-pit smoke and diesel exhaust.",
    body: [
      "Desert particulate carries silica, metals, and microbial fragments. Repeated deep inhalation can scar the smallest airways and drive long-term inflammation, sometimes producing breathing trouble that standard chest X-rays miss.",
      "Because the injury is in the tiniest airways, some veterans have normal-looking imaging yet real exertional symptoms. Documenting the exposure and your symptom timeline matters.",
    ],
    systems: ["Lungs and small airways", "Sinuses", "Immune / inflammatory"],
    ask: [
      "Could constrictive bronchiolitis explain symptoms with normal imaging?",
      "Is full pulmonary-function testing warranted given my history?",
    ],
  },
  pesticide: {
    short: "Herbicides such as Agent Orange and other tactical/commercial pesticides used to clear vegetation and control insects.",
    where:
      "Vietnam, the Thailand base perimeters, the Korean DMZ, and several storage/test sites. Personnel handled, sprayed, or simply lived and worked where these chemicals were used.",
    body: [
      "Agent Orange was contaminated with TCDD, a dioxin that persists in the body and the environment for years. Dioxins interfere with hormone signaling and cellular regulation, which is why the recognized condition list spans cancers, diabetes, heart disease, and nerve injury.",
      "Many pesticides act on the nervous system and can stress the liver's chemical-processing pathways. Exposure decades ago can still be relevant because dioxins store in fat tissue.",
    ],
    systems: ["Endocrine / hormones", "Nervous system", "Metabolic (diabetes)", "Multiple cancers"],
    ask: [
      "Which Agent Orange presumptive conditions apply to my diagnoses?",
      "Should my hormone and metabolic markers be checked given dioxin exposure?",
    ],
  },
  water_contamination: {
    short: "Drinking and bathing water contaminated with industrial solvents, fuels, or other chemicals.",
    where:
      "Camp Lejeune (1953–1987) is the best-known example, where solvents like TCE and PCE plus benzene reached base water supplies. Other installations have documented solvent or fuel contamination of groundwater.",
    body: [
      "Solvents in water are absorbed through drinking, showering, and even breathing the vapor. TCE, PCE, and benzene are linked to several cancers, Parkinson's disease, kidney and liver effects, and birth defects in children exposed in utero.",
      "Because the dose built up daily over months or years, families on base — not only the service member — may carry health effects.",
    ],
    systems: ["Kidney and liver", "Blood / bone marrow", "Nervous system", "Reproductive / developmental"],
    ask: [
      "Do my dates at the installation fall in the recognized contamination window?",
      "Should family members who lived on base also be evaluated?",
    ],
  },
  chemical_solvent: {
    short: "Industrial solvents, degreasers, fuels, and cleaning chemicals — TCE, benzene, JP-8 jet fuel, and similar.",
    where:
      "Maintenance shops, motor pools, flight lines, fuel handling, and parts cleaning exposed many trades daily, often with limited ventilation or protective equipment.",
    body: [
      "Solvents are absorbed through the lungs and skin. Benzene affects the bone marrow and is linked to leukemia and other blood cancers; many degreasing solvents stress the liver, kidneys, and nervous system.",
      "These exposures are usually claimed by documented history rather than blanket presumption, which makes a clear record of your job and worksite especially valuable.",
    ],
    systems: ["Blood / bone marrow", "Liver and kidney", "Nervous system", "Skin"],
    ask: [
      "Given my MOS and worksite, which solvent exposures should be documented?",
      "Are blood-count or liver/kidney panels reasonable to establish a baseline?",
    ],
  },
  heavy_metal: {
    short: "Lead, cadmium, tungsten, depleted uranium fragments, and other metals from munitions, dust, paints, and industrial work.",
    where:
      "Firing ranges, armorers and gun crews, demolition, vehicle and aircraft maintenance, and embedded fragment injuries. Metal-laden dust was also common downrange.",
    body: [
      "Heavy metals can accumulate in bone, kidney, liver, and the nervous system. Depending on the metal, effects range from kidney injury and high blood pressure to cognitive and nerve symptoms.",
      "The body clears some metals slowly, so a meaningful body burden can persist years after the exposure ended.",
    ],
    systems: ["Kidney", "Nervous system", "Bone", "Cardiovascular"],
    ask: [
      "Is testing for a specific metal appropriate given my history?",
      "Could embedded fragments be contributing to my symptoms?",
    ],
  },
  asbestos_silica: {
    short: "Asbestos fibers and crystalline silica dust from ships, old buildings, brakes, insulation, and abrasive work.",
    where:
      "Navy ships and shipyards, engine and boiler rooms, demolition and construction, and any work that disturbed old insulation or generated rock/sand dust.",
    body: [
      "Asbestos fibers lodge in lung tissue and the lung lining and can cause scarring (asbestosis), lung cancer, and mesothelioma — often decades after exposure. Silica dust scars the lung (silicosis) and raises cancer and autoimmune risk.",
      "Because the latency is so long, a documented exposure history is essential even if you feel well today.",
    ],
    systems: ["Lungs and lung lining", "Immune / autoimmune"],
    ask: [
      "Given asbestos history, is periodic lung screening appropriate?",
      "Should my shipboard or demolition work be documented for the record?",
    ],
  },
  nerve_agent: {
    short: "Chemical-warfare nerve agents and related compounds — including low-level exposure from demolition of enemy stockpiles.",
    where:
      "The 1991 Khamisiyah demolition in the Gulf War released sarin/cyclosarin; some personnel also encountered agents through testing programs or storage sites.",
    body: [
      "Nerve agents block an enzyme the body needs to switch off nerve signals. Even low-level exposure has been studied in connection with the chronic, multi-symptom pattern many Gulf War veterans live with.",
      "Effects can involve the nervous system, mood, sleep, and cognition, and may overlap with Gulf War illness.",
    ],
    systems: ["Nervous system", "Cognition and mood", "Autonomic / multi-system"],
    ask: [
      "Could my symptoms fit the Gulf War illness pattern (38 CFR §3.317)?",
      "Should I be evaluated for the cognitive and autonomic symptoms I notice?",
    ],
  },
  gulf_war_agent: {
    short: "The combined Gulf War exposure picture — pesticides, anti-nerve-agent pills (PB), oil-fire smoke, and more — tied to chronic multi-symptom illness.",
    where:
      "Service in the Southwest Asia theater during the Gulf War era. The recognized framework covers undiagnosed illness and chronic multi-symptom illness rather than a single chemical.",
    body: [
      "Gulf War illness is a real, recognized pattern of fatigue, pain, gut trouble, cognitive 'fog,' and other symptoms that don't fit a single diagnosis. Research points to the combined chemical load of the deployment.",
      "Because it spans many body systems, care usually means addressing several drivers at once rather than chasing one cause.",
    ],
    systems: ["Whole-body / multi-system", "Nervous system", "Gut", "Energy and pain"],
    ask: [
      "Does my symptom cluster qualify under the Gulf War illness rules?",
      "Can we build a plan that addresses several symptoms together?",
    ],
  },
  radiation: {
    short: "Ionizing radiation and depleted uranium — from nuclear work, atomic-test participation, radar/nuclear equipment, or DU munitions and fragments.",
    where:
      "Atomic veterans, nuclear shipyard and weapons work, radar maintenance, and Gulf-era depleted-uranium environments (vehicle hits, cleanup, embedded fragments).",
    body: [
      "Ionizing radiation can damage DNA and is linked to several cancers; the VA recognizes a list of radiogenic cancers. Depleted uranium is both radioactive and a heavy metal, so kidney effects are a concern alongside cancer risk.",
      "Dose and proximity matter, which is why documenting your specific role and environment is important.",
    ],
    systems: ["Cancer risk (several types)", "Kidney (DU)", "Thyroid"],
    ask: [
      "Is my diagnosis on the VA radiogenic-cancer list?",
      "Given DU exposure, should kidney function be monitored?",
    ],
  },
  pfas_afff: {
    short: "PFAS 'forever chemicals,' largely from AFFF firefighting foam used in training and crash response.",
    where:
      "Flight lines, fire-training pits, crash crews, and bases where AFFF reached the soil and drinking water. PFAS persist in the body and the environment for years.",
    body: [
      "PFAS build up in the body and have been associated with high cholesterol, thyroid disruption, immune effects, kidney and testicular cancer, and pregnancy-related effects.",
      "Because they clear so slowly, blood levels can remain elevated long after the exposure source is gone.",
    ],
    systems: ["Thyroid / hormones", "Kidney", "Immune", "Cholesterol / metabolic"],
    ask: [
      "Is PFAS blood testing reasonable given my base and job?",
      "Should my thyroid, cholesterol, and kidney markers be reviewed?",
    ],
  },
};

// "How the cascade works" — the book's signature framing: an exposure rarely
// stays where it landed; it sets off a chain reaction across connected systems,
// and the exposures themselves came in compounding combinations.
export const EXPOSURE_CASCADE: Record<string, string> = {
  burn_pit:
    "Burn-pit smoke doesn't stop at the lungs. The ultrafine particles cross into the bloodstream and light an inflammatory fire that, for many veterans, never fully goes out — driving airway disease, but also feeding heart, brain, and immune problems that surface years later and look unrelated. And it rarely traveled alone: most who breathed the pits also breathed the dust and the diesel.",
  particulate:
    "Fine desert dust scars the smallest airways and keeps the immune system on alert long after the deployment ends. Because it usually arrived alongside burn-pit smoke, the two compound — one more thread in the cascade rather than a problem you can isolate.",
  pesticide:
    "Dioxin from Agent Orange stores in fat for decades and quietly disrupts the body's hormone and cellular signaling. That's why a single exposure in your twenties can surface as diabetes, heart disease, nerve injury, or cancer in your sixties — the same root, branching across systems over a lifetime.",
  water_contamination:
    "Contaminated water was absorbed every day — drinking, showering, even breathing the steam — so the dose built silently over months and years. Solvents strain the blood, kidneys, liver, and nervous system at once, and because the whole household drank the same water, the cascade can reach a veteran's family too.",
  chemical_solvent:
    "Solvents are absorbed through the lungs and skin and travel everywhere the blood goes. They burden the marrow, liver, kidneys, and nerves simultaneously — which is why solvent-exposed veterans often collect several 'unrelated' problems that actually share one source.",
  heavy_metal:
    "Metals don't pass through — they bank in bone, kidney, liver, and nerve tissue and compete with the minerals your body needs to run. That slow displacement keeps inflammation simmering and surfaces as kidney, blood-pressure, and nerve or cognitive symptoms years after the exposure ended.",
  asbestos_silica:
    "Asbestos and silica embed in lung tissue and sit there quietly, sometimes for decades, keeping a low inflammatory fire burning until it surfaces as scarring or cancer. That long delay is exactly why the exposure history has to be written down now, while you feel fine.",
  nerve_agent:
    "Even low-level nerve-agent exposure can leave the nervous system miscalibrated long after the event. It's one thread in the Gulf War cascade — woven together with the pills, the pesticides, and the smoke into a multi-system pattern that no single test explains.",
  gulf_war_agent:
    "Gulf War illness is the cascade made visible: pesticides, anti-nerve-agent pills, oil-fire smoke, and relentless stress, layered in one body, leaving fatigue, pain, gut trouble, and brain fog that don't fit a single diagnosis. The exposures came in combination, so the symptoms do too.",
  radiation:
    "Radiation damages DNA, and depleted uranium adds a heavy-metal load to the kidneys on top of cancer risk. The injury is cumulative and quiet — dose and proximity matter — which is why documenting your role and environment is part of the picture, not an afterthought.",
  pfas_afff:
    "PFAS are 'forever chemicals' for a reason: they build up and barely leave, so the body keeps reacting for years. They nudge the thyroid, cholesterol, immune system, and kidneys all at once — a slow systemic drift rather than one sharp illness.",
};

export type ConditionEdu = {
  what: string;
  link: string;
  track: string[];
};

export const CONDITION_EDU: Record<string, ConditionEdu> = {
  "Chronic rhinitis / sinusitis": {
    what: "Long-running inflammation of the nasal passages and sinuses — congestion, drainage, pressure, and repeated infections that don't fully clear.",
    link: "Inhaled burn-pit smoke and fine particulate irritate and inflame the upper airway. This is a recognized PACT Act presumptive condition for airborne-hazard exposure.",
    track: ["How many months/years symptoms have persisted", "Triggers and seasonal patterns", "Infections and treatments tried"],
  },
  "Asthma / reactive airway": {
    what: "Airways that tighten, swell, and produce mucus — wheeze, cough, chest tightness, and shortness of breath, sometimes only on exertion.",
    link: "Airborne hazards can trigger or worsen reactive airways. Asthma diagnosed after qualifying service is PACT Act presumptive.",
    track: ["When the diagnosis was first made", "Inhaler use and flare frequency", "Exertional vs. resting symptoms"],
  },
  "COPD / chronic bronchitis": {
    what: "Long-term airflow limitation with chronic cough and mucus, making breathing progressively harder.",
    link: "Sustained smoke and particulate injury contributes to chronic airway disease. COPD and chronic bronchitis are PACT Act presumptive.",
    track: ["Lung-function (spirometry) results over time", "Exertional limits", "Exacerbations per year"],
  },
  "Constrictive bronchiolitis": {
    what: "Scarring of the smallest airways that can cause real breathlessness even when chest X-rays and standard tests look normal.",
    link: "Strongly associated with deployment particulate and burn-pit exposure. It is PACT Act presumptive and often under-recognized.",
    track: ["Exertional symptoms despite normal imaging", "Specialist referrals", "Any biopsy or advanced testing"],
  },
  "Respiratory or lung cancer": {
    what: "Cancer of the lungs or breathing-related tissues.",
    link: "Recognized across multiple exposure pathways — PACT Act airborne hazards, Agent Orange, and radiation. Any respiratory cancer is PACT Act presumptive.",
    track: ["Exact diagnosis and date", "Treatment history", "Pathology details for your VSO"],
  },
  "Other cancer": {
    what: "Cancers in other body systems — brain, GI, blood/lymph, genitourinary, reproductive, head/neck, pancreatic, melanoma, and more.",
    link: "Many cancers are presumptive depending on the specific type and your exposure (PACT Act, Agent Orange, Camp Lejeune, or radiation). The type matters — confirm with your VSO.",
    track: ["Exact cancer type and stage", "Diagnosis date", "Which exposure pathway may apply"],
  },
  "Thyroid disorder": {
    what: "Problems with the thyroid gland — under- or over-active function, nodules, or thyroid cancer — affecting energy, weight, mood, and temperature.",
    link: "Hypothyroidism is an Agent Orange presumptive; thyroid cancer may be radiation-presumptive. PFAS and dioxins also disrupt thyroid signaling.",
    track: ["TSH and thyroid antibody results", "Energy, weight, and mood changes", "Any nodules on imaging"],
  },
  "Kidney disease": {
    what: "Reduced kidney function or kidney cancer — the kidneys filter the blood, so they take the brunt of many toxic exposures.",
    link: "Kidney cancer is presumptive (PACT Act, Camp Lejeune). Non-cancer kidney injury is linked by ATSDR to heavy metals and solvents — document with your clinician.",
    track: ["eGFR and creatinine over time", "Blood pressure", "Protein in urine"],
  },
  "Hypertension": {
    what: "Persistently high blood pressure, a major driver of heart, kidney, and stroke risk.",
    link: "Listed as an Agent Orange presumptive condition. Heavy metals and chronic inflammation are also studied contributors.",
    track: ["Home blood-pressure log", "Medications and doses", "Kidney markers"],
  },
  "Neurological / cognitive (TBI)": {
    what: "Brain and nerve symptoms — memory, focus, headaches, balance — including effects of traumatic brain injury.",
    link: "TBI is claimed by direct service connection (event-based). If the diagnosis is Parkinson's/Parkinsonism, that is presumptive (Agent Orange, Camp Lejeune).",
    track: ["Concussive events and dates", "Cognitive testing", "Headache and sleep patterns"],
  },
  "Peripheral neuropathy": {
    what: "Nerve damage in the hands and feet — numbness, tingling, burning, or weakness.",
    link: "Early-onset peripheral neuropathy is an Agent Orange presumptive. Solvents and heavy metals are also linked to nerve injury.",
    track: ["When symptoms began relative to service", "Distribution (feet/hands)", "Nerve-conduction testing"],
  },
  "Gut / GI disorder": {
    what: "Digestive problems — pain, bloating, irregular bowels, reflux — including functional disorders and GI cancers.",
    link: "GI cancers are PACT Act presumptive; functional GI disorders may qualify as Gulf War illness. The gut is also central to whole-body inflammation.",
    track: ["Symptom pattern and triggers", "Any scopes or imaging", "Weight changes"],
  },
  "Autoimmune disorder": {
    what: "Conditions where the immune system attacks the body's own tissues — affecting joints, skin, glands, or multiple systems.",
    link: "Specific ones are presumptive (AL amyloidosis — Agent Orange; sarcoidosis — PACT Act). Solvent, silica, and metal exposures are studied immune triggers.",
    track: ["Specific diagnosis and antibodies", "Flare pattern", "Organs involved"],
  },
  "Hormonal / reproductive": {
    what: "Hormone and reproductive effects — fertility, reproductive cancers, and endocrine disruption.",
    link: "Reproductive cancers are PACT Act presumptive. PFAS, dioxins, and solvents are recognized endocrine disruptors — discuss with your clinician.",
    track: ["Hormone panels", "Fertility history", "Any reproductive cancer details"],
  },
  "PTSD / mental health": {
    what: "Post-traumatic stress and related mental-health conditions — affecting sleep, mood, focus, and daily life.",
    link: "Established through an in-service stressor plus a current diagnosis — not exposure presumption. Mental and physical health are deeply connected, and support is available.",
    track: ["Sleep and mood patterns", "What helps and what worsens it", "Care team and supports"],
  },
};

// "Why it's connected" — these conditions are rarely isolated; they're threaded
// together through shared biology, most often the chronic inflammation that toxic
// exposure leaves behind.
export const CONDITION_CASCADE: Record<string, string> = {
  "Chronic rhinitis / sinusitis":
    "Your sinuses are the first filter the smoke and dust hit, so chronic congestion is often the upper end of the same airway inflammation driving deeper lung problems — not a separate, minor complaint.",
  "Asthma / reactive airway":
    "Reactive airways are inflammation announcing itself loudly. The same inflammatory fire often runs quieter elsewhere, which is why airway symptoms and whole-body fatigue or fog frequently travel together.",
  "COPD / chronic bronchitis":
    "Years of particulate injury keep the airways inflamed and remodeling. It rarely stands alone — the same systemic inflammation taxes the heart and energy systems at the same time.",
  "Constrictive bronchiolitis":
    "The damage is in the smallest airways, below what ordinary tests see — which is exactly why so many veterans were told they were fine while the cascade kept moving. Normal imaging is the start of the conversation, not the end.",
  "Respiratory or lung cancer":
    "Cancer is the cascade's hardest edge — the end of a long road of inflammation, DNA damage, and cellular stress that may have begun decades earlier with smoke, herbicide, or radiation.",
  "Other cancer":
    "Different exposures favor different tissues, but the underlying story is shared: persistent toxic burden and inflammation wearing down the body's repair and quality-control systems over years.",
  "Thyroid disorder":
    "The thyroid sits downstream of dioxins, PFAS, and radiation, and it sets the tempo for energy, weight, mood, and temperature — so when it drifts, the effects ripple into nearly every system.",
  "Kidney disease":
    "The kidneys filter everything, so they take the brunt of metals, solvents, and PFAS. As they strain, blood pressure and mineral balance follow — one more example of how a single burden spreads outward.",
  "Hypertension":
    "High blood pressure is often inflammation and toxic burden showing up in the blood vessels. It's recognized for Agent Orange, and it travels with the same drivers behind kidney and heart strain.",
  "Neurological / cognitive (TBI)":
    "Blast and toxic exposure can both inflame the brain, and neuroinflammation doesn't stay put — it tangles with sleep, mood, and energy, which is why 'just getting older' rarely explains what veterans feel.",
  "Peripheral neuropathy":
    "Nerves are exquisitely sensitive to solvents, metals, and herbicides. Numbness and burning are often the visible edge of a wider neurotoxic and inflammatory process.",
  "Gut / GI disorder":
    "The gut trains the immune system and talks constantly to the brain, so gut trouble after service is rarely 'just digestion' — it both feeds and reflects the whole-body inflammation behind many other symptoms.",
  "Autoimmune disorder":
    "When barriers break down and inflammation never stands down, the immune system can lose its bearings and start targeting the body itself — a recognized risk after solvent, silica, metal, and Gulf War exposure.",
  "Hormonal / reproductive":
    "Many exposures are endocrine disruptors — they imitate or block the body's hormone signals. Because hormones coordinate so many systems, that disruption surfaces as fertility, mood, metabolic, and reproductive effects at once.",
  "PTSD / mental health":
    "Mind and body share one inflammatory, stress-driven biology. Trauma keeps the nervous system on alert, and that same vigilance worsens sleep, pain, and gut symptoms — which is why caring for mental health is part of physical restoration, not separate from it.",
};

// Which exposure classes are commonly studied in connection with each condition.
// LEGACY LABELS — the original 15-item list. Veterans who used the app before
// the catalog expanded have these exact strings saved on their records, so they
// must keep resolving or those records would silently lose their connections.
// Nothing new writes these.
const LEGACY_CONDITION_EXPOSURES: Record<string, string[]> = {
  "Chronic rhinitis / sinusitis": ["burn_pit", "particulate", "chemical_solvent"],
  "Asthma / reactive airway": ["burn_pit", "particulate", "chemical_solvent", "pfas_afff"],
  "COPD / chronic bronchitis": ["burn_pit", "particulate"],
  "Constrictive bronchiolitis": ["burn_pit", "particulate"],
  "Respiratory or lung cancer": ["burn_pit", "radiation", "chemical_solvent", "particulate", "asbestos_silica"],
  "Other cancer": ["burn_pit", "radiation", "pesticide", "chemical_solvent", "heavy_metal", "pfas_afff"],
  "Thyroid disorder": ["radiation", "chemical_solvent", "pesticide", "pfas_afff"],
  "Kidney disease": ["heavy_metal", "radiation", "pfas_afff", "water_contamination"],
  "Hypertension": ["heavy_metal", "chemical_solvent", "pesticide"],
  "Neurological / cognitive (TBI)": ["heavy_metal", "nerve_agent"],
  "Peripheral neuropathy": ["heavy_metal", "chemical_solvent", "nerve_agent", "pesticide"],
  "Gut / GI disorder": ["heavy_metal", "pesticide", "water_contamination", "gulf_war_agent"],
  "Autoimmune disorder": ["chemical_solvent", "pesticide", "heavy_metal", "asbestos_silica"],
  "Hormonal / reproductive": ["chemical_solvent", "pesticide", "radiation", "pfas_afff"],
  "PTSD / mental health": ["nerve_agent", "gulf_war_agent"],
};

// The live mapping is DERIVED from the condition catalog (src/lib/conditions.ts)
// so the catalog stays the one place a condition's documented associations are
// declared. Legacy labels are merged underneath.
export const CONDITION_EXPOSURES: Record<string, string[]> = {
  ...LEGACY_CONDITION_EXPOSURES,
  ...Object.fromEntries(
    CONDITION_CATALOG.filter((c) => c.exposures.length > 0).map((c) => [c.label, c.exposures]),
  ),
};

export type SolutionPillar = {
  key: string;
  icon: string; // svg path
  title: string;
  why: string;
  everyday: string[];
  practitioner: string[];
  // 🔴 DELIBERATELY NO `exposures` / `conditions` FIELDS. These pillars must never
  // be targeted at a veteran's own record. Targeting is what turned general
  // wellness copy into a personalised funnel: a veteran who logged heavy metals
  // was shown "Support natural detox" under a heading reading "Tailored to your
  // record". The founder separately sells nutritional supplements, the nonprofit
  // sells nothing, and no money needs to change hands for that click path to be
  // the story. Removing the FIELDS (rather than emptying the arrays) makes the
  // targeting unrepresentable instead of merely absent. Do not add them back.
};

// General, non-personalised wellness education for veterans. Shown to everyone in
// the same order, never matched to anyone's exposures or conditions.
// Not treatment, not a prescription, never part of a VA claim. Every pillar points
// back to "explore with your own clinician."
//
// ⚠️ Banned throughout this array: repair, regenerate, restore (in a health sense),
// replenish, deplete/depletion, detox as an aspiration, cleanse, chelate, nutrient,
// vitamin, mineral-as-something-you-lack, supplement, protocol, boost, optimize.
// "Detox" and "cleanse" survive in exactly one place — inside the warning telling a
// veteran to avoid them.
export const SOLUTION_PILLARS: SolutionPillar[] = [
  {
    key: "reduce",
    icon: "M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10",
    title: "Reduce the burden first",
    why: "The body can't heal while it's still under attack. Often the first move isn't to do more — it's to stop losing so much. Reducing what keeps draining you (ongoing exposure, inflammatory inputs, poor sleep) frees the body to redirect its energy toward repair. Every burden removed is energy returned to the system.",
    everyday: [
      "Have your home water tested if you're near a known contaminated site, and consider a certified filter.",
      "Use ventilation and proper protection for any dusty, fume-heavy, or solvent work.",
      "Cut the obvious fuel on the fire — ultra-processed food, excess sugar, heavy alcohol.",
    ],
    practitioner: ["Ask whether testing your home water or environment makes sense for your history."],
  },
  {
    key: "nervous",
    icon: "M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8",
    title: "Signal safety to the body",
    why: "For many veterans the war didn't end inside the body when the deployment ended — the nervous system stayed on guard. But deep sleep, digestion, hormones, and tissue repair all require the body to sense safety first. Teaching it, gradually and repeatedly, that it's safe enough to repair is real medicine, not a soft add-on.",
    everyday: [
      "Practice slow breathing, prayer, or meditation — even a few minutes daily.",
      "Spend time outdoors and in nature; keep steady daily routines.",
      "Protect connection — isolation is a physical risk, not just a mood.",
    ],
    practitioner: ["Ask about trauma-informed care if stress or past trauma is driving symptoms."],
  },
  {
    key: "sleep",
    icon: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z",
    title: "Restore sleep and rhythm",
    why: "The body runs on rhythm, and service scrambles it — night ops, shift work, vigilance, time zones. Predictability creates safety, and over time rhythm becomes medicine. Deep sleep is when the brain and body clear waste and rebuild, so protecting it pays off across almost every condition.",
    everyday: [
      "Keep a consistent wake time, even on weekends, and get morning light.",
      "Limit screens late; keep the bedroom cool, dark, and quiet.",
      "Build a simple wind-down ritual that tells your body the day is ending.",
    ],
    practitioner: ["Ask about screening for sleep apnea or insomnia if sleep is broken or unrefreshing."],
  },
  {
    key: "nutrition",
    icon: "M3 2v7c0 1.1.9 2 2 2h0a2 2 0 0 0 2-2V2M5 11v11M12 2a4 4 0 0 0-4 4c0 2 2 3 4 3s4-1 4-3a4 4 0 0 0-4-4zM12 9v13M21 15V2a5 5 0 0 0-3 4.5c0 2 1 3 3 3z",
    title: "Eat in a way you can keep up",
    why: "Nobody eats their way out of an exposure, and this app has nothing to sell you. But blood pressure, blood sugar and weight are the things VA cohorts keep finding alongside worse outcomes — and unlike your service history, they are still movable. Regular meals you can actually sustain do more than any short-lived overhaul.",
    everyday: [
      "Build meals around vegetables, fruit, fiber, and protein you like enough to keep eating.",
      "Go easy on ultra-processed food, sugar, and alcohol, and stay well hydrated.",
      "Eat on something like a schedule — erratic eating makes blood sugar harder to hold steady.",
    ],
    practitioner: ["Ask what dietary changes are safe alongside your medications and any kidney or liver condition you already have."],
  },
  {
    key: "gut",
    icon: "M12 2a3 3 0 0 0-3 3v1a4 4 0 0 0-2 7c0 3 2 4 2 6a3 3 0 0 0 6 0c0-2 2-3 2-6a4 4 0 0 0-2-7V5a3 3 0 0 0-3-3z",
    title: "Look after your gut",
    why: "Gut symptoms are among the most common things veterans report and among the least often worked up. Ongoing pain, bloating, reflux or a change in your bowels is worth a real evaluation rather than a diet experiment — some of it is treatable, and some of it is a sign of something that needs finding.",
    everyday: [
      "Notice and log the foods that trigger symptoms — the pattern is the useful part.",
      "Fiber and fermented foods suit most people; go by how you actually feel.",
      "Manage stress where you can — the gut and nervous system are tightly linked.",
    ],
    practitioner: ["Ask about evaluation for ongoing pain, bloating, reflux, or irregular bowels."],
  },
  {
    key: "clearance",
    icon: "M12 2a7 7 0 0 0-7 7c0 3 2 5 2 8a5 5 0 0 0 10 0c0-3 2-5 2-8a7 7 0 0 0-7-7zM9 22h6",
    title: "How your body clears things, and what to avoid",
    why: "Your liver, kidneys, gut and skin already do this work, and there is no product that does it better. What there is, is an industry selling veterans 'cleanses' and chelation for exactly this fear. Those are not validated, they can be dangerous, and the honest advice is the unglamorous kind below.",
    everyday: [
      "Stay hydrated and keep things regular — fiber does the work in the gut.",
      "Move your body. Sweating is one ordinary route your body already uses.",
      "Go easy on alcohol so the liver can do its job.",
    ],
    practitioner: [
      "Avoid 'provoked' or 'chelation-challenge' urine testing, hair mineral panels, and any unsupervised chelation or 'cleanse' — they are not validated, they mislead, and they have killed people.",
      "Ask before starting anything sold as a cleanse or a binder — some interact with medications or stress the kidneys and liver.",
    ],
  },
  {
    key: "movement",
    icon: "M13 4a2 2 0 1 0 0-.01M19 9l-4 2-3-2-3 4M9 13l-2 7M14 13l2 3 3 1",
    title: "Rebuild capacity through movement",
    why: "The deeper goal isn't just fewer symptoms — it's capacity: a body that handles stress without collapsing. Movement is the closest thing to a free miracle drug a veteran has. It raises the brain's own repair signal, lowers inflammation, and rebuilds the very systems the cascade tore down. A walk counts — start there.",
    everyday: [
      "Aim for daily walking and gentle strength work you can sustain.",
      "Build up slowly if breathing or fatigue limit you.",
      "Pair movement with morning light and the breathing above.",
    ],
    practitioner: ["Ask what activity level is safe given your heart, lungs, and any conditions."],
  },
  {
    key: "testing",
    icon: "M9 2h6M10 2v4.5L5.2 16A2 2 0 0 0 7 19h10a2 2 0 0 0 1.8-3L14 6.5V2",
    title: "Test before you treat — build a team",
    why: "Restoration works best with real information and the right people. Baseline and follow-up testing turns 'I feel off' into a tracked picture you can act on. And remember the Gulf War lesson: 'your tests look normal' is the beginning of the conversation, not the end of it.",
    everyday: [
      "Keep your own copy of every lab, scan, and note — the app stores records too.",
      "Track symptoms over time so patterns show up.",
      "Build a team you trust: VA primary care, an accredited VSO for anything claim-related, and specialists your VA doctor refers you to.",
    ],
    practitioner: ["Ask which baseline labs fit your exposures (kidney, liver, thyroid, inflammation markers), and 'will you test before you treat, and coordinate with my VA doctors?'"],
  },
];

// Free, first-step actions drawn from the book's "What To Do Monday Morning"
// playbook — things a veteran can start this week, most of them at no cost.
export const START_THIS_WEEK: string[] = [
  "Become the historian of your own timeline: on paper or your phone, list where and when you served and what you were exposed to, beside your symptoms in the order they arrived. Bring that one page to every appointment. (This app builds it for you.)",
  "If you're enrolled in VA care, ask for your PACT Act Toxic Exposure Screening — it's free, takes about 10 minutes, and puts your exposures on the official record.",
  "Move your body daily. A walk counts. It's the closest thing to a free miracle drug a veteran has.",
  "Fight for your sleep like the vital sign it is.",
  "If you smoke, ask VA about quitting — it's free, and 1-855-QUIT-VET is staffed by people who work with veterans.",
  "Get sunlight and get outside.",
  "Reach one human being. Connection is medicine; isolation is a physical risk.",
  "Subtract one obvious harm you already know about.",
];
