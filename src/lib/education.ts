// Educational content for the learning pages (Exposures, Conditions, Solutions).
// This is EDUCATION, not medical or legal advice. No product names, no doses, no
// treatment claims — only what documented science describes and what a veteran can
// reasonably discuss with their own clinician or practitioner. Sources: ATSDR
// toxicological profiles, VA / PACT Act materials, and peer-reviewed literature.
// Legal/claim citations live in citations.ts and are reused on these pages.

export const EXPOSURE_LABEL: Record<string, string> = {
  burn_pit: "Burn pits",
  heavy_metal: "Heavy metals",
  chemical_solvent: "Chemical / solvent",
  water_contamination: "Water contamination",
  pesticide: "Pesticide / herbicide",
  asbestos_silica: "Asbestos / silica",
  nerve_agent: "Nerve agent",
  particulate: "Particulate / dust",
  radiation: "Radiation / depleted uranium",
  pfas_afff: "PFAS / AFFF",
  gulf_war_agent: "Gulf War agent",
};

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
      "Many pesticides act on the nervous system and can stress the liver's detoxification pathways. Exposure decades ago can still be relevant because dioxins store in fat tissue.",
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

// Which exposure classes are commonly studied in connection with each condition.
export const CONDITION_EXPOSURES: Record<string, string[]> = {
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

export type SolutionPillar = {
  key: string;
  icon: string; // svg path
  title: string;
  why: string;
  everyday: string[];
  practitioner: string[];
  // exposure classes / condition labels this pillar is most relevant to
  exposures: string[];
  conditions: string[];
};

// Root-cause, whole-person education. General wellness areas only — not treatment,
// not a prescription, never a claim. Every pillar points back to "explore with your
// own clinician or practitioner."
export const SOLUTION_PILLARS: SolutionPillar[] = [
  {
    key: "reduce",
    icon: "M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10",
    title: "Reduce ongoing exposure",
    why: "Healing is hard while the source is still present. For persistent toxicants like PFAS, mold, lead, or solvents at home or work, lowering continued intake is the foundation everything else builds on.",
    everyday: [
      "Have your home water tested if you're near a known contaminated site, and consider a certified filter.",
      "Improve ventilation and use proper protection for any dusty, fume-heavy, or solvent work.",
      "Reduce new sources where you can — check labels and air quality.",
    ],
    practitioner: ["Ask whether testing your home environment or water makes sense for your history."],
    exposures: ["pfas_afff", "water_contamination", "heavy_metal", "chemical_solvent", "particulate"],
    conditions: ["Kidney disease", "Thyroid disorder", "Asthma / reactive airway"],
  },
  {
    key: "nutrition",
    icon: "M3 2v7c0 1.1.9 2 2 2h0a2 2 0 0 0 2-2V2M5 11v11M12 2a4 4 0 0 0-4 4c0 2 2 3 4 3s4-1 4-3a4 4 0 0 0-4-4zM12 9v13M21 15V2a5 5 0 0 0-3 4.5c0 2 1 3 3 3z",
    title: "Anti-inflammatory nutrition",
    why: "Many exposure-related conditions share one driver: chronic inflammation. A whole-food, colorful, fiber-rich way of eating gives the body the raw materials it uses to repair and to calm that inflammation.",
    everyday: [
      "Build meals around vegetables, fruit, fiber, and clean protein; cruciferous vegetables (broccoli, cabbage) are widely studied for supporting the body's own detox enzymes.",
      "Reduce ultra-processed foods, excess sugar, and alcohol — all of which add to inflammation.",
      "Stay well hydrated to support the kidneys.",
    ],
    practitioner: ["Ask whether an anti-inflammatory eating pattern fits your conditions and any medications."],
    exposures: ["burn_pit", "particulate", "pesticide", "gulf_war_agent"],
    conditions: ["Gut / GI disorder", "Autoimmune disorder", "Hypertension", "Thyroid disorder"],
  },
  {
    key: "detox",
    icon: "M12 2a7 7 0 0 0-7 7c0 3 2 5 2 8a5 5 0 0 0 10 0c0-3 2-5 2-8a7 7 0 0 0-7-7zM9 22h6",
    title: "Support natural detox pathways",
    why: "The liver, kidneys, gut, and skin are how the body clears toxicants. Supporting those organs — rather than any gimmick — is what 'detox' really means.",
    everyday: [
      "Prioritize sleep, hydration, fiber (which binds waste in the gut), and regular bowel movements.",
      "Sweating through exercise or sauna is studied as one route the body uses to release some toxicants.",
      "Go easy on alcohol so the liver can do its job.",
    ],
    practitioner: ["Ask before any supplement or 'cleanse' — some interact with medications or stress the kidneys/liver."],
    exposures: ["heavy_metal", "pesticide", "chemical_solvent", "pfas_afff"],
    conditions: ["Kidney disease", "Peripheral neuropathy"],
  },
  {
    key: "gut",
    icon: "M12 2a3 3 0 0 0-3 3v1a4 4 0 0 0-2 7c0 3 2 4 2 6a3 3 0 0 0 6 0c0-2 2-3 2-6a4 4 0 0 0-2-7V5a3 3 0 0 0-3-3z",
    title: "Gut health",
    why: "The gut trains the immune system and influences inflammation everywhere. Gut symptoms are common after toxic exposure and Gulf War service, and tending the gut often helps the whole body settle.",
    everyday: [
      "Feed beneficial bacteria with fiber and fermented foods.",
      "Notice and log foods that trigger symptoms.",
      "Manage stress — the gut and nervous system are tightly linked.",
    ],
    practitioner: ["Ask about evaluation if you have ongoing pain, bloating, reflux, or irregular bowels."],
    exposures: ["gulf_war_agent", "pesticide", "heavy_metal"],
    conditions: ["Gut / GI disorder", "Autoimmune disorder"],
  },
  {
    key: "sleep",
    icon: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z",
    title: "Sleep and circadian rhythm",
    why: "Deep sleep is when the brain and body clear waste and repair. Poor sleep amplifies pain, mood, and inflammation, so protecting it pays off across almost every condition.",
    everyday: [
      "Keep a consistent sleep and wake time, even on weekends.",
      "Get morning light and limit screens late at night.",
      "Keep the bedroom cool, dark, and quiet.",
    ],
    practitioner: ["Ask about evaluation for sleep apnea or insomnia if sleep is broken or unrefreshing."],
    exposures: ["nerve_agent", "gulf_war_agent"],
    conditions: ["PTSD / mental health", "Neurological / cognitive (TBI)"],
  },
  {
    key: "nervous",
    icon: "M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8",
    title: "Calm the nervous system",
    why: "Chronic stress keeps the body in 'fight or flight,' which worsens blood pressure, gut symptoms, sleep, and pain. Training the nervous system toward calm is a genuine, studied lever on physical health.",
    everyday: [
      "Practice slow breathing, prayer, or meditation — even a few minutes daily.",
      "Spend time outdoors and in nature.",
      "Protect connection — isolation makes everything harder.",
    ],
    practitioner: ["Ask about trauma-informed care if stress or past trauma is driving symptoms."],
    exposures: ["nerve_agent", "gulf_war_agent"],
    conditions: ["PTSD / mental health", "Hypertension", "Gut / GI disorder"],
  },
  {
    key: "movement",
    icon: "M13 4a2 2 0 1 0 0-.01M19 9l-4 2-3-2-3 4M9 13l-2 7M14 13l2 3 3 1",
    title: "Movement and circulation",
    why: "Regular movement lowers inflammation, supports the heart, lungs, and metabolism, helps clear waste, and lifts mood. It doesn't have to be intense to count.",
    everyday: [
      "Aim for daily walking and gentle strength work you can sustain.",
      "Build up slowly if breathing or fatigue limit you.",
      "Pair movement with the breathing and outdoor time above.",
    ],
    practitioner: ["Ask what activity level is safe given your heart, lungs, and any conditions."],
    exposures: ["burn_pit", "particulate"],
    conditions: ["COPD / chronic bronchitis", "Hypertension", "Asthma / reactive airway"],
  },
  {
    key: "testing",
    icon: "M9 2h6M10 2v4.5L5.2 16A2 2 0 0 0 7 19h10a2 2 0 0 0 1.8-3L14 6.5V2",
    title: "Targeted testing and a real care team",
    why: "Root-cause work is most effective with the right information. Baseline and follow-up testing turns 'I feel off' into a tracked picture you and a practitioner can act on.",
    everyday: [
      "Keep your own copy of every lab, scan, and note — the app stores records too.",
      "Track symptoms over time so patterns show up.",
      "Build a team you trust: VA primary care, a VSO, and, if you choose, a functional or integrative practitioner.",
    ],
    practitioner: ["Ask which baseline labs make sense for your exposures (e.g., kidney, liver, thyroid, inflammation markers)."],
    exposures: ["pfas_afff", "heavy_metal", "radiation", "water_contamination"],
    conditions: ["Kidney disease", "Thyroid disorder", "Hypertension"],
  },
];
