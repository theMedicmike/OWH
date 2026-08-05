"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { ServiceRibbon } from "./Patriotic";
import { METAL_KEY_TO_SLUG, CONTAMINANT_KEY_TO_SLUG, ORGAN_NAME_TO_SLUG } from "@/lib/toxlibrary";
import { EXPOSURE_LABEL } from "@/lib/education";

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
  // No pre-built profile: a cook must never open this page to a depleted-
  // uranium estimate. The numbers only exist once they're built from YOUR role.
  const [role, setRole] = useState("");
  const [years, setYears] = useState(10);
  const [munRates, setMunRates] = useState<Record<string, number>>({});

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user ?? null);
      setReady(true);
      if (data.user) {
        const { data: rows } = await supabase.from("exposures").select("exposure_class");
        if (rows) setLogged(uniq((rows as { exposure_class: string }[]).map((r) => r.exposure_class)));
        // Seed years-of-service from the record instead of a guess.
        const { data: m } = await supabase.from("members").select("service_start, service_end").eq("auth_id", data.user.id).maybeSingle();
        if (m?.service_start) {
          const start = new Date(m.service_start).getUTCFullYear();
          const end = m.service_end ? new Date(m.service_end).getUTCFullYear() : new Date().getUTCFullYear();
          if (end >= start) setYears(Math.max(1, Math.min(40, end - start)));
        }
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

  if (!ready) return <p className="text-sm text-muted">Loading…</p>;

  if (!user) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6">
        <p className="text-sm text-muted">
          Sign in on the map to build your record, then come back here for your estimate.
        </p>
        <Link href="/" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">
          ← Go to the map
        </Link>
      </div>
    );
  }

  const card = "rounded-xl border border-line bg-surface p-5";

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-accent/30 bg-accent/5">
        <ServiceRibbon />
        <div className="p-5">
          <div className="text-xs font-bold uppercase tracking-wide text-accent">Private — for you and your clinician</div>
          <p className="mt-1.5 text-sm leading-relaxed text-ink">
            A standard blood test mostly shows <strong>recent</strong> exposure — last week, not your career.
            Many service toxicants <strong>bioaccumulate</strong>: lead settles into bone for decades and can
            remobilize years later; others lodge in organs. So a &ldquo;normal&rdquo; result doesn&apos;t rule
            out a lifetime of stored exposure.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            This tool <strong>translates what you were exposed to</strong> into where those toxicants tend to
            accumulate and the tests that can reveal them. It does <strong>not</strong> measure what is in your
            body, and it is <strong>not</strong> part of your VA claim — keep it private and don&apos;t submit
            it as evidence.
          </p>
        </div>
      </div>

      <div className={card}>
        <div className="text-sm font-medium text-ink">Your service profile</div>
        <div className="mt-1 text-xs text-muted">
          {logged.length > 0
            ? "Built from the exposures you logged on the map, plus the details below."
            : "Log exposures on the map and they'll feed this automatically. Add the details below too."}
        </div>

        {logged.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {logged.map((e) => (
              <span key={e} className="rounded-full border border-line bg-canvas px-2.5 py-1 text-xs text-muted">
                {EXPOSURE_LABEL[e] ?? e}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 grid gap-3">
          <div className="flex items-center gap-3">
            <label className="w-28 text-xs text-muted">Primary role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="flex-1 rounded-md border border-line bg-transparent px-2 py-1.5 text-sm">
              <option value="">Select your role…</option>
              {Object.keys(ROLES).map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="w-28 text-xs text-muted">Years of service</label>
            <input type="range" min={0} max={50} step={1} value={years} onChange={(e) => setYears(+e.target.value)} className="flex-1" />
            <span className="w-14 text-right text-sm font-medium">{years}</span>
          </div>
        </div>
      </div>

      <div className={card}>
        <div className="text-sm font-medium text-ink">Weapons &amp; munitions exposure</div>
        <div className="mt-1 text-xs text-muted">
          Roughly how much were you around each, across your whole service? No exact numbers needed.
        </div>

        {MUNITION_GROUPS.map((g) => (
          <div key={g.group} className="mt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink">{g.group}</span>
              <span className="text-[11px] text-faint">{g.metals}</span>
            </div>
            {g.items.map((it) => {
              const cur = munRates[it.key] ?? 0;
              return (
                <div key={it.key} className="flex items-center justify-between gap-3 border-t border-line py-2">
                  <span className="text-sm text-ink">{it.label}</span>
                  <div className="flex flex-none overflow-hidden rounded-md border border-line text-xs">
                    {RATES.map((label, ri) => {
                      const on = cur === ri;
                      return (
                        <button
                          key={ri}
                          type="button"
                          onClick={() => setMunRates((p) => ({ ...p, [it.key]: ri }))}
                          className={
                            (on ? "bg-brand/10 text-brand " : "text-muted hover:bg-canvas ") +
                            (ri > 0 ? "border-l border-line " : "") +
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
          <div className="text-sm font-semibold text-ink">Estimated exposure likelihood — metals</div>
          <span className="text-xs text-muted">{confidence} confidence</span>
        </div>
        <p className="mt-1 text-xs text-muted">How likely your service led to meaningful exposure to each metal — not a measurement of what&apos;s in your body now.</p>
        <div className="mt-3 space-y-2.5">
          {present.length === 0 && <p className="text-sm text-muted">Set your role, munitions, and exposures to see your estimate.</p>}
          {present.map((m) => {
            const v = idx[m.key];
            const b = band(v);
            return (
              <div key={m.key}>
                <div className="flex justify-between text-sm">
                  {METAL_KEY_TO_SLUG[m.key] ? (
                    <Link href={`/learn/${METAL_KEY_TO_SLUG[m.key]}`} className="font-medium text-brand hover:underline">{m.name} →</Link>
                  ) : (
                    <span className="text-ink">{m.name}</span>
                  )}
                  <span style={{ color: b.text }}>{b.label}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-canvas">
                  <span className="block h-2 rounded-full" style={{ width: `${v}%`, background: b.bar }} />
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-faint">Tracking {METALS.length} metals; showing the ones your profile flags. <Link href="/learn" className="font-medium text-brand hover:underline">Open the full exposure library →</Link></p>
      </div>

      <div className={card}>
        <div className="text-sm font-medium text-ink">Chemical &amp; other contaminants</div>
        <div className="mt-1 text-xs text-muted">
          Exposure load from what you logged. Unlike metals, these don&apos;t build up in tissue — they act on organs and the body&apos;s defenses.
        </div>
        <div className="mt-3 space-y-2.5">
          {cPresent.length === 0 && (
            <p className="text-sm text-muted">
              Log chemical, water, PFAS, radiation, pesticide, or particulate exposures on the map to see these.
            </p>
          )}
          {cPresent.map((c) => {
            const v = cload[c.key];
            const b = band(v);
            return (
              <div key={c.key}>
                <div className="flex justify-between gap-3 text-sm">
                  {CONTAMINANT_KEY_TO_SLUG[c.key] ? (
                    <Link href={`/learn/${CONTAMINANT_KEY_TO_SLUG[c.key]}`} className="font-medium text-brand hover:underline">{c.name} →</Link>
                  ) : (
                    <span className="text-ink">{c.name}</span>
                  )}
                  <span className="shrink-0" style={{ color: b.text }}>{b.label}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-canvas">
                  <span className="block h-2 rounded-full" style={{ width: `${v}%`, background: b.bar }} />
                </div>
              </div>
            );
          })}
        </div>
        {(cSystems.length > 0 || cDepletes.length > 0) && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs font-medium text-ink">Systems at risk</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {cSystems.map((o) => (
                  <span key={o} className="rounded-md bg-canvas px-2 py-1 text-xs text-muted">{o}</span>
                ))}
              </div>
            </div>
            {cDepletes.length > 0 && (
              <div>
                <div className="text-xs font-medium text-ink">Defenses these can affect</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {cDepletes.map((o) => (
                    <span key={o} className="rounded-md bg-success-soft px-2 py-1 text-xs text-success">{o}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className={card}>
          <div className="text-sm font-semibold text-ink">Where these metals tend to accumulate</div>
          <p className="mt-1 text-xs text-muted">Documented biology — where each flagged metal is known to settle if exposure occurred.</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {organs.length ? (
              organs.map((o) => {
                const s = ORGAN_NAME_TO_SLUG[o];
                return s ? (
                  <Link key={o} href={`/learn/organ/${s}`} className="rounded-md bg-brand/5 px-2 py-1 text-xs font-medium text-brand hover:bg-brand/10">{o} →</Link>
                ) : (
                  <span key={o} className="rounded-md bg-canvas px-2 py-1 text-xs text-muted">{o}</span>
                );
              })
            ) : (
              <span className="text-sm text-muted">Nothing elevated enough to map yet.</span>
            )}
          </div>
        </div>

        <div className={card}>
          <div className="text-sm font-medium text-ink">Minerals these metals can displace</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {minerals.length ? (
              // Plain spans: the nutrient deep-dives were removed from this
              // documentation app, so linking here would 404.
              minerals.map((o) => (
                <span key={o} className="rounded-md bg-success-soft px-2 py-1 text-xs text-success">{o}</span>
              ))
            ) : (
              <span className="text-sm text-muted">No clear depletions to flag yet.</span>
            )}
          </div>
          <p className="mt-2 text-xs text-faint">Nutrients the metals above are known to interfere with — worth reviewing with your clinician.</p>
        </div>
      </div>

      <div className={card}>
        <div className="text-sm font-medium text-ink">What to investigate next</div>
        <div className="mt-2">
          {tests.map((t) => (
            <div key={t} className="border-t border-line py-2 text-sm text-ink first:border-t-0">
              {t}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border-2 border-brand bg-brand/5 px-5 py-4">
        <div className="font-semibold text-brand">A note on testing — stay safe</div>
        <p className="mt-1 text-sm leading-relaxed text-ink">
          Ask your clinician for <strong>standard, unprovoked</strong> tests (for example, a 24-hour urine
          collected <em>without</em> a chelating agent). <strong>Avoid &ldquo;provoked&rdquo; or
          &ldquo;chelation-challenge&rdquo; urine tests, and any unsupervised chelation or &ldquo;detox&rdquo;
          protocol</strong> — they aren&apos;t validated, can mislead, and can be dangerous. Real treatment, if
          any, is decided and supervised by a qualified clinician.
        </p>
      </div>

      <p className="border-t border-line px-1 pt-4 text-xs leading-relaxed text-faint">
        This is an exposure-history estimate — the lowest tier of evidence — meant to guide testing and a
        conversation with your clinician. It does not measure what is in your body, is not a diagnosis, never
        replaces medical care, and is not part of your VA claim. The exposure-to-toxicant mapping and weighting
        are heuristic and will be reviewed and calibrated by the scientific advisory board. If anything feels
        heavy, the Veterans Crisis Line is one tap away: dial 988, then press 1.
      </p>
    </div>
  );
}
