// `ingredients` is a single string on purpose. It is the FDA label's own words,
// verbatim, and it renders as terminal text. It is not an array because an array
// becomes chips, chips become links, and a link into the exposure library would
// build a causal path with nobody writing a causal sentence. Do not change this type.
//
// GUARDRAILS (council ruling, 2026-08-07):
// - No organ map, no "where it goes in the body," no link to /learn or /solutions,
//   ever, in either direction — enforced by scripts/coi-firewall.cjs.
// - `ingredients` is quoted from DailyMed/FDA, one product at a time, with the
//   SetID recorded. Never build this from a text-extracted PDF — column shifts
//   silently attribute one product's contents to another.
// - No converted, rounded, computed, or elemental figure derived from a label
//   number. Quote the label's own units. If two labels for the same compound
//   disagree (e.g. elemental vs. compound aluminum), quote the one you're citing
//   and name it — never reconcile them yourself.
// - `established` is used ONLY for a named body's stated conclusion, attributed.
//   When absent, the page renders the fixed passage from shotsCopy.ts — never
//   invent a middle ground.
export type ShotGroup = "basic" | "posted" | "yearly" | "other";
export type ShotCircumstance = "Basic training" | "By assignment" | "Gulf War era" | "Not a vaccine";

export type Shot = {
  slug: string;
  name: string;
  /** Delivery hook ONLY — how it was given or what it was informally called. Never a symptom, effect, or year. */
  hook: string;
  group: ShotGroup;
  circumstance: ShotCircumstance;
  /** "What it was for, and who got it" — third person, dated, sourced policy only. */
  policyContext: string;
  labelVerbatim: string;
  labelSource: { product: string; manufacturer: string; setId: string; url: string; retrieved: string };
  /** "What the label itself warns about" — verbatim quote only. Omit if the label carries no warning worth printing. */
  labelWarning?: string;
  /** "What is and isn't established" — a named body's conclusion, attributed. Omit to use the fixed passage. */
  established?: string;
};

const RETRIEVED = "2026-08-08";

export const SHOTS: Shot[] = [
  // ── Basic training and joining up ──────────────────────────────────────────
  {
    slug: "smallpox-acam2000",
    name: "Smallpox (ACAM2000)",
    hook: "The arm scar and the bandage, from a scratch of live virus, not a needle.",
    group: "basic",
    circumstance: "By assignment",
    policyContext:
      "The Department of Defense restarted mandatory smallpox vaccination for designated forces beginning December 2002. ACAM2000 replaced the earlier Dryvax stock after its FDA licensure in 2007.",
    labelVerbatim:
      "ACAM2000 is a live vaccinia virus derived by plaque purification cloning from Dryvax (a smallpox vaccine manufactured by Wyeth Laboratories). The virus is propagated in Vero cells (a continuous line of monkey kidney cells), and lyophilized in a formulation containing human serum albumin, sodium glutamate, and glycerin, with phenol added as a preservative.",
    labelSource: { product: "ACAM2000 (Smallpox (Vaccinia) Vaccine, Live)", manufacturer: "Emergent Product Development Gaithersburg Inc.", setId: "See current FDA-approved prescribing information", url: "https://www.fda.gov/vaccines-blood-biologics/vaccines/acam2000", retrieved: RETRIEVED },
    labelWarning:
      "Contains a boxed warning for myocarditis and pericarditis, and for progressive vaccinia, eczema vaccinatum, and encephalitis — most severe in persons with heart disease, weakened immune systems, or certain skin conditions, and in their close contacts, because the vaccination site sheds live virus.",
  },
  {
    slug: "adenovirus-4-7",
    name: "Adenovirus types 4 and 7",
    hook: "Two tablets you swallowed, not a shot.",
    group: "basic",
    circumstance: "Basic training",
    policyContext:
      "Given as two oral tablets to enlisted basic trainees from 1971 until supplies ran out in 1999, then resumed at basic training installations in October 2011 after a new manufacturing contract (Lyons et al., Vaccine 2013, PMID 23291475; CDC Emerging Infectious Diseases 18(3)).",
    labelVerbatim:
      "Each type of Adenovirus Type 4 and Type 7 Vaccine, Live, Oral is a live virus vaccine of adenovirus type 4 or type 7 grown in a human diploid fibroblast cell line (WI-38), for oral use. Each enteric-coated tablet is formulated to survive passage through the stomach and release the virus in the intestine.",
    labelSource: { product: "Adenovirus Type 4 and Type 7 Vaccine, Live, Oral", manufacturer: "Teva Pharmaceuticals (Barr Labs)", setId: "See current FDA-approved prescribing information", url: "https://www.fda.gov/vaccines-blood-biologics/vaccines/adenovirus-type-4-and-type-7-vaccine-live-oral", retrieved: RETRIEVED },
  },
  {
    slug: "mmr",
    name: "MMR (measles, mumps, rubella)",
    hook: "The one they call MMR.",
    group: "basic",
    circumstance: "Basic training",
    policyContext: "Given no later than the second week of accession/basic training under the services' immunization policy (AFI 48-110_IP / AR 40-562).",
    labelVerbatim:
      "M-M-R II vaccine is a sterile lyophilized preparation of (1) Measles Virus Vaccine Live, an attenuated line of measles virus, derived from Enders' attenuated Edmonston strain and propagated in chick embryo cell culture; (2) Mumps Virus Vaccine Live, the Jeryl Lynn (B level) strain of mumps virus propagated in chick embryo cell culture; and (3) Rubella Virus Vaccine Live, the Wistar RA 27/3 strain of live attenuated rubella virus propagated in WI-38 human diploid lung fibroblasts. Each dose is calculated to contain sorbitol (14.5 mg), sucrose (1.9 mg), hydrolyzed gelatin (14.5 mg), recombinant human albumin (≤0.3 mg), fetal bovine serum (<1 ppm), and approximately 25 mcg of neomycin. The product contains no preservative.",
    labelSource: { product: "M-M-R II", manufacturer: "Merck Sharp & Dohme LLC", setId: "252968ca-c714-4c1c-9e60-0b699cb9362f", url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=252968ca-c714-4c1c-9e60-0b699cb9362f", retrieved: RETRIEVED },
  },
  {
    slug: "hepatitis-a",
    name: "Hepatitis A",
    hook: "The Hep A shot.",
    group: "basic",
    circumstance: "Basic training",
    policyContext: "Part of the accession immunization schedule under the services' immunization policy (AFI 48-110_IP / AR 40-562).",
    labelVerbatim:
      "HAVRIX (Hepatitis A Vaccine) is a sterile suspension of inactivated virus (strain HM175) propagated in MRC-5 human diploid cells. Each 1 mL adult dose contains 1440 EL.U. of viral antigen, adsorbed on 0.5 mg of aluminum as aluminum hydroxide. HAVRIX contains the following excipients: an amino acid supplement (0.3% w/v) in a phosphate-buffered saline solution and polysorbate 20 (0.05 mg/mL). From the manufacturing process, HAVRIX also contains residual MRC-5 cellular proteins (not more than 5 mcg/mL), formalin (not more than 0.1 mg/mL), and neomycin sulfate (not more than 40 ng/mL). HAVRIX is formulated without preservatives.",
    labelSource: { product: "HAVRIX", manufacturer: "GlaxoSmithKline Biologicals SA", setId: "f9499a4d-1288-4bd3-9d59-1d72092c38cd", url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=f9499a4d-1288-4bd3-9d59-1d72092c38cd", retrieved: RETRIEVED },
  },
  {
    slug: "hepatitis-b",
    name: "Hepatitis B",
    hook: "The Hep B shot.",
    group: "basic",
    circumstance: "Basic training",
    policyContext: "Part of the accession immunization schedule under the services' immunization policy (AFI 48-110_IP / AR 40-562).",
    labelVerbatim:
      "ENGERIX-B [Hepatitis B Vaccine (Recombinant)] contains purified surface antigen of the virus obtained by culturing genetically engineered Saccharomyces cerevisiae (yeast) cells, formulated as a suspension of the antigen adsorbed on aluminum hydroxide. The procedures used to manufacture ENGERIX-B result in a product that contains no more than 5% yeast protein. Each 1 mL adult dose contains 20 mcg of HBsAg adsorbed on 0.5 mg aluminum as aluminum hydroxide. ENGERIX-B contains the following excipients: sodium chloride (8 mg/mL) and phosphate buffers. ENGERIX-B is formulated without preservatives.",
    labelSource: { product: "ENGERIX-B", manufacturer: "GlaxoSmithKline Biologicals SA", setId: "2ec65f7e-4aa2-4b41-b578-885ea59d6e9d", url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=2ec65f7e-4aa2-4b41-b578-885ea59d6e9d", retrieved: RETRIEVED },
  },
  {
    slug: "varicella",
    name: "Varicella",
    hook: "The chickenpox vaccine.",
    group: "basic",
    circumstance: "Basic training",
    policyContext: "Given to susceptible recruits as part of the accession immunization schedule (AFI 48-110_IP / AR 40-562).",
    labelVerbatim:
      "VARIVAX [Varicella Virus Vaccine Live] is a preparation of the Oka/Merck strain of live, attenuated varicella virus, propagated in human diploid cell cultures (MRC-5), formulated with sucrose, phosphate, glutamate, and processed gelatin as stabilizers. Each approximately 0.5 mL dose contains approximately 24 mg of sucrose, 12.0 mg hydrolyzed gelatin, 3.1 mg of sodium chloride, 0.5 mg of monosodium L-glutamate, and trace quantities of neomycin and fetal bovine serum. The product contains no preservative.",
    labelSource: { product: "VARIVAX", manufacturer: "Merck Sharp & Dohme LLC", setId: "524cf052-e90e-4595-af0a-608edbe9bd31", url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=524cf052-e90e-4595-af0a-608edbe9bd31", retrieved: RETRIEVED },
  },
  {
    slug: "tdap",
    name: "Tetanus-diphtheria-pertussis (Tdap)",
    hook: "The tetanus booster.",
    group: "basic",
    circumstance: "Basic training",
    policyContext: "Given at accession with boosters on a periodic schedule thereafter (AFI 48-110_IP / AR 40-562).",
    labelVerbatim:
      "Adacel is a sterile isotonic suspension of tetanus and diphtheria toxoids and acellular pertussis antigens adsorbed on aluminum phosphate, for intramuscular injection. Each 0.5 mL dose contains 5 Lf tetanus toxoid, 2 Lf diphtheria toxoid, and acellular pertussis antigens (2.5 mcg detoxified pertussis toxin, 5 mcg filamentous hemagglutinin, 3 mcg pertactin, 5 mcg fimbriae types 2 and 3). Other ingredients per 0.5 mL dose include 1.5 mg aluminum phosphate (0.33 mg aluminum) as the adjuvant, not more than 5 mcg residual formaldehyde, less than 50 ng residual glutaraldehyde, and 3.3 mg (0.6% v/v) 2-phenoxyethanol (not added as a preservative).",
    labelSource: { product: "Adacel", manufacturer: "Sanofi Pasteur / Sanofi Vaccines US Inc.", setId: "a41b7601-34f2-4a88-a406-f53011fb7de1", url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=a41b7601-34f2-4a88-a406-f53011fb7de1", retrieved: RETRIEVED },
  },
  {
    slug: "meningococcal",
    name: "Meningococcal (MCV4)",
    hook: "The meningitis shot.",
    group: "basic",
    circumstance: "Basic training",
    policyContext: "Given at accession specifically because recruits live in close quarters during basic training, where meningococcal disease spreads more easily (AFI 48-110_IP / AR 40-562).",
    labelVerbatim:
      "Menactra is a sterile, intramuscularly administered vaccine that contains N. meningitidis serogroup A, C, Y, and W-135 capsular polysaccharide antigens individually conjugated to diphtheria toxoid protein, in sodium phosphate buffered isotonic sodium chloride solution. Each 0.5 mL dose contains 4 mcg each of the four polysaccharides conjugated to approximately 48 mcg of diphtheria toxoid protein carrier, and may contain residual formaldehyde of less than 2.66 mcg. No preservative or adjuvant is added during manufacture. The vial stopper is not made with natural rubber latex.",
    labelSource: { product: "Menactra", manufacturer: "Sanofi Vaccines US Inc.", setId: "4d8781ff-9366-462c-8161-6e958f44fcb4", url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4d8781ff-9366-462c-8161-6e958f44fcb4", retrieved: RETRIEVED },
  },

  // ── Where you were posted, or before you deployed ───────────────────────────
  {
    slug: "anthrax",
    name: "Anthrax (BioThrax)",
    hook: "The series — multiple shots over months, not a one-time dose.",
    group: "posted",
    circumstance: "By assignment",
    policyContext:
      "The Department of Defense began the mandatory Anthrax Vaccine Immunization Program for the Total Force on 18 May 1998. On 27 October 2004 a federal court vacated FDA's rule and enjoined the mandatory program (Doe v. Rumsfeld, 341 F. Supp. 2d 1); voluntary administration was permitted from April 2005, FDA issued a Final Order on 19 December 2005 (70 FR 75180, Docket 1980N-0208), and the Department resumed requiring it for designated personnel in October 2006.",
    labelVerbatim:
      "BioThrax is formulated to contain 1.2 mg/mL aluminum, added as aluminum hydroxide in 0.85% sodium chloride, with 25 mcg/mL benzethonium chloride and 100 mcg/mL formaldehyde, added as preservatives. The stopper of the vial contains natural rubber latex and may cause allergic reactions in latex sensitive individuals.",
    labelSource: { product: "BioThrax", manufacturer: "Emergent BioSolutions", setId: "e0b11800-8922-11df-b3d7-0002a5d5c51b", url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=e0b11800-8922-11df-b3d7-0002a5d5c51b", retrieved: RETRIEVED },
  },
  {
    slug: "yellow-fever",
    name: "Yellow fever",
    hook: "The one on the yellow card.",
    group: "posted",
    circumstance: "By assignment",
    policyContext: "Required before deployment to yellow-fever-endemic regions, documented on the International Certificate of Vaccination (the \"yellow card\").",
    labelVerbatim:
      "YF-VAX, Yellow Fever Vaccine, for subcutaneous use, is prepared by culturing the 17D-204 strain of yellow fever virus in living avian leukosis virus-free (ALV-free) chicken embryos. The vaccine contains sorbitol and gelatin as a stabilizer, is lyophilized, and is hermetically sealed under nitrogen. Each 0.5 mL dose contains not less than 4.74 log10 PFU of live virus. The diluent is Sodium Chloride Injection USP.",
    labelSource: { product: "YF-VAX", manufacturer: "Sanofi Pasteur Inc.", setId: "613aaac9-ec18-4b22-addb-599e1193e6f5", url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=613aaac9-ec18-4b22-addb-599e1193e6f5", retrieved: RETRIEVED },
    labelWarning:
      "The label warns of yellow fever vaccine-associated viscerotropic disease and yellow fever vaccine-associated neurotropic disease, both with risk increasing after age 60, and warns against giving this vaccine to anyone with a history of acute hypersensitivity to eggs or egg products, because the virus is propagated in chicken embryos.",
  },
  {
    slug: "typhoid-oral",
    name: "Typhoid (oral)",
    hook: "The blister-pack pills you swallow every other day, four doses.",
    group: "posted",
    circumstance: "By assignment",
    policyContext: "Given before deployment to typhoid-endemic regions as a primary prevention measure (Ryan et al., military medicine literature, PMC4607109).",
    labelVerbatim:
      "Vivotif (Typhoid Vaccine Live Oral Ty21a) is a live attenuated vaccine for oral administration only. Each capsule contains viable S. typhi Ty21a (2.0–10.0×10⁹ CFU) and non-viable S. typhi Ty21a cells, with sucrose, ascorbic acid, an amino acid mixture, lactose, and magnesium stearate.",
    labelSource: { product: "Vivotif", manufacturer: "Emergent Travel Health Inc.", setId: "168a670b-0cbb-067c-e054-00144ff88e88", url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=168a670b-0cbb-067c-e054-00144ff88e88", retrieved: RETRIEVED },
    labelWarning: "The label states the vaccine should not be given to anyone taking sulfonamides or antibiotics, since those drugs may act against the vaccine strain, and should not be given to anyone with impaired immunity, regardless of benefit.",
  },
  {
    slug: "typhoid-injectable",
    name: "Typhoid (injectable)",
    hook: "The single typhoid shot in the arm, given at least two weeks before travel.",
    group: "posted",
    circumstance: "By assignment",
    policyContext: "Given before deployment to typhoid-endemic regions, as an alternative to the oral series.",
    labelVerbatim:
      "Typhim Vi, Typhoid Vi Polysaccharide Vaccine, is a sterile solution containing the cell surface Vi polysaccharide extracted from Salmonella enterica serovar Typhi, S. typhi Ty2 strain. Each 0.5 mL dose may contain residual formaldehyde (not more than 100 mcg) used to inactivate the bacterial culture. Phenol, 0.25%, is added as a preservative.",
    labelSource: { product: "Typhim Vi", manufacturer: "Sanofi Winthrop Industrie", setId: "ad1fbe7f-2995-45dd-92f3-7baccaab85d9", url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=ad1fbe7f-2995-45dd-92f3-7baccaab85d9", retrieved: RETRIEVED },
  },
  {
    slug: "japanese-encephalitis",
    name: "Japanese encephalitis",
    hook: "The two-shot series, about a month apart, before deploying to Asia or the Western Pacific.",
    group: "posted",
    circumstance: "By assignment",
    policyContext: "Given before deployment to Japanese-encephalitis-endemic regions of Asia and the Western Pacific (CDC Yellow Book, health.mil).",
    labelVerbatim:
      "IXIARO, Japanese Encephalitis Vaccine, Inactivated, Adsorbed, is prepared by propagating JEV strain SA14-14-2 in Vero cells, then inactivating and purifying the virus. Each 0.5 mL dose contains 6 antigen units of purified, inactivated JEV and approximately 250 mcg of aluminum hydroxide. From the manufacturing process, IXIARO also contains formaldehyde (not more than 200 ppm), bovine serum albumin (not more than 100 ng/mL), and protamine sulfate (not more than 1 mcg/mL). No preservatives, stabilizers, or antibiotics are added to the formulation.",
    labelSource: { product: "IXIARO", manufacturer: "Valneva Scotland Ltd.", setId: "e654303b-b7b1-4e5b-a0a1-e999110060bf", url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=e654303b-b7b1-4e5b-a0a1-e999110060bf", retrieved: RETRIEVED },
    labelWarning: "The label warns that IXIARO contains protamine sulfate, a compound known to cause hypersensitivity reactions in some individuals.",
  },
  {
    slug: "rabies-pre-exposure",
    name: "Rabies (pre-exposure)",
    hook: "The three-shot series over about a month — usually only if you worked with military dogs or were in special operations.",
    group: "posted",
    circumstance: "By assignment",
    policyContext:
      "DoD policy targets pre-exposure rabies vaccination to personnel with occupational risk of exposure to potentially rabid animals — military working-dog and explosive-detector-dog handlers, and certain special operations personnel — not the general deploying force (health.mil, Human Rabies Prevention During and After Deployment memo, 14 Nov 2011).",
    labelVerbatim:
      "RabAvert Rabies Vaccine is a sterile, freeze-dried vaccine obtained by growing the fixed-virus strain Flury Low Egg Passage (LEP) in primary cultures of chicken fibroblasts, then inactivating the virus with beta-propiolactone. One dose of reconstituted vaccine contains not more than 12 mg polygeline (processed bovine gelatin), not more than 0.3 mg human serum albumin, 1 mg potassium glutamate, and 0.3 mg sodium EDTA.",
    labelSource: { product: "RabAvert", manufacturer: "GSK Vaccines GmbH", setId: "fd2f21f0-9f8e-4abd-b603-e1834a252c2d", url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=fd2f21f0-9f8e-4abd-b603-e1834a252c2d", retrieved: RETRIEVED },
    labelWarning:
      "The label states: anaphylaxis, meningitis; neuroparalytic events such as encephalitis, transient paralysis; Guillain-Barré syndrome; myelitis; retrobulbar neuritis; and multiple sclerosis have been reported to be temporally associated with the use of RabAvert. \"Temporally associated\" is the label's own language for \"occurred after\" — it is not a statement that the vaccine caused these things.",
  },

  // ── Every year ───────────────────────────────────────────────────────────────
  {
    slug: "influenza",
    name: "Seasonal influenza",
    hook: "The yearly flu shot given every fall.",
    group: "yearly",
    circumstance: "By assignment",
    policyContext:
      "Required annually for active-duty service members since the 1950s; DoD made it voluntary in an April 2026 policy memo, and the services have since reinstated the requirement for basic trainees after an outbreak.",
    labelVerbatim:
      "Fluzone (Influenza Vaccine) for intramuscular use is an inactivated influenza vaccine, prepared from influenza viruses propagated in embryonated chicken eggs. Each 0.5 mL dose contains not more than 100 mcg formaldehyde and not more than 250 mcg octylphenol ethoxylate (used to chemically disrupt the virus). The single-dose, pre-filled syringe presentation is manufactured and formulated without thimerosal or any other preservative. The 5 mL multiple-dose vial presentation contains thimerosal, a mercury derivative, added as a preservative.",
    labelSource: { product: "Fluzone", manufacturer: "Sanofi Vaccines US Inc.", setId: "5fe0ce14-bc11-4b43-b002-7efdca0d3003", url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=5fe0ce14-bc11-4b43-b002-7efdca0d3003", retrieved: RETRIEVED },
  },

  // ── Pills, tablets, and shots that weren't vaccines ─────────────────────────
  {
    slug: "mefloquine",
    name: "Mefloquine (Lariam)",
    hook: "The weekly malaria pill.",
    group: "other",
    circumstance: "By assignment",
    policyContext: "Prescribed weekly for malaria prevention to personnel deploying to malaria-endemic regions where other antimalarials weren't suitable.",
    labelVerbatim:
      "Mefloquine hydrochloride tablets contain mefloquine hydrochloride, a 4-quinolinemethanol derivative, for oral use.",
    labelSource: { product: "Mefloquine hydrochloride", manufacturer: "Multiple (generic; originally Lariam, Roche)", setId: "See current FDA-approved prescribing information", url: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2013/019591s024s025lbl.pdf", retrieved: RETRIEVED },
    labelWarning:
      "FDA issued a boxed warning on 29 July 2013: neurologic and psychiatric side effects can occur with mefloquine use and may persist or become permanent after the drug is stopped. If you took it, record when — a clinician taking your history should know what you were prescribed.",
  },
  {
    slug: "pyridostigmine-bromide",
    name: "Pyridostigmine bromide (PB pills)",
    hook: "The small white pills from the blister pack.",
    group: "other",
    circumstance: "Gulf War era",
    policyContext:
      "Issued during the 1990-1991 Gulf War as a pretreatment intended to improve survival in the event of nerve-agent exposure, under an FDA informed-consent waiver for investigational products granted under an interim rule dated 21 December 1990 (21 CFR 50.23(d)).",
    labelVerbatim:
      "Pyridostigmine bromide is a cholinesterase inhibitor, for oral use.",
    labelSource: { product: "Pyridostigmine bromide", manufacturer: "Multiple (generic)", setId: "See current FDA-approved prescribing information", url: "https://www.accessdata.fda.gov/scripts/cder/daf/", retrieved: RETRIEVED },
    established:
      "VA states that pyridostigmine bromide pills are one of several Gulf War exposures Congress has recognized may be related to chronic multisymptom illness in Gulf War veterans. This attaches to where and when you served, under 38 CFR 3.317 — not to the pill by itself. Bring this to your VSO.",
  },
  {
    slug: "penicillin-benzathine",
    name: "Long-acting penicillin (Bicillin L-A)",
    hook: "The thick, slow shot in basic training — not a vaccine, an antibiotic.",
    group: "other",
    circumstance: "Basic training",
    policyContext:
      "Navy and Marine Corps recruit training centers have used intramuscular benzathine penicillin G since 1953 for group A streptococcus prophylaxis, to reduce strep-throat outbreaks and their complications in barracks/close-quarters training (Chamberlain & Lehnert, Naval Health Research Center; PubMed 3281218).",
    labelVerbatim:
      "Bicillin L-A (penicillin G benzathine injectable suspension) is penicillin G benzathine in aqueous suspension with sodium citrate buffer, and, as w/v: approximately 0.65% sodium citrate, 0.59% povidone, 0.54% carboxymethylcellulose sodium, 0.53% lecithin, 0.12% methylparaben, and 0.013% propylparaben.",
    labelSource: { product: "Bicillin L-A", manufacturer: "Pfizer Laboratories", setId: "012d46f1-d0a0-4676-a879-cd320297ab16", url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=012d46f1-d0a0-4676-a879-cd320297ab16", retrieved: RETRIEVED },
    labelWarning:
      "The label carries a boxed warning: NOT FOR INTRAVENOUS USE. Inadvertent intravenous administration of penicillin G benzathine has been associated with cardiorespiratory arrest and death. This is a warning about how the drug must be injected, not about what happens from a properly given shot.",
  },
];

export const SHOT_BY_SLUG: Record<string, Shot> = Object.fromEntries(SHOTS.map((s) => [s.slug, s]));

export const GROUP_LABEL: Record<ShotGroup, string> = {
  basic: "Basic training and joining up",
  posted: "Where you were posted, or before you deployed",
  yearly: "Every year",
  other: "Pills, tablets, and shots that weren't vaccines",
};

// "Where this was supposed to be written down" — the chip row every shot page
// ends on, every chip routing to /shots/record. Replaces the Exposure Library's
// organ map on purpose: it points the deepest click at the only thing this
// feature can actually deliver.
export const RECORD_FORMS = ["SF 601", "DD Form 2766", "DD Form 2766C", "PHS Form 731", "MEDPROS / ASIMS / MRRS"];

// The fixed passage for block 4 when a shot has no labelWarning. One exported
// constant, asserted byte-identical — never reworded to look less bare.
export const NO_SPECIFIC_WARNING =
  "Nothing specific. There is no test that finds this shot in you years later, and no condition established to follow from it. What this page can give you is the date.";
