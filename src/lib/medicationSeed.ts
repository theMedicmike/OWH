// COMMON VA-PRESCRIBED MEDICATIONS — a search-ahead list, nothing more.
//
// This exists so the search box isn't an empty text field a veteran has to
// spell a drug name into from memory. It is NOT the limit of what the feature
// covers: anything typed here goes to the live openFDA label API, which holds
// roughly 260,000 labels. This list is the on-ramp, not the catalogue.
//
// Nothing here says what any drug does. Effects come from the FDA's own label
// at read time (lib/medicationLabels.ts), never from a list a human typed.
//
// Weighted toward what actually shows up in veteran care: chronic pain, mental
// health, sleep, cardiovascular, diabetes, GI, nerve pain, and the antibiotic
// and antimalarial classes with well-known long-term effects.

export type SeedMedication = {
  /** Generic name — the primary key a veteran is most likely to be handed. */
  generic: string;
  /** Common brand names, for people who only ever knew it by the brand. */
  brands: string[];
  /** Plain English, never clinical shorthand. */
  klass: string;
  /** Set when the drug's US availability itself is part of the record. */
  historicalNote?: string;
};

export const MEDICATION_SEED: SeedMedication[] = [
  // Pain / anti-inflammatory
  { generic: "Ibuprofen", brands: ["Motrin", "Advil"], klass: "Anti-inflammatory pain reliever" },
  { generic: "Naproxen", brands: ["Naprosyn", "Aleve"], klass: "Anti-inflammatory pain reliever" },
  { generic: "Meloxicam", brands: ["Mobic"], klass: "Anti-inflammatory pain reliever" },
  { generic: "Diclofenac", brands: ["Voltaren"], klass: "Anti-inflammatory pain reliever (pill or gel)" },
  { generic: "Celecoxib", brands: ["Celebrex"], klass: "Anti-inflammatory pain reliever" },
  { generic: "Indomethacin", brands: ["Indocin"], klass: "Strong anti-inflammatory pain reliever" },
  { generic: "Aspirin", brands: ["Bayer", "Ecotrin"], klass: "Pain reliever and blood thinner" },
  { generic: "Acetaminophen", brands: ["Tylenol"], klass: "Pain and fever reliever" },

  // Opioids and substance-use treatment
  { generic: "Hydrocodone-acetaminophen", brands: ["Norco", "Vicodin"], klass: "Opioid pain reliever" },
  { generic: "Oxycodone", brands: ["Roxicodone", "Percocet"], klass: "Opioid pain reliever" },
  { generic: "Tramadol", brands: ["Ultram"], klass: "Opioid pain reliever" },
  { generic: "Morphine", brands: ["MS Contin"], klass: "Opioid pain reliever" },
  { generic: "Methadone", brands: ["Dolophine"], klass: "Opioid pain reliever / dependence treatment" },
  { generic: "Buprenorphine-naloxone", brands: ["Suboxone"], klass: "Opioid use disorder treatment" },
  { generic: "Naltrexone", brands: ["ReVia", "Vivitrol"], klass: "Alcohol and opioid craving treatment" },

  // Mental health
  { generic: "Sertraline", brands: ["Zoloft"], klass: "Antidepressant (SSRI)" },
  { generic: "Fluoxetine", brands: ["Prozac"], klass: "Antidepressant (SSRI)" },
  { generic: "Paroxetine", brands: ["Paxil"], klass: "Antidepressant (SSRI)" },
  { generic: "Citalopram", brands: ["Celexa"], klass: "Antidepressant (SSRI)" },
  { generic: "Escitalopram", brands: ["Lexapro"], klass: "Antidepressant (SSRI)" },
  { generic: "Venlafaxine", brands: ["Effexor"], klass: "Antidepressant (SNRI)" },
  { generic: "Duloxetine", brands: ["Cymbalta"], klass: "Antidepressant (SNRI), also used for nerve pain" },
  { generic: "Bupropion", brands: ["Wellbutrin"], klass: "Antidepressant" },
  { generic: "Mirtazapine", brands: ["Remeron"], klass: "Sedating antidepressant" },
  { generic: "Trazodone", brands: ["Desyrel"], klass: "Antidepressant, often prescribed for sleep" },
  { generic: "Amitriptyline", brands: ["Elavil"], klass: "Tricyclic antidepressant" },
  { generic: "Nortriptyline", brands: ["Pamelor"], klass: "Tricyclic antidepressant" },
  { generic: "Prazosin", brands: ["Minipress"], klass: "Blood-pressure medication widely prescribed for PTSD nightmares" },
  { generic: "Quetiapine", brands: ["Seroquel"], klass: "Antipsychotic" },
  { generic: "Risperidone", brands: ["Risperdal"], klass: "Antipsychotic" },
  { generic: "Aripiprazole", brands: ["Abilify"], klass: "Antipsychotic" },
  { generic: "Olanzapine", brands: ["Zyprexa"], klass: "Antipsychotic" },
  { generic: "Lithium", brands: ["Lithobid"], klass: "Mood stabilizer" },
  { generic: "Lamotrigine", brands: ["Lamictal"], klass: "Mood stabilizer / anti-seizure" },
  { generic: "Divalproex", brands: ["Depakote"], klass: "Mood stabilizer / anti-seizure" },
  { generic: "Topiramate", brands: ["Topamax"], klass: "Anti-seizure, also used for migraine" },
  { generic: "Buspirone", brands: ["BuSpar"], klass: "Anti-anxiety (non-controlled)" },
  { generic: "Hydroxyzine", brands: ["Vistaril"], klass: "Anti-anxiety / antihistamine" },

  // Benzodiazepines and sleep
  { generic: "Diazepam", brands: ["Valium"], klass: "Benzodiazepine" },
  { generic: "Lorazepam", brands: ["Ativan"], klass: "Benzodiazepine" },
  { generic: "Clonazepam", brands: ["Klonopin"], klass: "Benzodiazepine" },
  { generic: "Alprazolam", brands: ["Xanax"], klass: "Benzodiazepine" },
  { generic: "Zolpidem", brands: ["Ambien"], klass: "Sleep medication" },
  { generic: "Temazepam", brands: ["Restoril"], klass: "Sleep medication (benzodiazepine)" },

  // Nerve pain and muscle
  { generic: "Gabapentin", brands: ["Neurontin"], klass: "Nerve pain / anti-seizure" },
  { generic: "Pregabalin", brands: ["Lyrica"], klass: "Nerve pain / anti-seizure" },
  { generic: "Cyclobenzaprine", brands: ["Flexeril"], klass: "Muscle relaxant" },
  { generic: "Methocarbamol", brands: ["Robaxin"], klass: "Muscle relaxant" },
  { generic: "Baclofen", brands: ["Lioresal"], klass: "Muscle relaxant" },
  { generic: "Tizanidine", brands: ["Zanaflex"], klass: "Muscle relaxant" },
  { generic: "Carisoprodol", brands: ["Soma"], klass: "Muscle relaxant" },

  // Cardiovascular
  { generic: "Atorvastatin", brands: ["Lipitor"], klass: "Cholesterol medication (statin)" },
  { generic: "Simvastatin", brands: ["Zocor"], klass: "Cholesterol medication (statin)" },
  { generic: "Rosuvastatin", brands: ["Crestor"], klass: "Cholesterol medication (statin)" },
  { generic: "Pravastatin", brands: ["Pravachol"], klass: "Cholesterol medication (statin)" },
  { generic: "Lisinopril", brands: ["Zestril", "Prinivil"], klass: "Blood pressure medication (ACE inhibitor)" },
  { generic: "Losartan", brands: ["Cozaar"], klass: "Blood pressure medication" },
  { generic: "Amlodipine", brands: ["Norvasc"], klass: "Blood pressure medication" },
  { generic: "Metoprolol", brands: ["Lopressor", "Toprol-XL"], klass: "Blood pressure medication (beta blocker)" },
  { generic: "Carvedilol", brands: ["Coreg"], klass: "Blood pressure medication (beta blocker)" },
  { generic: "Atenolol", brands: ["Tenormin"], klass: "Blood pressure medication (beta blocker)" },
  { generic: "Propranolol", brands: ["Inderal"], klass: "Beta blocker, also used for tremor and anxiety" },
  { generic: "Hydrochlorothiazide", brands: ["Microzide"], klass: "Water pill (diuretic)" },
  { generic: "Furosemide", brands: ["Lasix"], klass: "Water pill (diuretic)" },
  { generic: "Clonidine", brands: ["Catapres"], klass: "Blood pressure medication, also used in PTSD care" },

  // Diabetes
  { generic: "Metformin", brands: ["Glucophage"], klass: "Diabetes medication" },
  { generic: "Glipizide", brands: ["Glucotrol"], klass: "Diabetes medication" },
  { generic: "Insulin glargine", brands: ["Lantus", "Basaglar"], klass: "Long-acting insulin" },
  { generic: "Empagliflozin", brands: ["Jardiance"], klass: "Diabetes medication" },
  { generic: "Sitagliptin", brands: ["Januvia"], klass: "Diabetes medication" },

  // Stomach
  { generic: "Omeprazole", brands: ["Prilosec"], klass: "Acid reducer (proton pump inhibitor)" },
  { generic: "Pantoprazole", brands: ["Protonix"], klass: "Acid reducer (proton pump inhibitor)" },
  { generic: "Famotidine", brands: ["Pepcid"], klass: "Acid reducer" },
  {
    generic: "Ranitidine",
    brands: ["Zantac"],
    klass: "Acid reducer",
    historicalNote:
      "Withdrawn from the US market in 2020. Listed here because it belongs in a service-era record, not because it is still prescribed.",
  },
  { generic: "Ondansetron", brands: ["Zofran"], klass: "Anti-nausea medication" },

  // Antibiotics and antimalarials
  { generic: "Ciprofloxacin", brands: ["Cipro"], klass: "Antibiotic (fluoroquinolone)" },
  { generic: "Levofloxacin", brands: ["Levaquin"], klass: "Antibiotic (fluoroquinolone)" },
  { generic: "Moxifloxacin", brands: ["Avelox"], klass: "Antibiotic (fluoroquinolone)" },
  { generic: "Doxycycline", brands: ["Vibramycin"], klass: "Antibiotic" },
  { generic: "Amoxicillin-clavulanate", brands: ["Augmentin"], klass: "Antibiotic" },
  { generic: "Azithromycin", brands: ["Zithromax"], klass: "Antibiotic" },
  { generic: "Sulfamethoxazole-trimethoprim", brands: ["Bactrim"], klass: "Antibiotic" },
  { generic: "Cephalexin", brands: ["Keflex"], klass: "Antibiotic" },
  {
    generic: "Mefloquine",
    brands: ["Lariam"],
    klass: "Antimalarial",
    historicalNote:
      "Widely issued for deployments to malaria areas. The Lariam brand was discontinued in the US; the FDA label carries a boxed warning.",
  },

  // Other high-volume
  { generic: "Prednisone", brands: ["Deltasone"], klass: "Steroid (anti-inflammatory)" },
  { generic: "Levothyroxine", brands: ["Synthroid"], klass: "Thyroid medication" },
  { generic: "Allopurinol", brands: ["Zyloprim"], klass: "Gout medication" },
  { generic: "Tamsulosin", brands: ["Flomax"], klass: "Prostate medication" },
  { generic: "Finasteride", brands: ["Proscar", "Propecia"], klass: "Prostate / hair-loss medication" },
  { generic: "Sildenafil", brands: ["Viagra"], klass: "Erectile dysfunction medication" },
  { generic: "Sumatriptan", brands: ["Imitrex"], klass: "Migraine medication" },
  { generic: "Albuterol", brands: ["ProAir", "Ventolin"], klass: "Rescue inhaler" },
  { generic: "Montelukast", brands: ["Singulair"], klass: "Asthma and allergy medication" },
  { generic: "Varenicline", brands: ["Chantix"], klass: "Smoking cessation medication" },
];

/** Match against generic OR brand, so someone who only remembers "Motrin"
 *  still finds it. Empty query returns a short starter set rather than all 90. */
export function searchSeed(query: string, limit = 8): SeedMedication[] {
  const q = query.trim().toLowerCase();
  if (!q) return MEDICATION_SEED.slice(0, limit);
  const starts: SeedMedication[] = [];
  const contains: SeedMedication[] = [];
  for (const m of MEDICATION_SEED) {
    const names = [m.generic, ...m.brands].map((n) => n.toLowerCase());
    if (names.some((n) => n.startsWith(q))) starts.push(m);
    else if (names.some((n) => n.includes(q))) contains.push(m);
  }
  return [...starts, ...contains].slice(0, limit);
}
