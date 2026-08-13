// ─────────────────────────────────────────────────────────────────────────────
// MEDICATION EFFECTS → REAL VA DIAGNOSTIC CODES
//
// The bounded half of the Medications feature. The medication list is
// unbounded (openFDA holds ~260,000 labels); the set of conditions that are
// BOTH commonly drug-caused AND carry a real VA diagnostic code is small and
// hand-verified. A drug's own FDA label text is matched against `labelTerms`
// at read time, so nothing here ever asserts an effect the label doesn't name.
//
// HOW THIS DATA WAS BUILT (2026-08-13). Six research agents mapped conditions
// by body system, then SEPARATE adversarial verifiers tried to refute every
// code number, code name, and CFR section against the live eCFR and govinfo's
// CFR XML. That second pass was not ceremony — it caught real errors:
//
//   • DC 7720 "Iron deficiency anemia" was proposed for GI bleeding. The
//     regulation's own Note forbids exactly that: "Do not evaluate iron
//     deficiency anemia due to blood loss under this diagnostic code."
//   • DC 8004 "Paralysis agitans" was proposed for drug-induced tremor. That
//     is the PARKINSON'S code, not a tremor code.
//   • A DBQ title was partly FABRICATED — no VA form carried it. Every `dbq`
//     field was dropped from this file as a result: diagnostic codes verify
//     cleanly against the CFR, DBQ titles proved fabrication-prone, and the
//     /clinician page already explains what a DBQ is.
//
// WHAT IS DELIBERATELY ABSENT, and must stay absent:
//   • Any percentage, rating tier, or dollar figure. Enforced by
//     scripts/coi-firewall.cjs rule 12b.
//   • Any nutrient-deficiency condition. Real labels name them (metformin and
//     B12, PPIs and magnesium) but a "deficiency" card one tap from a
//     veteran's own medication list builds a product-shaped path out of a drug
//     label, and a label listing a possible deficiency says nothing about
//     whether THIS veteran has one. Enforced by rule 12d.
//   • Conditions with NO real VA code. Chronic cough (ACE inhibitors),
//     photosensitivity, statin myopathy, and weight gain were all researched,
//     all real, and all CUT — the rating schedule has no code titled for them,
//     and pointing at "the nearest listed code" would be the app performing
//     rating-by-analogy under 38 CFR 4.20, which is an adjudicator's judgment,
//     not software's. Insomnia was cut for the same reason plus a sharper one:
//     its only nearby codes are PTSD and depression, and implying a drug side
//     effect opens a PTSD claim would be indefensible.
//
// `limitation` is the honesty field and the most important one here. Where VA
// has no code for the thing a label actually names, this says so out loud
// rather than quietly pointing at a near-miss code.
// ─────────────────────────────────────────────────────────────────────────────

export type DiagnosticCode = {
  code: string;
  /** The code's official name, verbatim from the CFR. */
  name: string;
  cfr: string;
};

export type MedicationEffect = {
  key: string;
  /** Plain English, as a veteran would recognize it. */
  label: string;
  /** One sentence: what the condition is. Never about any individual. */
  plain: string;
  /** Lowercase strings matched against the drug's own FDA label text. */
  labelTerms: string[];
  diagnosticCodes: DiagnosticCode[];
  /** Why medications cause this, and the secondary-connection angle. */
  why: string;
  /** Stated out loud where VA's schedule does NOT cleanly cover this. */
  limitation?: string;
};

export const MEDICATION_EFFECTS: MedicationEffect[] = [
  // ── Stomach, bowel, liver ─────────────────────────────────────────────────
  {
    key: "peptic_ulcer",
    label: "Stomach and duodenal ulcers",
    plain:
      "An open sore in the lining of the stomach or the first part of the small intestine, which can cause burning upper-abdominal pain, nausea, and sometimes bleeding.",
    labelTerms: ["peptic ulcer", "gastric ulcer", "duodenal ulcer", "gastroduodenal ulcer", "peptic ulceration", "gastrointestinal ulceration", "gastric perforation"],
    diagnosticCodes: [{ code: "7304", name: "Peptic ulcer disease", cfr: "38 CFR 4.114" }],
    why: "Anti-inflammatories, aspirin, and steroids block the prostaglandins that maintain the stomach's protective mucus layer — which is why medication use is one of the two leading causes of peptic ulcer generally, alongside H. pylori infection.",
  },
  {
    key: "gi_bleeding",
    label: "Bleeding in the stomach or intestines",
    plain:
      "Blood loss from somewhere in the digestive tract, which may appear as vomited blood, black or bloody stools, or show up only on a blood test.",
    labelTerms: ["gastrointestinal bleeding", "gastrointestinal hemorrhage", "gi bleed", "hematemesis", "melena", "hematochezia", "bleeding ulcer", "upper gastrointestinal bleeding"],
    diagnosticCodes: [
      { code: "7304", name: "Peptic ulcer disease", cfr: "38 CFR 4.114" },
      { code: "7307", name: "Gastritis, chronic", cfr: "38 CFR 4.114" },
    ],
    why: "Antiplatelet drugs, blood thinners, anti-inflammatories, and SSRIs each impair either clotting or the stomach's lining defenses, and combining them multiplies the risk.",
    limitation:
      "There is no standalone VA diagnostic code for gastrointestinal bleeding — it is documented as part of the underlying stomach or intestinal condition, which is why the codes shown here are the ulcer and gastritis codes rather than a bleeding code.",
  },
  {
    key: "gastritis",
    label: "Chronic inflammation of the stomach lining",
    plain: "Long-standing irritation of the stomach lining that can cause upper abdominal pain, nausea, and indigestion.",
    labelTerms: ["gastritis", "erosive gastritis", "gastric erosions", "gastric mucosal injury", "gastric irritation", "dyspepsia"],
    diagnosticCodes: [{ code: "7307", name: "Gastritis, chronic", cfr: "38 CFR 4.114" }],
    why: "The same prostaglandin blockade behind medication-related ulcers produces a broader, shallower inflammation first, so gastritis often precedes frank ulceration in long-term anti-inflammatory, aspirin, or steroid use.",
  },
  {
    key: "gerd",
    label: "Acid reflux (GERD)",
    plain: "Stomach acid repeatedly washing back up into the esophagus, causing heartburn, regurgitation, and sometimes difficulty swallowing.",
    labelTerms: ["gastroesophageal reflux", "gerd", "acid reflux", "esophagitis", "erosive esophagitis", "heartburn", "regurgitation", "esophageal ulceration"],
    diagnosticCodes: [
      { code: "7206", name: "Gastroesophageal reflux disease", cfr: "38 CFR 4.114" },
      { code: "7346", name: "Hiatal hernia and paraesophageal hernia", cfr: "38 CFR 4.114" },
      { code: "7203", name: "Esophagus, stricture of", cfr: "38 CFR 4.114" },
      { code: "7207", name: "Barrett's esophagus", cfr: "38 CFR 4.114" },
    ],
    why: "Anti-inflammatories, calcium channel blockers, nitrates, and some osteoporosis drugs either irritate the esophagus directly or relax the valve that keeps acid down.",
    limitation:
      "Worth knowing if you are reading older guidance: before 19 May 2024 GERD had no code of its own and was rated by analogy to hiatal hernia under DC 7346. VA's digestive-system rewrite created DC 7206 as a real named code, so any source still calling 7346 \"the GERD code\" is out of date.",
  },
  {
    key: "drug_induced_liver_injury",
    label: "Medication-caused liver injury",
    plain:
      "Damage to liver cells caused by a medication, often first detected as raised liver enzymes on a blood test, sometimes with fatigue, nausea, or yellowing of the skin or eyes.",
    labelTerms: ["hepatotoxicity", "drug-induced liver injury", "hepatic injury", "elevated transaminases", "elevated liver enzymes", "alt increased", "ast increased", "jaundice", "hepatic failure", "hepatic necrosis", "liver function test abnormal"],
    diagnosticCodes: [{ code: "7345", name: "Chronic liver disease without cirrhosis", cfr: "38 CFR 4.114" }],
    why: "The liver metabolizes most drugs, so acetaminophen, a number of antibiotics, anti-seizure medications, statins, and methotrexate can injure it either directly or by triggering an immune reaction. Drug-induced liver injury is the leading cause of acute liver failure in the United States.",
  },
  {
    key: "cirrhosis",
    label: "Liver scarring (cirrhosis)",
    plain: "Permanent scarring of the liver that replaces healthy tissue and gradually reduces the liver's ability to do its work.",
    labelTerms: ["cirrhosis", "hepatic fibrosis", "liver fibrosis", "portal hypertension", "ascites", "esophageal varices", "hepatic decompensation", "chronic liver disease"],
    diagnosticCodes: [{ code: "7312", name: "Cirrhosis of the liver", cfr: "38 CFR 4.114" }],
    why: "Sustained or repeated liver injury — from long-term methotrexate or amiodarone, or recurrent drug-induced hepatitis — can progress from reversible inflammation to irreversible scarring.",
  },
  {
    key: "pancreatitis",
    label: "Inflammation of the pancreas",
    plain: "Inflammation of the pancreas causing severe upper abdominal pain, nausea, and vomiting, which over time can impair digestion and blood-sugar control.",
    labelTerms: ["pancreatitis", "acute pancreatitis", "chronic pancreatitis", "necrotizing pancreatitis", "elevated lipase", "lipase increased", "amylase increased"],
    diagnosticCodes: [{ code: "7347", name: "Pancreatitis, chronic", cfr: "38 CFR 4.114" }],
    why: "A substantial list of medications are documented pancreatitis triggers — including valproate, azathioprine, certain diuretics, and GLP-1 receptor agonists — acting either by direct toxicity or by driving triglycerides high enough to provoke an attack.",
  },
  {
    key: "chronic_diarrhea_ibs",
    label: "Ongoing diarrhea and bowel disturbance",
    plain: "Persistent loose, frequent, or urgent stools with cramping and bloating that continue well beyond a short-term stomach bug.",
    labelTerms: ["chronic diarrhea", "loose stools", "frequent stools", "irritable bowel syndrome", "bowel urgency", "antibiotic-associated diarrhea", "clostridium difficile", "clostridioides difficile"],
    diagnosticCodes: [
      { code: "7319", name: "Irritable bowel syndrome (IBS)", cfr: "38 CFR 4.114" },
      { code: "7325", name: "Enteritis, chronic", cfr: "38 CFR 4.114" },
      { code: "7356", name: "Gastrointestinal dysmotility syndrome", cfr: "38 CFR 4.114" },
    ],
    why: "Antibiotics disrupt the gut and can allow C. difficile to take hold, while metformin, SSRIs, magnesium-containing antacids, and acid reducers commonly loosen stools.",
    limitation:
      "DC 7325 (Enteritis, chronic) has no rating criteria of its own — 38 CFR 4.114 instructs that it be evaluated as irritable bowel syndrome or as Crohn's disease instead.",
  },
  {
    key: "colitis",
    label: "Inflammation of the colon",
    plain: "Inflammation of the large intestine causing diarrhea, cramping, urgency, and sometimes blood or mucus in the stool.",
    labelTerms: ["colitis", "ulcerative colitis", "microscopic colitis", "collagenous colitis", "lymphocytic colitis", "ischemic colitis", "pseudomembranous colitis", "immune-mediated colitis", "enterocolitis"],
    diagnosticCodes: [
      { code: "7323", name: "Colitis, ulcerative", cfr: "38 CFR 4.114" },
      { code: "7326", name: "Crohn's disease or undifferentiated form of inflammatory bowel disease", cfr: "38 CFR 4.114" },
    ],
    why: "Acid reducers and anti-inflammatories are associated with microscopic and collagenous colitis, antibiotics with C. difficile colitis, and certain cancer immunotherapies with immune-mediated colitis.",
    limitation:
      "Neither code is named for drug-induced colitis specifically. VA would have to evaluate it by analogy under 38 CFR 4.20 — that is an adjudicator's judgment call, not something this app or any app can settle.",
  },

  // ── Heart, blood vessels, kidneys ─────────────────────────────────────────
  {
    key: "myocardial_infarction",
    label: "Heart attack",
    plain: "A heart attack happens when blood flow to part of the heart muscle is blocked long enough that the muscle is damaged.",
    labelTerms: ["myocardial infarction", "heart attack", "cardiovascular thrombotic events", "arterial thrombotic events", "acute coronary syndrome", "major adverse cardiovascular events", "myocardial ischemia"],
    diagnosticCodes: [
      { code: "7006", name: "Myocardial infarction", cfr: "38 CFR 4.104" },
      { code: "7005", name: "Arteriosclerotic heart disease (coronary artery disease)", cfr: "38 CFR 4.104" },
      { code: "7017", name: "Coronary bypass surgery", cfr: "38 CFR 4.104" },
    ],
    why: "Whole classes of common prescriptions carry FDA-required warnings about clot-driven heart events — non-steroidal anti-inflammatory drugs carry a boxed warning for cardiovascular thrombotic events including heart attack.",
  },
  {
    key: "coronary_artery_disease",
    label: "Coronary artery disease",
    plain: "Narrowing or hardening of the arteries that supply blood to the heart muscle.",
    labelTerms: ["coronary artery disease", "ischemic heart disease", "atherosclerosis", "accelerated atherosclerosis", "angina", "angina pectoris", "coronary artery stenosis"],
    diagnosticCodes: [
      { code: "7005", name: "Arteriosclerotic heart disease (coronary artery disease)", cfr: "38 CFR 4.104" },
      { code: "7017", name: "Coronary bypass surgery", cfr: "38 CFR 4.104" },
      { code: "7007", name: "Hypertensive heart disease", cfr: "38 CFR 4.104" },
    ],
    why: "Medications can push the underlying disease forward rather than cause a single event: steroids, certain antiretrovirals and antipsychotics, and some cancer agents are labeled for effects on lipids, blood pressure, or vascular injury that accelerate hardening of the arteries over years.",
  },
  {
    key: "hypertension",
    label: "High blood pressure",
    plain: "Blood pressure that stays higher than normal over time, straining the heart, brain, kidneys, and blood vessels.",
    labelTerms: ["hypertension", "increased blood pressure", "blood pressure increased", "elevated blood pressure", "worsening hypertension", "new-onset hypertension", "hypertensive crisis"],
    diagnosticCodes: [
      { code: "7101", name: "Hypertensive vascular disease (hypertension and isolated systolic hypertension)", cfr: "38 CFR 4.104" },
      { code: "7007", name: "Hypertensive heart disease", cfr: "38 CFR 4.104" },
    ],
    why: "Raising blood pressure is one of the most commonly labeled medication effects in medicine — anti-inflammatories and steroids through salt and fluid retention, stimulants and SNRIs through sympathetic drive, and several cancer and transplant drugs directly.",
  },
  {
    key: "arrhythmia",
    label: "Irregular heartbeat",
    plain: "A heartbeat that is too fast, too slow, or irregular because of a problem in the heart's electrical system.",
    labelTerms: ["qt prolongation", "qtc prolongation", "prolonged qt interval", "torsades de pointes", "ventricular tachycardia", "ventricular arrhythmia", "atrial fibrillation", "cardiac arrhythmias", "bradycardia", "supraventricular tachycardia", "av block", "atrioventricular block"],
    diagnosticCodes: [
      { code: "7010", name: "Supraventricular tachycardia", cfr: "38 CFR 4.104" },
      { code: "7011", name: "Ventricular arrhythmias (sustained)", cfr: "38 CFR 4.104" },
      { code: "7015", name: "Atrioventricular block", cfr: "38 CFR 4.104" },
      { code: "7018", name: "Implantable cardiac pacemakers", cfr: "38 CFR 4.104" },
    ],
    why: "A very large number of everyday drugs affect the heart's electrical timing: many antipsychotics and antidepressants, some antibiotics, anti-nausea drugs, and methadone carry QT-prolongation warnings, while beta blockers and rate-control agents are labeled for slow rhythms and heart block.",
  },
  {
    key: "heart_failure",
    label: "Heart failure",
    plain: "The heart muscle cannot pump strongly or fill well enough to meet the body's needs, causing breathlessness, fatigue, and swelling.",
    labelTerms: ["heart failure", "congestive heart failure", "cardiac failure", "cardiomyopathy", "cardiotoxicity", "left ventricular dysfunction", "decreased ejection fraction", "myocarditis"],
    diagnosticCodes: [
      { code: "7020", name: "Cardiomyopathy", cfr: "38 CFR 4.104" },
      { code: "7007", name: "Hypertensive heart disease", cfr: "38 CFR 4.104" },
      { code: "7005", name: "Arteriosclerotic heart disease (coronary artery disease)", cfr: "38 CFR 4.104" },
    ],
    why: "Some drugs damage heart muscle directly — anthracycline chemotherapy, trastuzumab, and clozapine, which is labeled for myocarditis and cardiomyopathy — while others, such as certain diabetes drugs and anti-inflammatories, are labeled for fluid retention that can precipitate or worsen it.",
  },
  {
    key: "stroke_cva_residuals",
    label: "Stroke and its lasting effects",
    plain:
      "A stroke happens when blood flow to part of the brain is blocked or a brain blood vessel bleeds, and the lasting effects can include weakness, speech, vision, balance, or memory problems.",
    labelTerms: ["stroke", "cerebrovascular accident", "cerebrovascular events", "ischemic stroke", "hemorrhagic stroke", "cerebral infarction", "cerebral hemorrhage", "intracranial hemorrhage", "transient ischemic attack"],
    diagnosticCodes: [
      { code: "8008", name: "Brain, vessels, thrombosis of", cfr: "38 CFR 4.124a" },
      { code: "8007", name: "Brain, vessels, embolism of", cfr: "38 CFR 4.124a" },
      { code: "8009", name: "Brain, vessels, hemorrhage from", cfr: "38 CFR 4.124a" },
    ],
    why: "Clot-related and bleeding-related brain events appear on many FDA labels: anti-inflammatories carry a boxed warning covering stroke, antipsychotics carry one for cerebrovascular events in elderly patients with dementia, and blood thinners carry bleeding warnings.",
  },
  {
    key: "chronic_kidney_disease",
    label: "Kidney damage",
    plain: "The kidneys have been damaged and filter waste from the blood less well than they should, often without symptoms until it is advanced.",
    labelTerms: ["nephrotoxicity", "nephrotoxic", "renal failure", "acute kidney injury", "renal impairment", "renal insufficiency", "chronic kidney disease", "interstitial nephritis", "nephropathy", "toxic nephropathy", "acute tubular necrosis", "elevated serum creatinine", "nephrotic syndrome", "renal papillary necrosis"],
    diagnosticCodes: [
      // Transcribed verbatim from 38 CFR 4.115b, including the regulation's own
      // misspelling of "antibotics" — quoting a federal code name accurately
      // matters more than tidying it, and a "[sic]" would misquote it too.
      { code: "7535", name: "Toxic nephropathy (antibotics, radiocontrast agents, nonsteroidal anti-inflammatory agents, heavy metals, and similar agents)", cfr: "38 CFR 4.115b" },
      { code: "7537", name: "Interstitial nephritis, including gouty nephropathy, disorders of calcium metabolism", cfr: "38 CFR 4.115b" },
      { code: "7502", name: "Nephritis, chronic", cfr: "38 CFR 4.115b" },
      { code: "7530", name: "Chronic renal disease requiring regular dialysis", cfr: "38 CFR 4.115b" },
    ],
    why: "This is the one place in the entire VA rating schedule where the diagnostic code itself names medications as the cause: DC 7535 is titled toxic nephropathy and expressly lists antibiotics, radiocontrast agents, and non-steroidal anti-inflammatory agents.",
  },
  {
    key: "nephrolithiasis",
    label: "Kidney stones",
    plain: "Hard mineral deposits that form in the kidney or urinary tract and can cause severe pain, blood in the urine, or blockage.",
    labelTerms: ["nephrolithiasis", "kidney stones", "renal calculi", "urolithiasis", "ureterolithiasis", "nephrocalcinosis", "urinary calculus", "crystalluria", "renal colic"],
    diagnosticCodes: [
      { code: "7508", name: "Nephrolithiasis/Ureterolithiasis/Nephrocalcinosis", cfr: "38 CFR 4.115b" },
      { code: "7509", name: "Hydronephrosis", cfr: "38 CFR 4.115b" },
    ],
    why: "Several widely prescribed drugs are labeled for stone formation — topiramate, zonisamide, and acetazolamide change urine chemistry, and certain protease inhibitors and sulfonamides are labeled for drug crystal stones.",
  },

  // ── Nerves, brain, ears ───────────────────────────────────────────────────
  {
    key: "peripheral_neuropathy",
    label: "Nerve damage in the hands, feet, arms, or legs",
    plain:
      "Damage to the nerves outside the brain and spinal cord, usually felt as numbness, tingling, burning, or weakness that most often begins in the feet and hands.",
    labelTerms: ["peripheral neuropathy", "polyneuropathy", "paresthesia", "paraesthesia", "hypoesthesia", "numbness and tingling", "neuropathic pain", "sensory neuropathy", "neurotoxicity"],
    diagnosticCodes: [
      { code: "8520", name: "Sciatic nerve, paralysis of", cfr: "38 CFR 4.124a" },
      { code: "8620", name: "Sciatic nerve, neuritis", cfr: "38 CFR 4.124a" },
      { code: "8720", name: "Sciatic nerve, neuralgia", cfr: "38 CFR 4.124a" },
      { code: "8515", name: "Median nerve, paralysis of", cfr: "38 CFR 4.124a" },
      { code: "8516", name: "Ulnar nerve, paralysis of", cfr: "38 CFR 4.124a" },
      { code: "8521", name: "External popliteal nerve (common peroneal), paralysis of", cfr: "38 CFR 4.124a" },
    ],
    why: "Fluoroquinolone antibiotics carry an FDA boxed warning for peripheral neuropathy, and several chemotherapy agents, metronidazole, and long-term isoniazid carry the same labeled effect.",
    limitation:
      "VA has no single \"peripheral neuropathy\" code. Under 38 CFR 4.124a it codes by WHICH nerve is affected and in which limb, across three parallel series — paralysis, neuritis, and neuralgia — so the sciatic nerve is 8520, 8620, or 8720 depending on type. The codes above are representative, not the whole list; which one applies is an examiner's finding.",
  },
  {
    key: "seizure_disorder",
    label: "Seizures",
    plain: "A sudden burst of abnormal electrical activity in the brain, which can cause convulsions, staring spells, confusion, or loss of consciousness.",
    labelTerms: ["seizure", "seizures", "convulsion", "convulsions", "status epilepticus", "epilepsy", "tonic-clonic", "grand mal", "lowers the seizure threshold", "seizure threshold"],
    diagnosticCodes: [
      { code: "8910", name: "Epilepsy, grand mal", cfr: "38 CFR 4.124a" },
      { code: "8911", name: "Epilepsy, petit mal", cfr: "38 CFR 4.124a" },
      { code: "8912", name: "Epilepsy, Jacksonian and focal motor or sensory", cfr: "38 CFR 4.124a" },
      { code: "8914", name: "Epilepsy, psychomotor", cfr: "38 CFR 4.124a" },
    ],
    why: "Certain antidepressants, antipsychotics, stimulants, some antibiotics, tramadol, and abrupt withdrawal from sedatives all carry FDA label warnings about lowering the seizure threshold or causing seizures.",
  },
  {
    key: "tardive_dyskinesia",
    label: "Tardive dyskinesia and drug-induced movement problems",
    plain:
      "Repetitive, involuntary movements — often lip smacking, tongue or jaw movements, grimacing, or writhing of the fingers and limbs — that can develop after months or years on certain medications and may persist after the drug is stopped.",
    labelTerms: ["tardive dyskinesia", "extrapyramidal symptoms", "extrapyramidal reactions", "dyskinesia", "involuntary movements", "abnormal involuntary movements", "dystonia", "drug-induced parkinsonism", "tremor"],
    diagnosticCodes: [
      { code: "8103", name: "Tic, convulsive", cfr: "38 CFR 4.124a" },
      { code: "8104", name: "Paramyoclonus multiplex (convulsive state, myoclonic type)", cfr: "38 CFR 4.124a" },
    ],
    why: "This is one of the best-documented medication-caused neurological conditions in existence — first-generation and many second-generation antipsychotics carry an explicit FDA warning about it, as does metoclopramide, and risk rises with cumulative exposure over time.",
    limitation:
      "There is no diagnostic code named \"tardive dyskinesia\" or \"tremor\" anywhere in the rating schedule. VA evaluates these by analogy under 38 CFR 4.20, most often to the codes above — which is an adjudicator's judgment, not a settled mapping. Note also that DC 8004 (Paralysis agitans) is the PARKINSON'S code and is not the right code for drug-induced movement effects.",
  },
  {
    key: "cognitive_impairment",
    label: "Memory and thinking problems",
    plain: "Measurable trouble with memory, attention, word-finding, planning, or processing speed that is noticeable to the person or to those around them.",
    labelTerms: ["memory impairment", "amnesia", "anterograde amnesia", "cognitive impairment", "cognitive disorder", "confusional state", "disturbance in attention", "delirium", "dementia"],
    diagnosticCodes: [
      { code: "9326", name: "Major or mild neurocognitive disorder due to another medical condition or substance/medication-induced major or mild neurocognitive disorder", cfr: "38 CFR 4.130" },
      { code: "9310", name: "Unspecified neurocognitive disorder", cfr: "38 CFR 4.130" },
    ],
    why: "Benzodiazepines, sleep medications, opioids, anticholinergics, and some anti-seizure drugs are documented on FDA labels as causing memory impairment or confusion. DC 9326 is notable because its official name literally includes the phrase \"substance/medication-induced\" — it is the code VA wrote for exactly this situation.",
  },
  {
    key: "tinnitus",
    label: "Ringing in the ears (tinnitus)",
    plain: "Hearing a ringing, buzzing, hissing, roaring, or clicking sound that has no external source.",
    labelTerms: ["tinnitus", "ringing in the ears", "ototoxicity", "ototoxic", "hyperacusis"],
    diagnosticCodes: [{ code: "6260", name: "Tinnitus, recurrent", cfr: "38 CFR 4.87" }],
    why: "Tinnitus appears on an unusually large number of FDA labels — high-dose aspirin and other salicylates, anti-inflammatories, aminoglycoside and macrolide antibiotics, loop diuretics, and platinum-based chemotherapy are classic examples. For some drugs the effect reverses when the drug stops; for others it does not.",
    limitation:
      "VA's Hearing Loss and Tinnitus exam form is restricted to VA and VA-contracted examiners — a private provider cannot complete it. What a private clinician CAN do is document the tinnitus and its onset relative to the medication in your treatment record.",
  },
  {
    key: "sensorineural_hearing_loss",
    label: "Hearing loss from inner-ear damage",
    plain:
      "Permanent hearing loss caused by damage to the hair cells of the inner ear or to the hearing nerve, rather than by a blockage in the ear canal or eardrum.",
    labelTerms: ["hearing loss", "hearing impaired", "ototoxicity", "ototoxic", "deafness", "hypoacusis", "sensorineural hearing loss", "cochlear damage", "auditory toxicity"],
    diagnosticCodes: [{ code: "6100", name: "Hearing impairment", cfr: "38 CFR 4.85" }],
    why: "Aminoglycoside antibiotics, platinum-based chemotherapy, high-dose loop diuretics, and vancomycin are the best-documented ototoxic drug classes, and the damage typically starts in the high frequencies before it reaches conversational speech.",
    limitation:
      "As with tinnitus, VA's hearing exam form is restricted to VA and VA-contracted examiners. A private audiogram using the Maryland CNC speech-discrimination test is still the evidence that matters — bring it to your VSO.",
  },
  {
    key: "vertigo_vestibular_dysfunction",
    label: "Vertigo and balance problems",
    plain:
      "Damage to the balance organs of the inner ear, causing spinning sensations, unsteadiness, or a feeling that the world bounces when you move your head.",
    labelTerms: ["vertigo", "vestibular toxicity", "vestibular disorder", "balance disorder", "disequilibrium", "oscillopsia", "labyrinthitis"],
    diagnosticCodes: [
      { code: "6204", name: "Peripheral vestibular disorders", cfr: "38 CFR 4.87" },
      { code: "6205", name: "Meniere's syndrome (endolymphatic hydrops)", cfr: "38 CFR 4.87" },
    ],
    why: "Aminoglycosides — gentamicin above all — are so reliably toxic to the vestibular organs that the effect is used therapeutically in some settings, and vertigo also appears on the labels of many blood pressure medications, sedatives, and antibiotics.",
  },

  // ── Hormones, blood ───────────────────────────────────────────────────────
  {
    key: "diabetes_mellitus_type_2",
    label: "Type 2 diabetes",
    plain: "A condition in which the body cannot keep blood sugar in a normal range, because it either does not make enough insulin or does not respond to it properly.",
    labelTerms: ["diabetes mellitus", "new-onset diabetes", "hyperglycemia", "blood glucose increased", "glucose intolerance", "insulin resistance", "hemoglobin a1c increased", "diabetic ketoacidosis"],
    diagnosticCodes: [{ code: "7913", name: "Diabetes mellitus", cfr: "38 CFR 4.119" }],
    why: "Long-term steroids, second-generation antipsychotics, certain antiretrovirals, and thiazide diuretics all carry FDA labeling describing raised blood sugar or new-onset diabetes, generally by increasing insulin resistance or reducing insulin secretion.",
  },
  {
    key: "hypothyroidism",
    label: "Underactive thyroid",
    plain: "The thyroid gland makes too little thyroid hormone, which can cause fatigue, weight change, cold intolerance, constipation, and low mood.",
    labelTerms: ["hypothyroidism", "thyroid dysfunction", "tsh increased", "thyroiditis", "myxedema", "goiter", "thyroid function test abnormal"],
    diagnosticCodes: [
      { code: "7903", name: "Hypothyroidism", cfr: "38 CFR 4.119" },
      { code: "7906", name: "Thyroiditis", cfr: "38 CFR 4.119" },
    ],
    why: "Lithium and amiodarone are among the most common medication causes of hypothyroidism worldwide, and because these are drugs typically taken for years to manage another condition, thyroid disease that emerges during treatment is a recognized secondary question.",
  },
  {
    key: "hyperthyroidism",
    label: "Overactive thyroid",
    plain: "The thyroid gland makes too much thyroid hormone, which can cause a racing heartbeat, unintended weight loss, tremor, heat intolerance, and anxiety.",
    labelTerms: ["hyperthyroidism", "thyrotoxicosis", "tsh decreased", "graves' disease", "thyroid storm", "hyperthyroxinemia"],
    diagnosticCodes: [
      { code: "7900", name: "Hyperthyroidism, including, but not limited to, Graves' disease", cfr: "38 CFR 4.119" },
      { code: "7906", name: "Thyroiditis", cfr: "38 CFR 4.119" },
    ],
    why: "Amiodarone delivers a very large iodine load and is labeled for thyrotoxicosis, and immune checkpoint inhibitors and interferon commonly produce an inflammatory thyroiditis.",
  },
  {
    key: "adrenal_insufficiency",
    label: "Adrenal insufficiency (low cortisol)",
    plain:
      "The adrenal glands do not make enough cortisol, which can cause severe fatigue, low blood pressure, nausea, and dangerous crises during illness, surgery, or injury.",
    labelTerms: ["adrenal insufficiency", "adrenal suppression", "hpa axis suppression", "hypothalamic-pituitary-adrenal axis suppression", "adrenal crisis", "hypoadrenalism", "corticosteroid withdrawal"],
    diagnosticCodes: [{ code: "7911", name: "Addison's disease (adrenocortical insufficiency)", cfr: "38 CFR 4.119" }],
    why: "Prolonged steroid use — including inhaled, topical, and injected steroids, not only pills — suppresses the body's own cortisol production. Because steroids are so often prescribed for service-connected joint, spine, and lung conditions, this is a recognized secondary pathway.",
    limitation:
      "State this one carefully: the code that exists is Addison's disease, which is primary failure of the adrenal glands themselves. Steroid-induced adrenal suppression is a different mechanism, and whether it is evaluated under this code is a question for an examiner — not something to assume.",
  },
  {
    key: "cushings_syndrome",
    label: "Cushing's syndrome (steroid excess)",
    plain:
      "What happens when the body is exposed to too much cortisol or steroid over time — weight gain in the trunk and face, thin easily bruised skin, muscle weakness, high blood sugar, and bone loss.",
    labelTerms: ["cushing's syndrome", "cushingoid", "hypercorticism", "moon face", "buffalo hump", "striae", "adrenal hyperfunction"],
    diagnosticCodes: [{ code: "7907", name: "Cushing's syndrome", cfr: "38 CFR 4.119" }],
    why: "Prescribed steroids are by far the most common cause of Cushing's syndrome generally, and FDA labels for systemic steroids describe cushingoid features directly.",
  },
  {
    key: "diabetes_insipidus",
    label: "Diabetes insipidus",
    plain:
      "A hormone and kidney problem that makes the body pass very large volumes of dilute urine and feel constantly thirsty. Despite the name it has nothing to do with blood sugar.",
    labelTerms: ["diabetes insipidus", "nephrogenic diabetes insipidus", "polyuria", "polydipsia", "urine concentrating defect"],
    diagnosticCodes: [{ code: "7909", name: "Diabetes insipidus", cfr: "38 CFR 4.119" }],
    why: "Lithium is the textbook medication cause: over years it damages the kidney's ability to respond to antidiuretic hormone. Since lithium is prescribed long-term for psychiatric conditions that are frequently service connected, this is a recognized secondary pathway.",
  },
  {
    key: "osteoporosis_osteopenia",
    label: "Bone thinning",
    plain: "The bones have lost density and strength, raising the chance of a fracture from a fall, a lift, or sometimes no clear injury at all.",
    labelTerms: ["osteoporosis", "osteopenia", "bone mineral density decreased", "bone loss", "pathologic fracture", "fragility fracture", "vertebral compression fracture", "decreased bone density"],
    diagnosticCodes: [{ code: "5013", name: "Osteoporosis, residuals of", cfr: "38 CFR 4.71a" }],
    why: "Steroids are the leading medication cause of secondary bone loss, and long-term acid reducers, certain anti-seizure medications, SSRIs, and androgen-deprivation therapy all carry labeled bone-density or fracture effects.",
    limitation:
      "The code is written as osteoporosis \"residuals of\" — meaning what VA evaluates is the resulting limitation, typically in the affected joint or spine, rather than a bone-density number on its own.",
  },
  {
    key: "thrombocytopenia",
    label: "Low platelets",
    plain:
      "Too few platelets, the cells that form clots, so a person may bruise easily, get nosebleeds or bleeding gums, or bleed longer than expected from small cuts.",
    labelTerms: ["thrombocytopenia", "immune thrombocytopenia", "platelet count decreased", "petechiae", "purpura", "ecchymosis", "heparin-induced thrombocytopenia"],
    diagnosticCodes: [{ code: "7705", name: "Immune thrombocytopenia", cfr: "38 CFR 4.117" }],
    why: "Drugs lower platelets two different ways — an immune reaction in which the body destroys its own platelets (heparin, quinine, valproate, certain antibiotics), or direct suppression of the bone marrow that makes them.",
    limitation:
      "The only code in the rating schedule that names low platelets is written specifically as IMMUNE thrombocytopenia. Cases caused by marrow suppression rather than an immune reaction do not fit that title cleanly, which is a question for an examiner.",
  },
  {
    key: "leukopenia_agranulocytosis",
    label: "Low white blood cells",
    plain:
      "Too few white blood cells — and in the severe form, infection-fighting neutrophils fall very low, leaving a person unusually vulnerable to serious infection.",
    labelTerms: ["agranulocytosis", "neutropenia", "leukopenia", "white blood cell count decreased", "neutrophil count decreased", "granulocytopenia", "febrile neutropenia", "myelosuppression", "pancytopenia"],
    diagnosticCodes: [
      { code: "7702", name: "Agranulocytosis, acquired", cfr: "38 CFR 4.117" },
      { code: "7716", name: "Aplastic anemia", cfr: "38 CFR 4.117" },
    ],
    why: "Clozapine is the best-known example — its FDA labeling requires ongoing blood-count monitoring precisely because of severe neutropenia — and methimazole, carbamazepine, sulfasalazine, and chemotherapy agents carry the same labeled risk.",
    limitation:
      "The rating schedule contains no code titled \"leukopenia\" or \"neutropenia.\" The code that exists is acquired agranulocytosis, which describes the severe end of the range.",
  },

  // ── Sexual, urinary, mental health ────────────────────────────────────────
  {
    key: "erectile_dysfunction",
    label: "Erectile dysfunction",
    plain: "Difficulty getting or keeping an erection firm enough for sex.",
    labelTerms: ["erectile dysfunction", "impotence", "impotency", "erectile disorder", "decreased potency", "erection impaired"],
    diagnosticCodes: [{ code: "7522", name: "Erectile dysfunction, with or without penile deformity", cfr: "38 CFR 4.115b" }],
    why: "Very large classes of prescribed drugs list erectile dysfunction — SSRIs and SNRIs, antipsychotics, beta blockers, thiazide diuretics, finasteride, and opioids — which is why it is one of the most frequently raised secondary conditions when the condition being treated is already service connected.",
  },
  {
    key: "sexual_dysfunction",
    label: "Other sexual dysfunction",
    plain: "Reduced sexual desire, difficulty becoming aroused, difficulty reaching orgasm, or changes in ejaculation.",
    labelTerms: ["sexual dysfunction", "decreased libido", "libido decreased", "loss of libido", "anorgasmia", "orgasm abnormal", "delayed ejaculation", "ejaculation failure", "retrograde ejaculation", "female sexual dysfunction"],
    diagnosticCodes: [
      { code: "7522", name: "Erectile dysfunction, with or without penile deformity", cfr: "38 CFR 4.115b" },
      { code: "7632", name: "Female sexual arousal disorder (FSAD)", cfr: "38 CFR 4.116" },
    ],
    why: "Serotonergic antidepressants, antipsychotics, hormonal agents, and some blood pressure medications commonly list decreased libido, anorgasmia, and ejaculatory changes.",
    limitation:
      "The rating schedule has no diagnostic code for low libido, anorgasmia, or ejaculatory dysfunction on their own. The two codes above are the only named sexual-dysfunction codes, and neither covers those specifically.",
  },
  {
    key: "infertility",
    label: "Impaired fertility",
    plain: "A reduced or absent ability to conceive a child — in men often low or absent sperm, in women loss of ovulation.",
    labelTerms: ["infertility", "impaired fertility", "impairment of fertility", "azoospermia", "oligospermia", "sperm count decreased", "abnormal spermatogenesis", "testicular atrophy", "ovarian failure", "premature ovarian failure"],
    diagnosticCodes: [
      { code: "7523", name: "Testis, atrophy complete", cfr: "38 CFR 4.115b" },
      { code: "7615", name: "Ovary, disease, injury, or adhesions of", cfr: "38 CFR 4.116" },
      { code: "7620", name: "Ovaries, atrophy of both, complete", cfr: "38 CFR 4.116" },
    ],
    why: "Chemotherapy agents, some immunosuppressants and antirheumatic drugs, hormonal therapies, and certain long-term opioid regimens carry fertility-impairment language on their labels.",
    limitation:
      "There is no diagnostic code named \"infertility\" anywhere in the rating schedule. The codes above describe specific organ findings — complete atrophy, disease of the ovary — not infertility itself.",
  },
  {
    key: "urinary_frequency_incontinence",
    label: "Urinary frequency and incontinence",
    plain: "Needing to urinate much more often than normal, including waking at night, or leaking urine without meaning to.",
    labelTerms: ["urinary frequency", "pollakiuria", "urinary incontinence", "urinary urgency", "nocturia", "urinary retention", "urinary hesitation", "bladder dysfunction", "overactive bladder"],
    diagnosticCodes: [
      { code: "7512", name: "Cystitis, chronic, includes interstitial and all etiologies, infectious and non-infectious", cfr: "38 CFR 4.115b" },
      { code: "7517", name: "Bladder, injury of", cfr: "38 CFR 4.115b" },
      { code: "7542", name: "Neurogenic bladder", cfr: "38 CFR 4.115b" },
    ],
    why: "Diuretics, lithium, anticholinergics and their withdrawal, alpha blockers, some antidepressants and antipsychotics, and SGLT2 inhibitors are all associated on-label with changes in urination.",
    limitation:
      "Urinary frequency and incontinence have no diagnostic code of their own. VA rates them as \"voiding dysfunction\" under whichever genitourinary code fits the underlying cause — which is why the codes above name causes rather than the symptom.",
  },
  {
    key: "drug_induced_depression",
    label: "Depression linked to a medication",
    plain: "Persistent low mood with loss of interest, and changes in sleep, energy, appetite, or concentration.",
    labelTerms: ["depression", "depressed mood", "major depression", "depressive disorder", "suicidal ideation", "suicidal behavior", "suicide", "mood altered", "dysphoria", "anhedonia"],
    diagnosticCodes: [
      { code: "9434", name: "Major depressive disorder", cfr: "38 CFR 4.130" },
      { code: "9435", name: "Unspecified depressive disorder", cfr: "38 CFR 4.130" },
      { code: "9433", name: "Persistent depressive disorder (dysthymia)", cfr: "38 CFR 4.130" },
    ],
    why: "Interferons, steroids, isotretinoin, montelukast, varenicline, and certain anti-seizure medications and beta blockers carry depression or suicidality language in their labeling — montelukast's is a boxed warning.",
    limitation:
      "Every mental-health condition in the schedule is evaluated under one shared General Rating Formula, so the specific code matters far less than the documented severity and functional impact. If this is where you are right now: the Veterans Crisis Line is 988, then press 1.",
  },
  {
    key: "drug_induced_anxiety",
    label: "Anxiety linked to a medication",
    plain: "Persistent worry, tension, restlessness, or panic that is hard to control and interferes with daily activity.",
    labelTerms: ["anxiety", "anxiety disorder", "nervousness", "agitation", "restlessness", "akathisia", "panic attack", "panic disorder", "psychomotor agitation"],
    diagnosticCodes: [
      { code: "9400", name: "Generalized anxiety disorder", cfr: "38 CFR 4.130" },
      { code: "9412", name: "Panic disorder and/or agoraphobia", cfr: "38 CFR 4.130" },
      { code: "9413", name: "Unspecified anxiety disorder", cfr: "38 CFR 4.130" },
    ],
    why: "Steroids, bronchodilators and stimulants, thyroid replacement, some antidepressants during the first weeks, and withdrawal from benzodiazepines or opioids are all associated on-label with anxiety, agitation, or akathisia.",
    limitation:
      "As with depression, all mental-health conditions share one General Rating Formula — the documented severity and functional impact carry the weight, not which code is used.",
  },

  // ── Lungs, skin, tendons ──────────────────────────────────────────────────
  {
    key: "asthma_bronchospasm",
    label: "Asthma and airway narrowing",
    plain: "The airways tighten and narrow, causing wheezing, chest tightness, and shortness of breath.",
    labelTerms: ["bronchospasm", "paradoxical bronchospasm", "asthma", "asthma exacerbation", "wheezing", "status asthmaticus", "airway hyperreactivity", "aspirin-exacerbated respiratory disease"],
    diagnosticCodes: [
      { code: "6602", name: "Asthma, bronchial", cfr: "38 CFR 4.97" },
      { code: "6600", name: "Bronchitis, chronic", cfr: "38 CFR 4.97" },
    ],
    why: "Non-selective beta blockers can block the receptors that keep airways open, anti-inflammatories and aspirin can trigger bronchospasm in people with aspirin-exacerbated respiratory disease, and some inhaled medications carry paradoxical-bronchospasm warnings.",
  },
  {
    key: "interstitial_lung_disease",
    label: "Lung scarring (interstitial lung disease)",
    plain:
      "Inflammation and scarring of the tissue between the air sacs of the lungs, which stiffens the lungs and makes it harder to move oxygen into the blood.",
    labelTerms: ["interstitial lung disease", "pulmonary fibrosis", "pneumonitis", "interstitial pneumonitis", "drug-induced pneumonitis", "pulmonary toxicity", "pulmonary infiltrates", "organizing pneumonia", "hypersensitivity pneumonitis"],
    diagnosticCodes: [
      { code: "6829", name: "Drug-induced pulmonary pneumonitis and fibrosis", cfr: "38 CFR 4.97" },
      { code: "6825", name: "Diffuse interstitial fibrosis (interstitial pneumonitis, fibrosing alveolitis)", cfr: "38 CFR 4.97" },
    ],
    why: "The rating schedule anticipates this directly — DC 6829 is literally named \"Drug-induced pulmonary pneumonitis and fibrosis,\" so VA already recognizes medication as a cause of lung scarring. Amiodarone, methotrexate, nitrofurantoin, and bleomycin carry pulmonary-toxicity language on their labels.",
  },
  {
    key: "drug_eruption_dermatitis",
    label: "Drug rash",
    plain: "A rash or inflamed, itchy skin reaction that appears after starting a medication.",
    labelTerms: ["drug rash", "drug eruption", "maculopapular rash", "morbilliform rash", "exfoliative dermatitis", "lichenoid drug eruption", "drug reaction with eosinophilia and systemic symptoms", "dress"],
    diagnosticCodes: [
      { code: "7806", name: "Dermatitis or eczema", cfr: "38 CFR 4.118" },
      { code: "7825", name: "Chronic urticaria", cfr: "38 CFR 4.118" },
    ],
    why: "Skin reactions are among the most commonly reported adverse drug effects, because the immune system can recognize a drug or its breakdown products as foreign — antibiotics, anti-seizure medications, anti-inflammatories, and allopurinol are frequent examples.",
  },
  {
    key: "stevens_johnson_syndrome",
    label: "Stevens-Johnson syndrome and toxic epidermal necrolysis",
    plain: "Rare, medical-emergency reactions in which the top layer of skin and the mucous membranes blister and peel away.",
    labelTerms: ["stevens-johnson syndrome", "toxic epidermal necrolysis", "severe cutaneous adverse reactions", "erythema multiforme", "epidermal necrolysis", "skin sloughing", "acute generalized exanthematous pustulosis"],
    diagnosticCodes: [
      { code: "7827", name: "Erythema multiforme; Toxic epidermal necrolysis", cfr: "38 CFR 4.118" },
      { code: "7800", name: "Burn scar(s) of the head, face, or neck; scar(s) of the head, face, or neck due to other causes; or other disfigurement of the head, face, or neck", cfr: "38 CFR 4.118" },
      { code: "7804", name: "Scar(s), unstable or painful", cfr: "38 CFR 4.118" },
    ],
    why: "These are severe immune-mediated reactions in which the body attacks skin cells after exposure to a triggering drug — sulfonamide antibiotics, lamotrigine, carbamazepine, allopurinol, and anti-inflammatories carry this warning. What usually matters for a claim is the lasting residuals: permanent scarring, and sometimes eye or airway damage.",
  },
  {
    key: "tendinopathy_tendon_rupture",
    label: "Tendon injury or rupture",
    plain: "Painful degeneration or inflammation of a tendon, or a partial or complete tear of the tendon that connects muscle to bone.",
    labelTerms: ["tendinitis", "tendonitis", "tendon rupture", "tendinopathy", "tendon disorders", "achilles tendon rupture", "tendon inflammation"],
    diagnosticCodes: [{ code: "5024", name: "Tenosynovitis, tendinitis, tendinosis or tendinopathy", cfr: "38 CFR 4.71a" }],
    why: "Fluoroquinolone antibiotics — ciprofloxacin, levofloxacin and others — carry an FDA boxed warning for tendinitis and tendon rupture because they appear to disrupt the collagen structure of tendon tissue. The Achilles tendon is the most commonly reported site, and risk is higher with age and with concurrent steroids.",
  },
  {
    key: "osteonecrosis_of_jaw",
    label: "Osteonecrosis of the jaw",
    plain: "Death of jawbone tissue, which can leave exposed bone in the mouth that will not heal.",
    labelTerms: ["osteonecrosis of the jaw", "medication-related osteonecrosis of the jaw", "mronj", "exposed bone", "nonhealing extraction socket", "osteomyelitis of the jaw"],
    diagnosticCodes: [
      { code: "9900", name: "Maxilla or mandible, chronic osteomyelitis, osteonecrosis or osteoradionecrosis of", cfr: "38 CFR 4.150" },
    ],
    why: "Bisphosphonates and denosumab suppress the bone-remodeling cells that normally repair microdamage, and the jaw is uniquely exposed to mouth bacteria and dental procedures — which is why these labels advise a dental exam before starting therapy.",
  },
];

export const MEDICATION_EFFECT_BY_KEY: Record<string, MedicationEffect> = Object.fromEntries(
  MEDICATION_EFFECTS.map((e) => [e.key, e]),
);
