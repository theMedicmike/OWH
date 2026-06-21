"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

// Every service-relevant heavy metal / metalloid, with where it stores and the
// vital trace minerals/nutrients it displaces or depletes. Heuristic, for the
// scientific advisory board to validate and calibrate.
const METALS: { key: string; name: string; organs: string[]; minerals: string[] }[] = [
  { key: "pb", name: "Lead", organs: ["bone", "brain", "kidney"], minerals: ["calcium", "iron", "zinc"] },
  { key: "cd", name: "Cadmium", organs: ["kidney", "lungs", "bone"], minerals: ["zinc", "copper", "selenium", "calcium"] },
  { key: "hg", name: "Mercury", organs: ["brain", "kidney", "nervous system"], minerals: ["selenium", "zinc"] },
  { key: "as", name: "Arsenic", organs: ["skin", "liver", "peripheral nerves"], minerals: ["selenium", "zinc", "phosphate"] },
  { key: "u", name: "Depleted uranium", organs: ["kidney", "bone"], minerals: ["calcium", "phosphate"] },
  { key: "w", name: "Tungsten", organs: ["fragment sites", "bone"], minerals: ["molybdenum", "cobalt"] },
  { key: "co", name: "Cobalt", organs: ["heart", "thyroid", "lungs"], minerals: ["iron", "iodine"] },
  { key: "cr", name: "Chromium (VI)", organs: ["lungs", "sinuses", "kidney"], minerals: ["iron", "zinc"] },
  { key: "mn", name: "Manganese", organs: ["brain (basal ganglia)", "liver"], minerals: ["iron"] },
  { key: "ni", name: "Nickel", organs: ["lungs", "skin", "sinuses"], minerals: ["zinc", "magnesium", "iron"] },
  { key: "al", name: "Aluminum", organs: ["brain", "bone"], minerals: ["calcium", "magnesium", "iron", "phosphate"] },
  { key: "sb", name: "Antimony", organs: ["lungs", "heart"], minerals: ["selenium"] },
  { key: "be", name: "Beryllium", organs: ["lungs"], minerals: ["magnesium"] },
  { key: "v", name: "Vanadium", organs: ["lungs", "kidney"], minerals: ["chromium"] },
  { key: "tl", name: "Thallium", organs: ["nerves", "kidney"], minerals: ["potassium"] },
  { key: "ba", name: "Barium", organs: ["heart", "bone", "muscle"], minerals: ["potassium", "calcium"] },
];

type Contribution = Record<string, number>;

const ROLES: Record<string, Contribution> = {
  "Infantry / small arms": { pb: 20, sb: 6 },
  "Tank crew / armor": { u: 30, w: 20, pb: 15, co: 8 },
  "Artillery / mortars": { pb: 25, as: 8, ba: 6 },
  "Aviation door gunner": { pb: 25, v: 6, ni: 4 },
  "Range cadre / weapons instructor": { pb: 45, sb: 10 },
  "EOD / ordnance disposal": { pb: 20, as: 18, cd: 10, ba: 8 },
  "Mechanic / motor pool": { mn: 18, cr: 12, ni: 10, co: 8, cd: 12, pb: 10 },
  "Support / other": { pb: 5 },
};

const EXPOSURE_METALS: Record<string, Contribution> = {
  burn_pit: { pb: 15, cd: 12, as: 10, cr: 8, ni: 6 },
  heavy_metal: { pb: 18, cd: 15, hg: 10, as: 10 },
  radiation: { u: 30, pb: 6 },
  pesticide: { as: 14 },
  particulate: { pb: 8, cd: 6, mn: 6, v: 5 },
  water_contamination: { as: 8, pb: 5, cr: 4 },
  chemical_solvent: { cr: 6, ni: 4 },
  nerve_agent: {},
  asbestos_silica: {},
  pfas_afff: {},
  gulf_war_agent: { as: 5, al: 5 },
};

type Munition = { key: string; label: string; m: Contribution };
const MUNITION_GROUPS: { group: string; metals: string; items: Munition[] }[] = [
  {
    group: "Small arms",
    metals: "lead · antimony · copper",
    items: [
      { key: "m556", label: "5.56mm rifle", m: { pb: 18, sb: 4 } },
      { key: "m762", label: "7.62mm", m: { pb: 18, sb: 4 } },
      { key: "m9", label: "9mm pistol", m: { pb: 12, sb: 3 } },
      { key: "m50", label: ".50 cal (M2)", m: { pb: 22, sb: 5 } },
    ],
  },
  {
    group: "Cannon & crew-served",
    metals: "lead · tungsten",
    items: [
      { key: "c2530", label: "25 / 30mm cannon", m: { pb: 15, w: 6 } },
      { key: "g40", label: "40mm grenade", m: { pb: 12, as: 4 } },
    ],
  },
  {
    group: "Tank & artillery",
    metals: "tungsten · cobalt · lead · blast",
    items: [
      { key: "t120", label: "120mm tank main gun", m: { w: 25, u: 15, pb: 12, co: 6 } },
      { key: "a155", label: "155mm howitzer / mortars", m: { pb: 15, as: 6, ba: 5 } },
    ],
  },
  {
    group: "Ordnance & bombs",
    metals: "heavy metals · barium · blast",
    items: [
      { key: "demo", label: "Grenades / demolitions", m: { pb: 10, as: 8, ba: 6 } },
      { key: "b500", label: "500 lb bombs", m: { pb: 8, as: 6 } },
      { key: "b2000", label: "1,000–2,000 lb bombs", m: { pb: 10, as: 8 } },
    ],
  },
  {
    group: "Armor-piercing",
    metals: "depleted uranium · tungsten",
    items: [{ key: "du", label: "Depleted-uranium rounds", m: { u: 45, w: 15 } }],
  },
];
const RATES = ["None", "Some", "A lot", "Constant"];
const RATE_FACTOR = [0, 0.35, 0.7, 1.0];

// Non-metal contaminants. These don't "store" like metals; they deplete antioxidants
// and damage organs. Exposure load (not stored burden), driven by logged exposures + role.
const CONTAMINANTS: { key: string; name: string; systems: string[]; depletes: string[]; from: Record<string, number> }[] = [
  { key: "solv", name: "Solvents & fuels (benzene, TCE, JP-8)", systems: ["blood / bone marrow", "liver", "kidney", "nervous system"], depletes: ["glutathione", "antioxidants"], from: { chemical_solvent: 30, water_contamination: 20, burn_pit: 10 } },
  { key: "diox", name: "Dioxins & furans (Agent Orange, burn-pit plastics)", systems: ["thyroid / endocrine", "liver", "immune"], depletes: ["thyroid hormone", "vitamin A"], from: { pesticide: 30, burn_pit: 18 } },
  { key: "pfas", name: "PFAS / AFFF (forever chemicals)", systems: ["liver", "thyroid", "kidney", "immune"], depletes: ["thyroid function", "immune function"], from: { pfas_afff: 40, water_contamination: 15 } },
  { key: "pm", name: "Fine particulate & silica", systems: ["lungs", "cardiovascular"], depletes: ["antioxidants"], from: { burn_pit: 20, particulate: 30, asbestos_silica: 10 } },
  { key: "asb", name: "Asbestos fibers", systems: ["lungs (pleura)"], depletes: [], from: { asbestos_silica: 40 } },
  { key: "rad", name: "Ionizing radiation", systems: ["bone marrow", "thyroid", "broad cancer risk"], depletes: ["antioxidants", "DNA repair capacity"], from: { radiation: 40 } },
  { key: "op", name: "Nerve agents & organophosphates", systems: ["nervous system", "brain"], depletes: ["cholinesterase", "B-vitamins"], from: { nerve_agent: 35, pesticide: 12, gulf_war_agent: 10 } },
];
const CONTAMINANT_ROLE: Record<string, Record<string, number>> = {
  "Mechanic / motor pool": { solv: 18 },
  "Aviation door gunner": { solv: 12 },
};

const EXPOSURE_LABEL: Record<string, string> = {
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

function band(v: number) {
  if (v >= 70) return { label: "very high", bar: "#E24B4A", text: "#A32D2D" };
  if (v >= 45) return { label: "high", bar: "#BA7517", text: "#854F0B" };
  if (v >= 20) return { label: "moderate", bar: "#378ADD", text: "#185FA5" };
  return { label: "minimal", bar: "#888780", text: "#5F5E5A" };
}

function uniq(arr: string[]) {
  const out: string[] = [];
  for (const x of arr) if (!out.includes(x)) out.push(x);
  return out;
}

export default function EstimatorView() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [logged, setLogged] = useState<string[]>([]);
  const [role, setRole] = useState("Tank crew / armor");
  const [years, setYears] = useState(10);
  const [munRates, setMunRates] = useState<Record<string, number>>({});

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user ?? null);
      setReady(true);
      if (data.user) {
        const { data: rows } = await supabase.from("exposures").select("exposure_class");
        if (rows) setLogged(uniq((rows as { exposure_class: string }[]).map((r) => r.exposure_class)));
      }
    });
  }, [supabase]);

  const idx = useMemo(() => {
    const s: Contribution = {};
    for (const m of METALS) s[m.key] = 0;
    const add = (c?: Contribution, factor = 1) => {
      if (!c) return;
      for (const k of Object.keys(c)) s[k] = (s[k] ?? 0) + c[k] * factor;
    };
    add(ROLES[role]);
    for (const e of logged) add(EXPOSURE_METALS[e]);
    for (const g of MUNITION_GROUPS) {
      for (const it of g.items) {
        const r = munRates[it.key] ?? 0;
        if (r > 0) add(it.m, RATE_FACTOR[r]);
      }
    }
    const acc = 0.6 + (years / 50) * 0.8;
    const out: Contribution = {};
    for (const m of METALS) out[m.key] = Math.max(0, Math.min(100, Math.round((s[m.key] ?? 0) * acc)));
    return out;
  }, [role, years, logged, munRates]);

  const cload = useMemo(() => {
    const s: Contribution = {};
    for (const c of CONTAMINANTS) s[c.key] = 0;
    for (const e of logged) for (const c of CONTAMINANTS) if (c.from[e]) s[c.key] += c.from[e];
    const rb = CONTAMINANT_ROLE[role];
    if (rb) for (const k of Object.keys(rb)) s[k] = (s[k] ?? 0) + rb[k];
    const acc = 0.7 + (years / 50) * 0.4;
    const out: Contribution = {};
    for (const c of CONTAMINANTS) out[c.key] = Math.max(0, Math.min(100, Math.round((s[c.key] ?? 0) * acc)));
    return out;
  }, [logged, role, years]);

  const cPresent = CONTAMINANTS.filter((c) => cload[c.key] > 0).sort((a, b) => cload[b.key] - cload[a.key]);
  const cHigh = CONTAMINANTS.filter((c) => cload[c.key] >= 45);
  const cSystems = uniq(cHigh.flatMap((c) => c.systems));
  const cDepletes = uniq(cHigh.flatMap((c) => c.depletes));

  const present = METALS.filter((m) => idx[m.key] > 0).sort((a, b) => idx[b.key] - idx[a.key]);
  const high = METALS.filter((m) => idx[m.key] >= 45);
  const organs = uniq(high.flatMap((m) => m.organs));
  const minerals = uniq(high.flatMap((m) => m.minerals));

  const tests: string[] = [];
  if (idx.pb >= 45) tests.push("Bone-lead scan (K-XRF) for stored lead");
  if (idx.u >= 45) tests.push("Depleted-uranium urine test (VA surveillance program)");
  if (idx.cd >= 45) tests.push("Kidney function and cadmium panel");
  if (idx.hg >= 45) tests.push("Blood and urine mercury");
  if (idx.as >= 45) tests.push("Speciated urine arsenic");
  if (idx.mn >= 45) tests.push("Manganese panel and a neurological evaluation");
  if (idx.cr >= 45) tests.push("Chromium panel");
  if (cload.pfas >= 45) tests.push("Serum PFAS, a thyroid panel, and a lipid panel");
  if (cload.solv >= 45) tests.push("CBC for blood and marrow effects (benzene / solvents)");
  if (cload.rad >= 45) tests.push("Radiation dose review and cancer screening per guidance");
  if (cload.op >= 45) tests.push("Cholinesterase test and a neurological evaluation");
  if (cload.pm >= 45 || cload.asb >= 45) tests.push("Pulmonary function test and chest imaging");
  tests.push("A comprehensive metals panel, reviewed with a clinician");

  const setCount = Object.values(munRates).filter((r) => r > 0).length + logged.length;
  const confidence = setCount >= 4 ? "moderate" : "low";

  if (!ready) return <p className="text-sm text-zinc-500">Loading…</p>;

  if (!user) {
    return (
      <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Sign in on the map to build your record, then come back here for your estimate.
        </p>
        <Link href="/" className="mt-3 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400">
          ← Go to the map
        </Link>
      </div>
    );
  }

  const card = "rounded-xl border border-zinc-200 p-5 dark:border-zinc-800";

  return (
    <div className="space-y-4">
      <div className={card}>
        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Your service profile</div>
        <div className="mt-1 text-xs text-zinc-500">
          {logged.length > 0
            ? "Built from the exposures you logged on the map, plus the details below."
            : "Log exposures on the map and they'll feed this automatically. Add the details below too."}
        </div>

        {logged.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {logged.map((e) => (
              <span key={e} className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {EXPOSURE_LABEL[e] ?? e}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 grid gap-3">
          <div className="flex items-center gap-3">
            <label className="w-28 text-xs text-zinc-500">Primary role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="flex-1 rounded-md border border-zinc-300 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700">
              {Object.keys(ROLES).map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="w-28 text-xs text-zinc-500">Years of service</label>
            <input type="range" min={0} max={50} step={1} value={years} onChange={(e) => setYears(+e.target.value)} className="flex-1" />
            <span className="w-14 text-right text-sm font-medium">{years}</span>
          </div>
        </div>
      </div>

      <div className={card}>
        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Weapons &amp; munitions exposure</div>
        <div className="mt-1 text-xs text-zinc-500">
          Roughly how much were you around each, across your whole service? No exact numbers needed.
        </div>

        {MUNITION_GROUPS.map((g) => (
          <div key={g.group} className="mt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{g.group}</span>
              <span className="text-[11px] text-zinc-400">{g.metals}</span>
            </div>
            {g.items.map((it) => {
              const cur = munRates[it.key] ?? 0;
              return (
                <div key={it.key} className="flex items-center justify-between gap-3 border-t border-zinc-100 py-2 dark:border-zinc-800">
                  <span className="text-sm text-zinc-800 dark:text-zinc-200">{it.label}</span>
                  <div className="flex flex-none overflow-hidden rounded-md border border-zinc-300 text-xs dark:border-zinc-700">
                    {RATES.map((label, ri) => {
                      const on = cur === ri;
                      return (
                        <button
                          key={ri}
                          type="button"
                          onClick={() => setMunRates((p) => ({ ...p, [it.key]: ri }))}
                          className={
                            (on ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 " : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 ") +
                            (ri > 0 ? "border-l border-zinc-300 dark:border-zinc-700 " : "") +
                            "px-2.5 py-1"
                          }
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className={card}>
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Estimated burden, by metal</div>
          <span className="text-xs text-zinc-500">{confidence} confidence</span>
        </div>
        <div className="mt-3 space-y-2.5">
          {present.length === 0 && <p className="text-sm text-zinc-500">Set your role, munitions, and exposures to see your estimate.</p>}
          {present.map((m) => {
            const v = idx[m.key];
            const b = band(v);
            return (
              <div key={m.key}>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-800 dark:text-zinc-200">{m.name}</span>
                  <span style={{ color: b.text }}>{b.label}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <span className="block h-2 rounded-full" style={{ width: `${v}%`, background: b.bar }} />
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-zinc-400">Tracking {METALS.length} metals; showing the ones your profile flags.</p>
      </div>

      <div className={card}>
        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Chemical &amp; other contaminants</div>
        <div className="mt-1 text-xs text-zinc-500">
          Exposure load from what you logged. These deplete antioxidants and damage organs rather than storing like metals.
        </div>
        <div className="mt-3 space-y-2.5">
          {cPresent.length === 0 && (
            <p className="text-sm text-zinc-500">
              Log chemical, water, PFAS, radiation, pesticide, or particulate exposures on the map to see these.
            </p>
          )}
          {cPresent.map((c) => {
            const v = cload[c.key];
            const b = band(v);
            return (
              <div key={c.key}>
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-zinc-800 dark:text-zinc-200">{c.name}</span>
                  <span className="shrink-0" style={{ color: b.text }}>{b.label}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <span className="block h-2 rounded-full" style={{ width: `${v}%`, background: b.bar }} />
                </div>
              </div>
            );
          })}
        </div>
        {(cSystems.length > 0 || cDepletes.length > 0) && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Systems at risk</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {cSystems.map((o) => (
                  <span key={o} className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{o}</span>
                ))}
              </div>
            </div>
            {cDepletes.length > 0 && (
              <div>
                <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">What it depletes</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {cDepletes.map((o) => (
                    <span key={o} className="rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">{o}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className={card}>
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Where it likely stores</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {organs.length ? (
              organs.map((o) => (
                <span key={o} className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{o}</span>
              ))
            ) : (
              <span className="text-sm text-zinc-500">Nothing elevated enough to map yet.</span>
            )}
          </div>
        </div>

        <div className={card}>
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Trace minerals it displaces</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {minerals.length ? (
              minerals.map((o) => (
                <span key={o} className="rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">{o}</span>
              ))
            ) : (
              <span className="text-sm text-zinc-500">No clear depletions to flag yet.</span>
            )}
          </div>
          <p className="mt-2 text-xs text-zinc-400">The root-cause replenishment targets, under guidance.</p>
        </div>
      </div>

      <div className={card}>
        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">What to investigate next</div>
        <div className="mt-2">
          {tests.map((t) => (
            <div key={t} className="border-t border-zinc-100 py-2 text-sm text-zinc-700 first:border-t-0 dark:border-zinc-800 dark:text-zinc-300">
              {t}
            </div>
          ))}
        </div>
      </div>

      <p className="px-1 text-xs leading-relaxed text-zinc-400">
        This is an estimate, the lowest tier of evidence, meant to guide testing and a conversation with your
        clinician. It is not a diagnosis and never replaces medical care. The metal-to-mineral mapping and the
        weighting will be reviewed and calibrated by the scientific advisory board.
      </p>
    </div>
  );
}
