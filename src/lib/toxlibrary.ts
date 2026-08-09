// The Exposure Library — a cited, mechanistic encyclopedia of the toxicants the
// app tracks and the organs they target.
//
// GUARDRAILS (per council): this is DOCUMENTATION, not treatment. Every entry is
// grounded in the government's / science's own record — VA presumptive lists
// (PACT Act, 38 CFR, Camp Lejeune), ATSDR ToxFAQs/tox profiles, IARC, NTP. No
// products, no doses, no cure claims. Every page ends pointing back to the
// veteran's clinician and VSO. Content is a first pass and has NOT been
// externally reviewed — there is no science advisory board (an earlier version of
// this comment said one would verify it). Needs a named clinical reviewer before
// anyone describes it as verified.

export type Toxicant = {
  slug: string;
  name: string;
  kind: "metal" | "contaminant" | "topic";
  short: string;
  where: string;            // service exposure pathway
  harm: string[];           // documented mechanism of damage
  retention: string;        // how long it persists in the body
  organs: string[];         // organ slugs it targets / stores in
  conditions: string;       // the conditions the government already links to it
  untreated: string;        // what happens if left unaddressed (with a clinician off-ramp)
  tests: string[];          // tests to ask a clinician about
  iarc?: string;            // carcinogen classification, where applicable
  sources: string[];
};

export type Organ = {
  slug: string;
  name: string;
  what: string;
  targetedBy: string[];     // toxicant names that target it
  mechanism: string[];      // what toxicants do there (documented)
  conditions: string;       // conditions the government links to damage here
  untreated: string;        // untreated -> chronic -> disease, with a clinician off-ramp
};

const CLINICIAN = "Bring this to your clinician and your VSO — they decide what testing and care, if any, is right for you.";

// ── Toxicants ─────────────────────────────────────────────────────────────────
export const TOXICANTS: Toxicant[] = [
  {
    slug: "lead", name: "Lead", kind: "metal",
    short: "A heavy metal in ammunition primers, firing-range air, fuels, paints, and industrial work.",
    where: "Firing ranges (especially indoors), armorers and range cadre, demolition, vehicle/aircraft maintenance, and lead-based paint on older installations and ships.",
    harm: [
      "Lead has no known safe level. It blocks ALAD (delta-aminolevulinic acid dehydratase), an enzyme the body needs to build hemoglobin (the oxygen carrier in red blood cells) — which is why a blood lead test is often read alongside blood-count markers, not alone.",
      "Because it mimics calcium, lead crosses into bone and the brain and disrupts the calcium-dependent signaling those tissues rely on.",
    ],
    retention: "Stored in bone with a half-life measured in decades. It can re-enter the blood years later during bone turnover — aging, illness, or calcium stress — which is why a 'normal' blood lead does not rule out a lifetime burden.",
    organs: ["bone", "bone-marrow", "brain", "kidney", "heart"],
    conditions: "ATSDR links lead to chronic kidney disease, high blood pressure and other cardiovascular effects, and nervous-system and cognitive effects; it is also studied in peripheral neuropathy. Confirm how any of these applies to your claim with your VSO.",
    untreated: "A high bone-lead burden can keep seeding the bloodstream for years, contributing to rising blood pressure, declining kidney function, and cognitive or nerve symptoms that are easy to mistake for ordinary aging.",
    tests: ["Blood lead (reflects recent exposure)", "Bone-lead K-XRF scan where available (stored lead)", "Kidney function (eGFR, creatinine) and blood pressure"],
    iarc: "IARC Group 2A (inorganic lead, probably carcinogenic to humans).",
    sources: ["ATSDR ToxFAQs: Lead", "IARC Monographs Vol. 87", "VA / ATSDR"],
  },
  {
    slug: "cadmium", name: "Cadmium", kind: "metal",
    short: "A heavy metal in batteries, pigments, plating, welding fumes, and burn-pit smoke.",
    where: "Battery and electronics work, welding and brazing, corrosion-resistant coatings, and inhaled burn-pit particulate.",
    harm: [
      "Cadmium concentrates in the kidneys, where it damages the filtering tubules and causes the body to spill protein and minerals into the urine.",
      "It competes with zinc — a mineral hundreds of enzymes depend on — and drives oxidative stress in the lungs and bone.",
    ],
    retention: "Extremely long biological half-life (often 10–30 years) in the kidney and liver; it accumulates across a career.",
    organs: ["kidney", "lungs", "bone"],
    conditions: "ATSDR links cadmium to chronic kidney disease and bone weakening; inhaled cadmium is associated with lung cancer.",
    untreated: "Ongoing kidney injury can progress silently for years before it shows on standard labs, and bone loss and lung effects can follow. Early kidney-function monitoring matters.",
    tests: ["Urine cadmium testing", "Kidney function markers your clinician chooses (eGFR, creatinine, and others as indicated)"],
    iarc: "IARC Group 1 (carcinogenic to humans).",
    sources: ["ATSDR ToxFAQs: Cadmium", "IARC Group 1", "VA / ATSDR"],
  },
  {
    slug: "depleted-uranium", name: "Depleted uranium (DU)", kind: "metal",
    short: "A dense metal used in armor-piercing rounds and tank armor — both radioactive and a heavy metal.",
    where: "Tank crews, vehicles struck by DU rounds, cleanup and recovery of damaged vehicles, and embedded fragments.",
    harm: [
      "DU is a chemical kidney toxin like other heavy metals, and it is weakly radioactive, so it carries both a chemical and a radiological concern.",
      "Inhaled or embedded DU can keep releasing small amounts into the body over time.",
    ],
    retention: "Settles in the kidney and bone; embedded fragments can release uranium for years and are tracked long-term.",
    organs: ["kidney", "bone"],
    conditions: "The VA runs a Depleted Uranium Follow-Up Program; DU is monitored for kidney effects and is part of the radiation/heavy-metal exposure picture.",
    untreated: "Unmonitored kidney effects can progress; embedded fragments in particular warrant long-term follow-up.",
    tests: ["VA Depleted Uranium Follow-Up Program (24-hour urine uranium)", "Kidney function (eGFR, creatinine)"],
    sources: ["ATSDR ToxFAQs: Uranium", "VA Depleted Uranium Follow-Up Program"],
  },
  {
    slug: "arsenic", name: "Arsenic", kind: "metal",
    short: "A metalloid in contaminated water, pesticides, treated wood, and combustion/burn-pit smoke.",
    where: "Contaminated base water supplies, pesticide handling, burn pits, and some industrial processes.",
    harm: [
      "Arsenic interferes with cellular energy production and damages DNA, which is why it is a recognized cause of several cancers.",
      "It injures small blood vessels and peripheral nerves and can cause characteristic skin changes.",
    ],
    retention: "Cleared from blood within days, but chronic intake produces ongoing low-level body burden; hair and nails reflect past exposure.",
    organs: ["skin", "liver", "nervous-system", "kidney"],
    conditions: "ATSDR and IARC link arsenic to cancers of the skin, lung, and bladder, to peripheral neuropathy, and to cardiovascular effects.",
    untreated: "Chronic arsenic exposure raises long-term cancer risk and can produce progressive nerve and skin disease.",
    tests: ["Speciated 24-hour urine arsenic (separates seafood arsenic from toxic forms)", "Skin and neurological evaluation"],
    iarc: "IARC Group 1 (carcinogenic to humans).",
    sources: ["ATSDR ToxFAQs: Arsenic", "IARC Group 1", "VA / ATSDR"],
  },
  {
    slug: "mercury", name: "Mercury", kind: "metal",
    short: "A heavy metal in some instruments, dental amalgam, batteries, and certain industrial processes.",
    where: "Instrument and electrical repair, dental settings, and some manufacturing and disposal work.",
    harm: [
      "Mercury — especially its organic and vapor forms — crosses into the brain and kidneys and disrupts nerve-cell function.",
      "It binds selenium and sulfur-containing proteins the body relies on for antioxidant defense.",
    ],
    retention: "Varies by form; settles in the brain and kidney and can persist for months to years.",
    organs: ["brain", "kidney", "nervous-system"],
    conditions: "ATSDR links mercury to nervous-system and kidney effects (tremor, cognitive and mood changes, kidney injury).",
    untreated: "Continued exposure can deepen neurological and kidney injury; removing the source is the first step.",
    tests: ["Blood and 24-hour urine mercury", "Neurological evaluation"],
    sources: ["ATSDR ToxFAQs: Mercury", "VA / ATSDR"],
  },
  {
    slug: "hexavalent-chromium", name: "Hexavalent chromium (Cr-VI)", kind: "metal",
    short: "A highly toxic form of chromium from welding, plating, paints, and the Qarmat Ali site (Iraq, 2003).",
    where: "Welding stainless steel, chrome plating, primer paints, and documented exposure at the Qarmat Ali water-treatment plant.",
    harm: [
      "Inhaled Cr-VI is a potent lung carcinogen and a strong irritant to the airways, sinuses, and skin.",
      "It generates oxidative damage and harms DNA in the cells lining the airway.",
    ],
    retention: "Cleared relatively quickly, but the airway and DNA damage from inhalation can be lasting.",
    organs: ["lungs", "sinuses", "kidney"],
    conditions: "IARC lists Cr-VI as a known lung carcinogen; the VA established a Qarmat Ali surveillance program for exposed service members.",
    untreated: "Long-term lung-cancer risk and chronic airway/sinus injury make documentation and screening important.",
    tests: ["Pulmonary function testing and chest imaging", "Enrollment in the VA Qarmat Ali surveillance program if eligible"],
    iarc: "IARC Group 1 (chromium VI, carcinogenic to humans).",
    sources: ["ATSDR ToxFAQs: Chromium", "IARC Group 1", "VA Qarmat Ali program"],
  },
  {
    slug: "manganese", name: "Manganese", kind: "metal",
    short: "An essential trace metal that is neurotoxic in excess — from welding fumes and some munitions.",
    where: "Welding (a major source of manganese fume), steel work, and some ordnance.",
    harm: [
      "Excess manganese accumulates in a brain region called the basal ganglia and can produce a Parkinson-like movement and mood disorder ('manganism').",
    ],
    retention: "Tightly regulated when intake is normal, but heavy inhalation can overwhelm clearance and deposit in the brain.",
    organs: ["brain", "liver"],
    conditions: "ATSDR links high manganese inhalation to a Parkinson-like neurological syndrome.",
    untreated: "Movement, balance, and mood symptoms can progress with continued exposure; a neurological evaluation is warranted.",
    tests: ["Neurological evaluation", "Manganese testing interpreted by a clinician"],
    sources: ["ATSDR ToxFAQs: Manganese", "VA / ATSDR"],
  },
  {
    slug: "tungsten", name: "Tungsten", kind: "metal",
    short: "A dense metal in newer armor-piercing rounds and heavy alloys.",
    where: "Tank and crew-served gunnery, embedded fragments, and metalworking.",
    harm: ["Tungsten heavy-metal alloys are under study for effects on bone, blood, and immune tissue, especially from embedded fragments."],
    retention: "Embedded fragments can release metal over time; tungsten is an emerging, still-studied exposure.",
    organs: ["bone", "fragment-sites"],
    conditions: "Tungsten-alloy effects are an emerging area; document the exposure and any embedded fragments.",
    untreated: "Embedded fragments warrant long-term monitoring even when no condition is yet recognized.",
    tests: ["Imaging for retained fragments", "Discuss monitoring with your clinician"],
    sources: ["ATSDR ToxGuide: Tungsten", "DoD fragment surveillance"],
  },
  {
    slug: "cobalt", name: "Cobalt", kind: "metal",
    short: "A hard-metal component of tool steel, alloys, and some munitions.",
    where: "Hard-metal machining, alloy work, and tank/artillery rounds.",
    harm: ["Inhaled cobalt can inflame and scar the lungs ('hard-metal lung disease') and affect the heart and thyroid."],
    retention: "Cleared over weeks to months; lung injury can be lasting.",
    organs: ["lungs", "heart", "thyroid"],
    conditions: "ATSDR links inhaled cobalt to lung disease and heart effects.",
    untreated: "Progressive lung scarring is possible with continued inhalation.",
    tests: ["Pulmonary function testing", "Cardiac evaluation if symptomatic"],
    sources: ["ATSDR ToxFAQs: Cobalt"],
  },
  {
    slug: "nickel", name: "Nickel", kind: "metal",
    short: "A metal in plating, alloys, welding fume, and coins/hardware.",
    where: "Welding, plating, and metalworking.",
    harm: ["Inhaled nickel compounds irritate the airways and sinuses and are linked to respiratory cancer; nickel is also a common skin allergen."],
    retention: "Cleared over days to weeks; inhalation injury can persist.",
    organs: ["lungs", "sinuses", "skin"],
    conditions: "IARC lists certain nickel compounds as carcinogenic to the respiratory tract.",
    untreated: "Chronic airway injury and elevated respiratory-cancer risk with ongoing inhalation.",
    tests: ["Pulmonary function testing and chest imaging"],
    iarc: "IARC Group 1 (nickel compounds).",
    sources: ["ATSDR ToxFAQs: Nickel", "IARC Group 1"],
  },
  {
    slug: "aluminum", name: "Aluminum", kind: "metal",
    short: "A light metal from dust, some munitions, and processing.",
    where: "Metal grinding/machining, some ordnance, and dust exposure.",
    harm: ["High aluminum exposure is studied for effects on the brain and bone, particularly when kidney clearance is impaired."],
    retention: "Mostly cleared by healthy kidneys; can accumulate in bone and brain with very high exposure or kidney disease.",
    organs: ["brain", "bone"],
    conditions: "Aluminum neurotoxicity is an area of ongoing study; document exposure context.",
    untreated: "Most relevant where kidney function is already reduced — worth discussing with a clinician.",
    tests: ["Discuss with a clinician, especially if kidney function is reduced"],
    sources: ["ATSDR ToxFAQs: Aluminum"],
  },
  {
    slug: "antimony", name: "Antimony", kind: "metal",
    short: "A metal in ammunition primers and flame retardants — often paired with lead.",
    where: "Firing ranges and ammunition handling (it travels with lead), and some industrial work.",
    harm: ["Inhaled antimony irritates the lungs and heart and can act as a marker of firing-range metal exposure."],
    retention: "Cleared over weeks; lung and cardiac effects studied with heavy inhalation.",
    organs: ["lungs", "heart"],
    conditions: "ATSDR links inhaled antimony to lung and heart effects.",
    untreated: "Most relevant alongside lead from range exposure — address them together.",
    tests: ["Discuss with a clinician alongside lead testing"],
    sources: ["ATSDR ToxFAQs: Antimony"],
  },
  {
    slug: "beryllium", name: "Beryllium", kind: "metal",
    short: "A lightweight metal in aerospace alloys, electronics, and some weapons systems.",
    where: "Machining beryllium alloys, aerospace and electronics maintenance.",
    harm: ["Beryllium can trigger an immune-driven, lasting lung disease (chronic beryllium disease) in sensitized people."],
    retention: "The immune sensitization is lifelong once it develops.",
    organs: ["lungs"],
    conditions: "IARC lists beryllium as a known carcinogen; chronic beryllium disease is a recognized occupational lung disease.",
    untreated: "Progressive lung disease in sensitized individuals — a specific blood test (BeLPT) can identify sensitization.",
    tests: ["Beryllium Lymphocyte Proliferation Test (BeLPT)", "Pulmonary function testing"],
    iarc: "IARC Group 1 (beryllium).",
    sources: ["ATSDR ToxFAQs: Beryllium", "IARC Group 1"],
  },
  {
    slug: "vanadium", name: "Vanadium", kind: "metal",
    short: "A metal in fuel-combustion residue, steel alloys, and some particulate.",
    where: "Fuel and oil combustion residue, boiler and engine work, and inhaled particulate.",
    harm: ["Inhaled vanadium is an airway irritant linked to bronchitis-type symptoms."],
    retention: "Cleared over days to weeks.",
    organs: ["lungs", "kidney"],
    conditions: "ATSDR links inhaled vanadium to respiratory irritation.",
    untreated: "Mostly an airway-irritant concern with ongoing inhalation.",
    tests: ["Pulmonary function testing if symptomatic"],
    sources: ["ATSDR ToxFAQs: Vanadium"],
  },
  {
    slug: "thallium", name: "Thallium", kind: "metal",
    short: "A highly toxic metal found in some ores, electronics, and legacy rodenticides.",
    where: "Rare; some electronics, smelting, and contaminated environments.",
    harm: ["Thallium disrupts potassium-dependent processes and is toxic to nerves and the kidneys."],
    retention: "Distributes widely; clears over weeks but can injure nerves.",
    organs: ["nervous-system", "kidney"],
    conditions: "ATSDR links thallium to peripheral neuropathy and other effects.",
    untreated: "Nerve injury can progress; a clinician should evaluate suspected exposure.",
    tests: ["Urine thallium", "Neurological evaluation"],
    sources: ["ATSDR ToxFAQs: Thallium"],
  },
  {
    slug: "barium", name: "Barium", kind: "metal",
    short: "A metal in some ordnance, flares, and industrial dust.",
    where: "Ordnance, pyrotechnics, and some industrial settings.",
    harm: ["Soluble barium can affect the heart, muscle, and potassium balance; insoluble forms deposit in the lungs as dust."],
    retention: "Insoluble dust can persist in the lungs; soluble forms clear faster.",
    organs: ["heart", "bone", "lungs"],
    conditions: "ATSDR links barium to cardiovascular and lung-dust effects depending on form.",
    untreated: "Depends on form and dose — discuss the exposure context with a clinician.",
    tests: ["Discuss with a clinician based on exposure"],
    sources: ["ATSDR ToxFAQs: Barium"],
  },

  // ── Contaminant classes ────────────────────────────────────────────────────
  {
    slug: "burn-pits", name: "Burn pits", kind: "contaminant",
    short: "Open-air burning of mixed waste with jet fuel — a delivery system for nearly every toxicant at once.",
    where: "Forward operating bases across Iraq, Afghanistan, and the wider Gulf theater, burning plastics, metals, electronics, medical and human waste, often around the clock.",
    harm: [
      "Burn-pit smoke carries fine particulate, dioxins, volatile organic compounds (like benzene), polycyclic aromatic hydrocarbons, and heavy metals — together. The ultrafine particles reach the deepest part of the lung and pass into the bloodstream.",
      "That mix sets off airway injury and body-wide inflammation that, for many veterans, never fully resolves.",
    ],
    retention: "Particulate can remain embedded in lung tissue for years; the inflammatory injury can persist long after the deployment ends.",
    organs: ["lungs", "heart", "brain"],
    conditions: "The PACT Act of 2022 makes a long list of respiratory conditions and cancers presumptive for burn-pit / airborne-hazard exposure — the strongest government acknowledgment in this library. The presumptive cancer list includes respiratory cancer of any type, gastrointestinal cancer of any type, reproductive cancer of any type, lymphoma of any type, melanoma, pancreatic cancer, kidney cancer, brain cancer, head cancer of any type, and neck cancer of any type. Unlike many exposures in this library, the listed respiratory conditions and cancers carry no minimum latency period or minimum exposure duration under the statute — you do not have to show how much you were exposed to. Confirm the current list and your specific conditions with your VSO; VA has amended this list before and can again.",
    untreated: "Airway disease (asthma, chronic bronchitis, constrictive bronchiolitis) and elevated cancer risk can develop and progress; the VA Airborne Hazards and Open Burn Pit Registry exists to track it.",
    // Since the 1 Aug 2024 redesign there is no registry questionnaire to fill in —
    // VA and DoD auto-include eligible veterans from service records, so "join the
    // registry" is stale advice. Route through the human instead.
    tests: ["Full pulmonary-function testing (can catch what a chest X-ray misses)", "Ask your VA Environmental Health Coordinator whether a registry evaluation is available for this exposure", "PACT Act Toxic Exposure Screening"],
    sources: ["PACT Act of 2022 (38 U.S.C. §1119–1120)", "VA Airborne Hazards and Open Burn Pit Registry", "ATSDR"],
  },
  {
    slug: "jet-fuel-jp8", name: "Jet fuel (JP-8) & fuels", kind: "contaminant",
    short: "The military's primary jet fuel — and a hydrocarbon solvent that became fuel for the burn pits.",
    where: "Flight lines, fuel handlers, vehicle and aircraft maintenance, generator exhaust, and as the accelerant poured on burn pits.",
    harm: [
      "JP-8 is a complex hydrocarbon mixture containing benzene and other volatile organic compounds. It is absorbed through the lungs and skin.",
      "Benzene specifically is toxic to the bone marrow, and the broader mixture irritates the airways and stresses the nervous system.",
    ],
    retention: "The volatile components clear over hours to days, but repeated daily exposure produces ongoing injury, and benzene's marrow effects can be lasting.",
    organs: ["lungs", "bone-marrow", "nervous-system", "liver"],
    conditions: "Benzene is an established cause of leukemia and other blood/marrow disorders (recognized at Camp Lejeune and by IARC); JP-8 exposure overlaps the burn-pit airborne-hazard picture.",
    untreated: "Marrow and blood effects and airway injury can develop; document fuel exposure alongside burn pits.",
    tests: ["CBC (complete blood count) for marrow effects", "Pulmonary function testing"],
    iarc: "IARC Group 1 (benzene, a component).",
    sources: ["ATSDR ToxFAQs: JP-8 / Fuel Oils", "ATSDR ToxFAQs: Benzene", "IARC Group 1 (benzene)"],
  },
  {
    slug: "solvents-and-fuels", name: "Solvents (benzene, TCE, PCE)", kind: "contaminant",
    short: "Industrial degreasers and cleaning solvents — TCE, PCE, and benzene — common in maintenance and contaminated water.",
    where: "Motor pools, flight lines, parts cleaning, and contaminated base water supplies — most documented at Camp Lejeune and MCAS New River, North Carolina, where trichloroethylene (TCE), tetrachloroethylene (PCE), benzene, and vinyl chloride reached the drinking water supply between August 1953 and December 1987.",
    harm: [
      "Solvents are absorbed through the lungs and skin and travel everywhere the blood goes. Benzene injures the bone marrow; TCE, PCE, and vinyl chloride affect the nervous system, kidneys, liver, and immune system, and vinyl chloride is a recognized liver carcinogen in its own right.",
    ],
    retention: "Volatile components clear over days, but the marrow, nerve, and organ injury from sustained exposure can be lasting.",
    organs: ["bone-marrow", "liver", "kidney", "nervous-system"],
    conditions: "38 CFR §3.309(f) lists eight presumptive diseases for Camp Lejeune / MCAS New River service of 30+ days between Aug 1953 and Dec 1987: adult leukemia, aplastic anemia and other myelodysplastic syndromes, bladder cancer, kidney cancer, liver cancer, multiple myeloma, non-Hodgkin's lymphoma, and Parkinson's disease. ATSDR documents the underlying solvent associations.",
    untreated: "Blood, kidney, liver, and neurological conditions can develop years later; an exposure record matters for both care and a claim.",
    tests: ["CBC for blood/marrow effects", "Kidney and liver panels", "Neurological evaluation if symptomatic"],
    iarc: "IARC Group 1 (benzene; TCE).",
    // The Camp Lejeune Justice Act names NO diseases — it is a tort action in
    // EDNC whose filing window closed 10 Aug 2024. The disease list is §3.309(f).
    sources: ["38 CFR 3.309(f) (VA presumptive list)", "ATSDR ToxFAQs: Trichloroethylene / Benzene", "IARC Group 1"],
  },
  {
    slug: "dioxins", name: "Dioxins (Agent Orange family)", kind: "contaminant",
    short: "Persistent toxicants from herbicides like Agent Orange and from burning plastics in burn pits.",
    where: "Vietnam, the Thailand base perimeters, the Korean DMZ, herbicide test/storage sites, and burn-pit plastic combustion.",
    harm: [
      "Dioxin (TCDD) stores in body fat for years and interferes with hormone and cellular regulation, which is why its recognized effects span cancers, diabetes, heart disease, and nerve injury.",
    ],
    retention: "Half-life of several years in body fat — a single era of exposure can stay biologically relevant for decades.",
    organs: ["liver", "thyroid", "nervous-system"],
    conditions: "The Agent Orange presumptive list (38 CFR §3.309(e)) recognizes many conditions, including several cancers, type 2 diabetes, ischemic heart disease, hypothyroidism, Parkinson's, and early-onset peripheral neuropathy.",
    untreated: "Recognized chronic diseases can surface decades later; the Agent Orange presumptive list is strong government acknowledgment for a claim.",
    tests: ["Condition-specific screening with your clinician", "Hormone and metabolic markers"],
    iarc: "IARC Group 1 (TCDD).",
    sources: ["38 CFR §3.309(e) (Agent Orange)", "ATSDR ToxFAQs: CDDs (Dioxins)", "IARC Group 1"],
  },
  {
    slug: "pfas", name: "PFAS / AFFF (forever chemicals)", kind: "contaminant",
    short: "'Forever chemicals,' largely from AFFF firefighting foam used in training and crash response.",
    where: "Flight lines, fire-training pits, crash crews, and bases where AFFF reached the soil and drinking water.",
    harm: [
      "PFAS build up in the body and barely leave. They are associated with thyroid disruption, high cholesterol, immune effects, kidney and testicular cancer, and pregnancy-related effects.",
    ],
    retention: "Years-long half-life; blood levels can stay elevated long after the source is gone.",
    organs: ["thyroid", "kidney", "liver"],
    conditions: "EPA and federal health agencies link PFAS to thyroid disease, high cholesterol, kidney and testicular cancer, and immune effects; recognition for claims is evolving.",
    untreated: "Thyroid, cholesterol, kidney, and cancer-risk effects warrant monitoring given how long PFAS persist.",
    tests: ["Serum PFAS testing where available", "Thyroid panel, lipid panel, kidney function"],
    sources: ["ATSDR ToxFAQs: Perfluoroalkyls (PFAS)", "EPA / DoD PFAS findings"],
  },
  {
    slug: "particulate-and-silica", name: "Particulate & silica", kind: "contaminant",
    short: "Fine sand, dust, and silica — the everyday air of a desert deployment.",
    where: "Sandstorms, vehicle and rotor wash, demolition, and abrasive work; often alongside burn-pit smoke and diesel exhaust.",
    harm: [
      "The smallest particles reach the deepest airways and can scar them, sometimes producing breathlessness that a standard chest X-ray misses. Silica also raises cancer and autoimmune risk.",
      "Fine particulate specifically (PM2.5) is small enough to reach the deepest part of the lung and cross into the bloodstream, driving body-wide inflammation. ATSDR documents this fine-particulate pathway as distinct from silica or combustion-toxicant exposure, and links it to cardiovascular strain in addition to airway injury.",
    ],
    retention: "Silica and particulate can remain in lung tissue for years, driving slow scarring.",
    organs: ["lungs", "heart"],
    conditions: "The PACT Act recognizes airborne-hazard respiratory conditions (incl. constrictive bronchiolitis, asthma, chronic sinusitis/rhinitis); silica is linked to silicosis and autoimmune disease.",
    untreated: "Small-airway disease can progress while imaging looks normal — full lung-function testing matters.",
    tests: ["Full pulmonary-function testing", "Specialist referral for unexplained exertional symptoms"],
    sources: ["PACT Act of 2022", "ATSDR ToxFAQs: Silica"],
  },
  {
    slug: "asbestos", name: "Asbestos", kind: "contaminant",
    short: "Heat-resistant fibers built into ships, older buildings, brakes, and insulation.",
    where: "Navy ships and shipyards, engine and boiler rooms, demolition, and any work disturbing old insulation.",
    harm: [
      "Asbestos fibers lodge in lung tissue and the lung lining and can cause scarring (asbestosis), lung cancer, and mesothelioma — often decades after exposure.",
    ],
    retention: "Fibers can remain in the lung for life; disease latency is often 20–40 years.",
    organs: ["lungs"],
    conditions: "IARC lists asbestos as a known carcinogen; the VA recognizes asbestos-related disease (asbestosis, lung cancer, mesothelioma) claimed by exposure history — roughly 1 in 3 mesothelioma patients is a veteran.",
    untreated: "Because latency is so long, a documented exposure history is essential even when you feel well today.",
    tests: ["Periodic lung screening given asbestos history", "Chest imaging and pulmonary function testing"],
    iarc: "IARC Group 1 (asbestos).",
    sources: ["ATSDR ToxFAQs: Asbestos", "IARC Group 1", "VA asbestos guidance"],
  },
  {
    slug: "ionizing-radiation", name: "Ionizing radiation", kind: "contaminant",
    short: "Radiation from atomic-test participation, nuclear work, and depleted-uranium environments.",
    where: "Atomic veterans, nuclear shipyard and weapons work, radar/nuclear equipment, and DU environments.",
    harm: ["Ionizing radiation damages DNA, which is why it is linked to a recognized list of cancers; dose and proximity matter."],
    retention: "The exposure is the dose received; the DNA/cancer risk is cumulative over a lifetime.",
    organs: ["bone-marrow", "thyroid"],
    conditions: "The VA recognizes a list of radiogenic cancers (38 CFR §3.309(d), §3.311) and the Radiation-Exposed Veterans Act — strong government acknowledgment for atomic veterans.",
    untreated: "Cancer risk persists; document your role and environment, and screen per guidance.",
    tests: ["Cancer screening per clinical guidance", "Radiation dose reconstruction where applicable"],
    sources: ["38 CFR §3.309(d), §3.311", "Radiation-Exposed Veterans Act", "VA radiation programs"],
  },
  {
    slug: "nerve-agents", name: "Nerve agents & organophosphates", kind: "contaminant",
    short: "Chemical-warfare nerve agents and the pesticides/pills used in the Gulf War.",
    where: "The 1991 Khamisiyah demolition (sarin/cyclosarin), pesticide use, and anti-nerve-agent (PB) pills in the Gulf War.",
    harm: ["These compounds block an enzyme the body needs to switch off nerve signals; even low-level exposure is studied in the chronic multi-symptom pattern many Gulf War veterans live with."],
    retention: "The agents clear quickly, but the studied health effects can persist as a chronic, multi-system pattern.",
    organs: ["nervous-system", "brain"],
    conditions: "Gulf War service is recognized under 38 CFR §3.317 for undiagnosed illness and chronic multi-symptom illness (incl. chronic fatigue syndrome, fibromyalgia, functional GI disorders).",
    untreated: "Multi-system symptoms can persist and compound; the Gulf War presumptive framework supports a claim.",
    tests: ["Cholinesterase testing where relevant", "Evaluation under the Gulf War illness framework"],
    sources: ["38 CFR §3.317 (Gulf War)", "ATSDR ToxFAQs: Nerve Agents", "VA Gulf War programs"],
  },

  // ── Topic guides ──────────────────────────────────────────────────────────
  // Not a chemical or metal exposure — a condition/topic page in the same
  // documented, cited, non-treatment shape as the toxicant pages above.
  {
    slug: "tbi-blast", name: "TBI & blast exposure", kind: "topic",
    short: "Blast overpressure and repeated concussion — among the most common invisible injuries of the post-9/11 wars.",
    where: "IED and mortar/rocket blast overpressure, breacher and heavy-weapons concussive exposure, vehicle rollovers and crashes, and repeated lower-level blast exposure from training (breaching, artillery, heavy weapons) that was rarely logged as an injury at the time.",
    harm: [
      "A blast wave can injure brain tissue without any visible wound — the pressure wave itself disrupts brain chemistry and small blood vessels, which is why a normal-looking head and a real brain injury can coexist.",
      "Repeated lower-level blast exposure (breaching, artillery, close-range heavy weapons over a career) is a documented, separate concern from a single diagnosed concussion, and is harder to connect to any one incident.",
    ],
    retention: "Symptoms — headaches, memory and concentration trouble, sleep disruption, mood change, noise/light sensitivity — can persist for years after the initial injury and are easy to mistake for stress or aging.",
    organs: ["brain"],
    conditions: "TBI is claimed by direct service connection under 38 CFR 3.303 when the in-service event, a current diagnosis, and a medical link are documented. VA also recognizes certain conditions as secondary to a service-connected TBI (including some mental-health and endocrine conditions) under 38 CFR 3.310.",
    untreated: "Cognitive, mood, and sleep symptoms can compound over time and are frequently misattributed to unrelated causes. A full cognitive and neurological evaluation — not just a checklist screen — is the right step.",
    tests: ["Full cognitive and neurological evaluation (not just a screening checklist)", "Ask specifically about evaluation through VA's Polytrauma/TBI System of Care"],
    sources: ["38 CFR 3.303, 3.310", "VA Polytrauma/TBI System of Care", "VA/DoD Clinical Practice Guideline for TBI"],
  },
  {
    slug: "hearing-tinnitus", name: "Hearing loss & tinnitus", kind: "topic",
    short: "Among the most commonly reported service-connected conditions — from firing ranges, flight lines, and blast exposure.",
    where: "Firing ranges, artillery and armor crews, flight lines and engine rooms, and any blast exposure — often without hearing protection available or worn consistently.",
    harm: [
      "Sustained loud noise damages the small hair cells in the inner ear that convert sound into nerve signals; once those cells are destroyed, the hearing loss is permanent.",
      "Some solvents (including some already in this library) are separately documented as ototoxic — capable of injuring hearing on their own or worsening noise-induced damage — so hearing and chemical exposure can compound each other.",
    ],
    retention: "Noise-induced hearing loss and tinnitus are permanent once the inner-ear damage has occurred; the ringing or loss does not resolve on its own.",
    organs: [],
    conditions: "Hearing loss and tinnitus are both commonly claimed and recognized service-connected disabilities, rated under VA's schedule based on audiometric testing.",
    untreated: "Untreated hearing loss is also linked to fall risk and social withdrawal over time — it is worth documenting even if it feels minor.",
    tests: ["A full audiology workup, not just a hearing-aid fitting", "Ask what day-to-day tinnitus management actually helps, separate from hearing loss itself"],
    sources: ["VA disability rating schedule, hearing loss and tinnitus", "VA National Center for Rehabilitative Auditory Research (NCRAR)"],
  },
  {
    slug: "cancer-screening", name: "Cancer risk & screening", kind: "topic",
    short: "What's presumptive under the PACT Act, and what to ask about — one place for a worry that otherwise has nowhere general to land.",
    where: "Cross-cutting — burn pits, particulate, Agent Orange/dioxins, asbestos, ionizing radiation, and several metals in this library are each independently linked to specific cancers. This page is the general index; each exposure's own page carries its specific citations.",
    harm: [
      "Cancer risk from these exposures develops over years to decades, which is exactly why a documented exposure history — not just a diagnosis — matters for both your care and a claim.",
    ],
    retention: "Not applicable — see the specific exposure page for retention and latency information.",
    organs: [],
    conditions: "The PACT Act of 2022 makes a range of cancers presumptive for burn-pit/airborne-hazard exposure; the Agent Orange list (38 CFR 3.309(e)) recognizes several additional cancers; Camp Lejeune service (38 CFR 3.309(f)) recognizes kidney, liver, and bladder cancer among others; radiation-exposed veterans have a separate presumptive cancer list (38 CFR 3.309(d)). Which list applies depends on your specific service — confirm with your VSO.",
    untreated: "Screening recommendations depend on the specific cancer type, your age, and your exposure history — there is no single general answer, which is why this page routes to a conversation rather than a checklist.",
    tests: ["Ask your clinician which cancer screenings fit your specific documented exposures and age", "Ask your VA Environmental Health Coordinator about exposure-specific surveillance programs you may be eligible for"],
    sources: ["PACT Act of 2022", "38 CFR 3.309(d), (e), (f)", "ATSDR / IARC classifications cited on individual exposure pages"],
  },
  {
    slug: "sleep-apnea-cardiovascular", name: "Sleep apnea & cardiovascular risk", kind: "topic",
    short: "One of the most commonly claimed secondary conditions — a specific, gettable diagnosis, not just 'sleep hygiene.'",
    where: "Not a service exposure pathway on its own — sleep apnea and cardiovascular risk are documented as connected to service through two separate routes: as secondary to PTSD and other service-connected mental-health conditions, and through the airborne-hazard/burn-pit exposure pathway.",
    harm: [
      "Sleep apnea repeatedly interrupts breathing during sleep, which drives poor-quality sleep, daytime fatigue, and — over years — measurable strain on the cardiovascular system.",
      "This is a distinct, diagnosable condition from ordinary poor sleep or insomnia, and it requires a sleep study to identify, not a habit change.",
    ],
    retention: "Untreated sleep apnea's cardiovascular strain accumulates over years; it does not resolve by improving sleep habits alone if the underlying airway obstruction isn't addressed.",
    organs: ["heart"],
    conditions: "Sleep apnea is commonly claimed as secondary to PTSD and other service-connected mental-health conditions (38 CFR 3.310), and hypertension is on the airborne-hazard presumptive list. Confirm which pathway fits your record with your VSO.",
    untreated: "Cardiovascular strain from untreated sleep apnea compounds over years — a sleep study is the diagnostic step, not a lifestyle change.",
    tests: ["Ask for a sleep study if you snore heavily, wake unrefreshed, or have daytime fatigue", "Ask whether your sleep apnea could be claimed as secondary to an existing service-connected condition"],
    sources: ["38 CFR 3.310 (secondary service connection)", "PACT Act airborne-hazard presumptive list"],
  },
];

// ── Nutrients ─────────────────────────────────────────────────────────────────

// ── Organs ────────────────────────────────────────────────────────────────────
// 🔴 A NUTRIENTS array once lived here — per-nutrient "role", the toxicants that
// displace it, and a "restore:" list of foods. It was DELETED, not unlinked, on
// 2026-08-06. Two reasons, either sufficient: there is no validated model from an
// exposure history to a nutrient deficit in a specific person, so it asserted a
// calculation that does not exist; and its zinc entry described zinc's role as
// "immune function, testosterone, and antioxidant defense" while eight of sixteen
// metals mapped to zinc — rendering "metals → low testosterone" as a data path in
// an app whose founder separately sells nutritional supplements. Do not restore it.
export const ORGANS: Organ[] = [
  {
    slug: "bone", name: "Bone",
    what: "Your structural frame — and the body's long-term storage bank for calcium and for several toxic metals.",
    targetedBy: ["Lead", "Cadmium", "Depleted uranium", "Aluminum", "Barium"],
    mechanism: [
      "Because lead mimics calcium, the skeleton absorbs and stores it — in the spine, pelvis, and long bones — for decades.",
      "Stored metal isn't inert: during bone turnover (aging, illness, low calcium), it remobilizes back into the blood, which is why a 'normal' blood test years later can still sit on top of a large hidden burden.",
    ],
    conditions: "Heavy-metal bone storage underlies the gap between a normal blood test and real lifetime burden; cadmium also weakens bone.",
    untreated: "An unaddressed bone burden can keep re-seeding the blood and organs for years. A clinician can assess kidney function, bone health, and (for lead) order a bone-lead scan where available.",
  },
  {
    slug: "bone-marrow", name: "Bone marrow",
    what: "The factory inside your bones — especially the pelvis, spine, and breastbone — where stem cells make red blood cells, white (immune) cells, and platelets.",
    targetedBy: ["Lead", "Solvents (benzene, TCE, PCE)", "Jet fuel (JP-8) & fuels", "Ionizing radiation"],
    mechanism: [
      "The marrow's blood-forming stem cells are especially vulnerable. Benzene (in jet fuel and solvents) and ionizing radiation damage these stem cells directly.",
      "Lead jams the enzyme assembly line that builds hemoglobin, so red cells are made poorly. When the stem-cell factory is disrupted at the source, the downstream effects show up across the whole body — anemia, weakened immunity, and, with benzene or radiation, blood cancers.",
    ],
    conditions: "Benzene and ionizing radiation are documented causes of leukemia, aplastic anemia and myelodysplastic syndromes. Adult leukemia and aplastic anemia/MDS are Camp Lejeune presumptives (38 CFR §3.309(f)); leukemia other than CLL is on the radiation presumptive list (38 CFR §3.309(d)(2)) for veterans who took part in a listed radiation-risk activity.",
    untreated: "Marrow injury can progress quietly toward anemia, immune problems, or blood cancers. A simple blood count (CBC) is the front-line check — a clinician interprets it.",
  },
  {
    slug: "brain", name: "Brain",
    what: "The control center — and one of the most energy-hungry, vulnerable organs to toxic and blast injury.",
    targetedBy: ["Lead", "Mercury", "Manganese", "Aluminum", "Dioxins", "Nerve agents & organophosphates"],
    mechanism: [
      "Several metals cross into the brain and disrupt the chemistry nerve cells use to signal. Manganese concentrates in the basal ganglia and can cause a Parkinson-like movement disorder; lead and mercury impair memory, focus, and mood.",
      "This matters even more alongside blast/TBI: a brain already inflamed by a blast wave is less able to tolerate an added toxic-metal and neuroinflammatory load, and the symptoms can compound.",
    ],
    conditions: "Parkinson's is presumptive for Agent Orange and Camp Lejeune (TCE); TBI is claimed by direct service connection. Cognitive and mood symptoms are common in the Gulf War illness pattern.",
    untreated: "Neuroinflammation doesn't stay put — it tangles with sleep, mood, and energy, and 'just getting older' rarely explains it. A neurological evaluation is the right step.",
  },
  {
    slug: "kidney", name: "Kidney",
    what: "The body's filtration plant — which means it takes the brunt of many toxic exposures.",
    targetedBy: ["Cadmium", "Lead", "Depleted uranium", "Mercury", "Solvents (benzene, TCE, PCE)", "PFAS / AFFF"],
    mechanism: [
      "The kidney's filtering tubules concentrate metals like cadmium and uranium, which injures them and causes the body to leak protein and minerals into the urine.",
      "Damage is often silent for years and may not show on a basic blood test until function has already dropped.",
    ],
    conditions: "Kidney cancer is presumptive (PACT Act, Camp Lejeune); ATSDR links cadmium, lead, solvents, and PFAS to non-cancer kidney injury.",
    untreated: "Silent kidney decline drives blood-pressure and mineral problems and can progress to chronic kidney disease. Early monitoring (eGFR, urine protein) catches it sooner.",
  },
  {
    slug: "liver", name: "Liver",
    what: "The body's main chemical-processing organ — it breaks down chemicals, including the ones service exposed you to.",
    targetedBy: ["Solvents (benzene, TCE, PCE)", "Dioxins", "PFAS / AFFF", "Arsenic", "Jet fuel (JP-8) & fuels"],
    mechanism: [
      "Solvents and persistent chemicals are processed by the liver, which can inflame and stress it over time.",
      "A burdened liver clears toxicants and hormones less efficiently, which ripples into energy and metabolism.",
    ],
    conditions: "Liver cancer is recognized at Camp Lejeune; ATSDR links solvents, arsenic, and dioxins to liver effects.",
    untreated: "Chronic liver stress can progress; a clinician can check liver enzymes and function.",
  },
  {
    slug: "lungs", name: "Lungs",
    what: "The first organ to meet anything you breathe — smoke, dust, fuel vapor, and fibers.",
    targetedBy: ["Burn pits", "Particulate & silica", "Asbestos", "Hexavalent chromium (Cr-VI)", "Cobalt", "Nickel", "Beryllium", "Jet fuel (JP-8) & fuels"],
    mechanism: [
      "Inhaled smoke and ultrafine particulate from burn pits and fuels injure the smallest airways and can scar them, sometimes causing real breathlessness that a standard chest X-ray misses.",
      "Fibers (asbestos, silica) and certain metals (chromium VI, nickel, beryllium) lodge in lung tissue and drive scarring, immune lung disease, and cancer — often decades later.",
    ],
    conditions: "The PACT Act makes many respiratory conditions and respiratory cancers presumptive for airborne hazards; asbestos and chromium VI are recognized lung carcinogens.",
    untreated: "Small-airway disease can progress while imaging looks normal, and fiber/metal injury carries long-latency cancer risk. Full pulmonary-function testing is the key check.",
  },
  {
    slug: "nervous-system", name: "Nervous system & nerves",
    what: "The wiring that carries signals to your hands, feet, organs, and brain.",
    targetedBy: ["Lead", "Arsenic", "Mercury", "Thallium", "Solvents (benzene, TCE, PCE)", "Nerve agents & organophosphates", "Dioxins"],
    mechanism: [
      "Metals and solvents are toxic to nerve fibers, producing numbness, tingling, burning, or weakness — usually starting in the feet and hands.",
      "Nerve agents and organophosphates block the enzyme that switches nerve signals off, which is studied in the chronic multi-symptom Gulf War pattern.",
    ],
    conditions: "Early-onset peripheral neuropathy is presumptive for Agent Orange; ATSDR links solvents and metals to nerve injury; Gulf War illness covers multi-system neurological symptoms.",
    untreated: "Numbness and burning are often the visible edge of a wider process that can progress. Nerve-conduction testing and a neurological evaluation help define it.",
  },
  {
    slug: "thyroid", name: "Thyroid",
    what: "The small gland that sets your body's tempo — energy, weight, mood, and temperature.",
    targetedBy: ["Dioxins", "PFAS / AFFF", "Ionizing radiation", "Cobalt"],
    mechanism: [
      "Dioxins and PFAS disrupt the hormone signals the thyroid runs on; radiation can damage the gland directly.",
      "Because the thyroid sets the tempo for so many systems, when it drifts the effects ripple into nearly every part of how you feel.",
    ],
    conditions: "Hypothyroidism is an Agent Orange presumptive; thyroid cancer can be radiation-presumptive; PFAS are linked to thyroid disease.",
    untreated: "An under- or over-active thyroid worsens energy, weight, and mood and strains the heart. A simple thyroid panel (TSH and more) checks it.",
  },
  {
    slug: "heart", name: "Heart & blood vessels",
    what: "The pump and the pipes — sensitive to inflammation, metals, and chronic stress.",
    targetedBy: ["Lead", "Cobalt", "Antimony", "Barium", "Dioxins", "Burn pits"],
    mechanism: [
      "Lead and chronic inflammation raise blood pressure and stress the blood vessels; some metals (cobalt, antimony) can directly affect heart muscle.",
    ],
    conditions: "Hypertension and ischemic heart disease are Agent Orange presumptives; lead and inflammation are studied cardiovascular contributors.",
    untreated: "High blood pressure and vascular strain drive heart, kidney, and stroke risk over time. Home blood-pressure tracking and a clinician's review matter.",
  },
  {
    slug: "skin", name: "Skin",
    what: "The body's largest organ and outer barrier — and a visible record of some toxic exposures.",
    targetedBy: ["Arsenic", "Dioxins", "Nickel", "Hexavalent chromium (Cr-VI)"],
    mechanism: [
      "Arsenic produces characteristic skin changes and raises skin-cancer risk; dioxins can cause chloracne; nickel and chromium are common contact irritants.",
    ],
    conditions: "Chloracne and porphyria cutanea tarda are Agent Orange presumptives; arsenic is linked to skin cancer.",
    untreated: "Persistent skin changes can signal a deeper exposure and, with arsenic, raised cancer risk — worth a clinician's eye.",
  },
];

// ── Lookups ───────────────────────────────────────────────────────────────────
export const TOXICANT_BY_SLUG = Object.fromEntries(TOXICANTS.map((t) => [t.slug, t]));
export const TOXICANT_NAME_TO_SLUG: Record<string, string> = Object.fromEntries(TOXICANTS.map((t) => [t.name, t.slug]));

export function prettySlug(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
export const ORGAN_BY_SLUG = Object.fromEntries(ORGANS.map((o) => [o.slug, o]));

// Map the estimator's internal keys + display strings to library slugs so chips
// can link straight into the encyclopedia.
export const METAL_KEY_TO_SLUG: Record<string, string> = {
  pb: "lead", cd: "cadmium", hg: "mercury", as: "arsenic", u: "depleted-uranium",
  w: "tungsten", co: "cobalt", cr: "hexavalent-chromium", mn: "manganese", ni: "nickel",
  al: "aluminum", sb: "antimony", be: "beryllium", v: "vanadium", tl: "thallium", ba: "barium",
};
export const CONTAMINANT_KEY_TO_SLUG: Record<string, string> = {
  solv: "solvents-and-fuels", diox: "dioxins", pfas: "pfas", pm: "particulate-and-silica",
  asb: "asbestos", rad: "ionizing-radiation", op: "nerve-agents",
};
export const ORGAN_NAME_TO_SLUG: Record<string, string> = {
  bone: "bone", "bone marrow": "bone-marrow", brain: "brain", "brain (basal ganglia)": "brain",
  kidney: "kidney", liver: "liver", lungs: "lungs", "lung lining": "lungs", sinuses: "lungs",
  "nervous system": "nervous-system", "peripheral nerves": "nervous-system", "nerves": "nervous-system",
  heart: "heart", thyroid: "thyroid", skin: "skin",
};

export const LIBRARY_NOTE =
  "Drafted from the government's and science's own record — VA presumptive lists (PACT Act, 38 CFR, Camp Lejeune), ATSDR ToxFAQs, IARC, and NTP. This is documentation to bring to your clinician and VSO — not a diagnosis, a treatment plan, or a determination of service connection.";
