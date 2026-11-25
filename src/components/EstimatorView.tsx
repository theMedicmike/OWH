"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { METAL_KEY_TO_SLUG, CONTAMINANT_KEY_TO_SLUG, ORGAN_NAME_TO_SLUG, TOXICANT_BY_SLUG } from "@/lib/toxlibrary";
import { EXPOSURE_LABEL } from "@/lib/education";
import WheelPicker from "./WheelPicker";

// A duration (0-50 years), not a calendar date, so this gets the same wheel
// mechanism as the map's date pickers but only one wheel, not month+year —
// "how many years" has no month to pick.
const YEARS_OF_SERVICE = Array.from({ length: 51 }, (_, i) => String(i));

// Every service-relevant heavy metal / metalloid and the organs it targets.
//
// ⚠️ The weightings below are HEURISTIC and have never been validated. An earlier
// version of this file said they would be "reviewed and calibrated by the
// scientific advisory board." No such board exists, and no one can perform that
// validation: intake cannot be reconstructed from a questionnaire to better than
// about two orders of magnitude, so no calibration target exists to calibrate
// against. Do not reinstate that claim. See the dated correction in the footer.
const METALS: { key: string; name: string; organs: string[] }[] = [
  { key: "pb", name: "Lead", organs: ["bone", "brain", "kidney"] },
  { key: "cd", name: "Cadmium", organs: ["kidney", "lungs", "bone"] },
  { key: "hg", name: "Mercury", organs: ["brain", "kidney", "nervous system"] },
  { key: "as", name: "Arsenic", organs: ["skin", "liver", "peripheral nerves"] },
  { key: "u", name: "Depleted uranium", organs: ["kidney", "bone"] },
  { key: "w", name: "Tungsten", organs: ["fragment sites", "bone"] },
  { key: "co", name: "Cobalt", organs: ["heart", "thyroid", "lungs"] },
  { key: "cr", name: "Chromium (VI)", organs: ["lungs", "sinuses", "kidney"] },
  { key: "mn", name: "Manganese", organs: ["brain (basal ganglia)", "liver"] },
  { key: "ni", name: "Nickel", organs: ["lungs", "skin", "sinuses"] },
  { key: "sb", name: "Antimony", organs: ["lungs", "heart"] },
  { key: "be", name: "Beryllium", organs: ["lungs"] },
  { key: "v", name: "Vanadium", organs: ["lungs", "kidney"] },
  { key: "tl", name: "Thallium", organs: ["nerves", "kidney"] },
  { key: "ba", name: "Barium", organs: ["heart", "bone", "muscle"] },
];

type Contribution = Record<string, number>;

// Heuristic occupational-exposure patterns, one row per role. Expanded
// 2026-08-09 (Michael: "there needs to be a lot more options... a lot of
// other roles in military") — the original 8 skewed heavily toward Army
// ground combat and left out most of the Navy, Air Force, and support/trades
// roles a real veteran population actually served in. Every new row maps
// ONLY to metals already in METALS above — no new metal, no new organ, and
// nothing touching hormones/endocrine, same discipline as the original list.
const ROLES: Record<string, Contribution> = {
  "Infantry / small arms": { pb: 20, sb: 6 },
  "Tank crew / armor": { u: 30, w: 20, pb: 15, co: 8 },
  "Artillery / mortars": { pb: 25, as: 8, ba: 6 },
  "Combat engineer / demolition": { pb: 15, as: 8, ba: 10 },
  "Military police / security forces": { pb: 12, sb: 3 },
  "Range cadre / weapons instructor": { pb: 45, sb: 10 },
  "EOD / ordnance disposal": { pb: 20, as: 18, cd: 10, ba: 8 },
  "Munitions / ammunition handling": { pb: 15, as: 10, ba: 6 },
  "Mechanic / motor pool": { mn: 18, cr: 12, ni: 10, co: 8, cd: 12, pb: 10 },
  "Welder / machinist": { mn: 22, cr: 15, ni: 12, co: 6 },
  "Painter / abrasive blaster (shipboard)": { pb: 30, cd: 5 },
  "Aviation door gunner": { pb: 25, v: 6, ni: 4 },
  "Aircrew (fixed or rotary wing)": { pb: 10, v: 5, ni: 4 },
  "Aviation maintenance / flight line": { pb: 8, cd: 6, v: 6 },
  "Shipboard engineering / boiler & fireroom": { pb: 10, mn: 10, cr: 8, ni: 6 },
  "Submarine service": { pb: 10, cd: 5 },
  "Fuel handling / POL": { pb: 6, v: 4 },
  "Firefighter (crash/structural)": { pb: 4 },
  "Combat medic / corpsman": { pb: 5 },
  "Communications / IT / cyber": { pb: 2 },
  "Logistics / supply": { pb: 3 },
  "Culinary / food service": { pb: 2 },
  "Admin / intelligence / other support": { pb: 3 },
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
  gulf_war_agent: { as: 5 },
};

type Munition = { key: string; label: string; m: Contribution };
const MUNITION_GROUPS: { group: string; metals: string; items: Munition[] }[] = [
  {
    group: "Small arms",
    metals: "lead, antimony, copper",
    items: [
      { key: "m556", label: "5.56mm rifle", m: { pb: 18, sb: 4 } },
      { key: "m762", label: "7.62mm", m: { pb: 18, sb: 4 } },
      { key: "m9", label: "9mm pistol", m: { pb: 12, sb: 3 } },
      { key: "m50", label: ".50 cal (M2)", m: { pb: 22, sb: 5 } },
    ],
  },
  {
    group: "Cannon & crew-served",
    metals: "lead, tungsten",
    items: [
      { key: "c2530", label: "25 / 30mm cannon", m: { pb: 15, w: 6 } },
      { key: "g40", label: "40mm grenade", m: { pb: 12, as: 4 } },
    ],
  },
  {
    group: "Tank & artillery",
    metals: "tungsten, cobalt, lead, blast",
    items: [
      { key: "t120", label: "120mm tank main gun", m: { w: 25, u: 15, pb: 12, co: 6 } },
      { key: "a155", label: "155mm howitzer / mortars", m: { pb: 15, as: 6, ba: 5 } },
    ],
  },
  {
    group: "Ordnance & bombs",
    metals: "heavy metals, barium, blast",
    items: [
      { key: "demo", label: "Grenades / demolitions", m: { pb: 10, as: 8, ba: 6 } },
      { key: "b500", label: "500 lb bombs", m: { pb: 8, as: 6 } },
      { key: "b2000", label: "1,000–2,000 lb bombs", m: { pb: 10, as: 8 } },
    ],
  },
  {
    group: "Armor-piercing",
    metals: "depleted uranium, tungsten",
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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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

  if (!ready) return <p className="text-[0.9375rem] text-muted">Loading…</p>;

  if (!user) {
    return (
      <div className="card p-6">
        <p className="text-[0.9375rem] text-muted">
          Sign in on the map to build your record, then come back here for your estimate.
        </p>
        <Link href="/" className="btn btn-primary mt-4">
          Go to the map
        </Link>
      </div>
    );
  }

  const card = "card p-5";
  const h2 = "text-lg font-semibold tracking-tight text-ink";
  const lede = "mt-1 text-[0.9375rem] leading-relaxed text-muted";

  return (
    <div className="space-y-4">
      <div className="card card-raise p-5">
        <h2 className={h2}>Private, for you and your clinician</h2>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink">
          A standard blood test mostly shows <strong>recent</strong> exposure — last week, not your career.
          Many service toxicants <strong>bioaccumulate</strong>: lead settles into bone for decades and can
          remobilize years later; others lodge in organs. So a &ldquo;normal&rdquo; result doesn&apos;t rule
          out a lifetime of stored exposure.
        </p>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink">
          This tool <strong>translates what you were exposed to</strong> into where those toxicants tend to
          accumulate and the tests that can reveal them. It does <strong>not</strong> measure what is in your
          body, and it is <strong>not</strong> part of your VA claim — keep it private and don&apos;t submit
          it as evidence.
        </p>
      </div>

      <div className={card}>
        <h2 className={h2}>Your service profile</h2>
        <p className={lede}>
          {logged.length > 0
            ? "Built from the exposures you logged on the map, plus the details below."
            : "Log exposures on the map and they'll feed this automatically. Add the details below too."}
        </p>

        {logged.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Exposures you logged">
            {logged.map((e) => (
              <li key={e} className="rounded-full border border-line bg-canvas px-3 py-1.5 text-sm text-ink">
                {EXPOSURE_LABEL[e] ?? e}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_9rem]">
          <div>
            <label htmlFor="est-role" className="field-label">Primary role</label>
            <select id="est-role" value={role} onChange={(e) => setRole(e.target.value)} className="field">
              <option value="">Choose your role</option>
              {Object.keys(ROLES).map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <span className="field-label">Years of service</span>
            <WheelPicker options={YEARS_OF_SERVICE} index={years} onChange={setYears} ariaLabel="Years of service" />
          </div>
        </div>
      </div>

      <div className={card}>
        <h2 className={h2}>Weapons and munitions exposure</h2>
        <p className={lede}>
          Roughly how much were you around each, across your whole service? No exact numbers needed.
        </p>

        {MUNITION_GROUPS.map((g) => (
          <div key={g.group} className="mt-5">
            <div className="text-[0.9375rem] font-semibold text-ink">{g.group}</div>
            <div className="text-sm text-muted">Mostly {g.metals}</div>
            {g.items.map((it) => {
              const cur = munRates[it.key] ?? 0;
              return (
                <fieldset key={it.key} className="mt-3 border-t border-line pt-3">
                  <legend className="sr-only">{it.label}</legend>
                  <div aria-hidden="true" className="text-[0.9375rem] text-ink">{it.label}</div>
                  <div className="mt-2 grid grid-cols-4 gap-1.5">
                    {RATES.map((label, ri) => {
                      const on = cur === ri;
                      return (
                        <button
                          key={ri}
                          type="button"
                          aria-pressed={on}
                          onClick={() => setMunRates((p) => ({ ...p, [it.key]: ri }))}
                          className={`btn min-h-11 px-1 ${on ? "btn-primary" : "btn-secondary"}`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              );
            })}
          </div>
        ))}
      </div>

      <div className={card}>
        <h2 className={h2}>Estimated exposure likelihood: metals</h2>
        <p className="mt-1 text-sm text-muted">Confidence: {confidence}</p>
        <p className={lede}>How likely your service led to meaningful exposure to each metal. Not a measurement of what&apos;s in your body now.</p>
        <div className="mt-4 space-y-4">
          {present.length === 0 && <p className="text-[0.9375rem] text-muted">Set your role, munitions, and exposures to see your estimate.</p>}
          {present.map((m) => {
            const v = idx[m.key];
            const b = band(v);
            const slug = METAL_KEY_TO_SLUG[m.key];
            const tox = slug ? TOXICANT_BY_SLUG[slug] : undefined;
            const open = expanded.has(m.key);
            return (
              <div key={m.key}>
                <div className="flex items-center justify-between gap-3 text-[0.9375rem]">
                  {slug ? (
                    <Link href={`/learn/${slug}`} className="inline-flex min-h-11 items-center font-semibold text-brand hover:underline">{m.name}</Link>
                  ) : (
                    <span className="text-ink">{m.name}</span>
                  )}
                  <span className="font-semibold text-ink">{b.label}</span>
                </div>
                <div className="mt-1 h-2.5 rounded-full bg-canvas">
                  <span className="block h-2.5 rounded-full" style={{ width: `${v}%`, background: b.bar }} />
                </div>
                {tox && (
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setExpanded((prev) => { const n = new Set(prev); if (n.has(m.key)) n.delete(m.key); else n.add(m.key); return n; })}
                    className="btn btn-ghost mt-1 -ml-2"
                  >
                    {open ? "Hide why this is flagged" : "Why is this flagged?"}
                  </button>
                )}
                {tox && open && (
                  <div className="mt-1 space-y-2 rounded-xl bg-canvas p-4 text-[0.9375rem] leading-relaxed text-muted">
                    <p><span className="font-semibold text-ink">Why it&apos;s flagged:</span> {tox.where}</p>
                    <p><span className="font-semibold text-ink">How sure is this:</span> Not sure at the level of an individual — this reflects documented sources for your role, not a measurement of what&apos;s actually in your body. There is no model that turns a service history into a body-burden number.</p>
                    <p><span className="font-semibold text-ink">What a real test involves:</span> {tox.tests[0]}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-sm text-muted">Tracking {METALS.length} metals; showing the ones your profile flags.</p>
        <Link href="/learn" className="btn btn-secondary mt-3">Open the full exposure library</Link>
      </div>

      <div className={card}>
        <h2 className={h2}>Chemical and other contaminants</h2>
        <p className={lede}>
          Exposure load from what you logged. Unlike metals, these don&apos;t build up in tissue — they act on organs and the body&apos;s defenses.
        </p>
        <div className="mt-4 space-y-4">
          {cPresent.length === 0 && (
            <p className="text-[0.9375rem] text-muted">
              Log chemical, water, PFAS, radiation, pesticide, or particulate exposures on the map to see these.
            </p>
          )}
          {cPresent.map((c) => {
            const v = cload[c.key];
            const b = band(v);
            return (
              <div key={c.key}>
                <div className="flex items-center justify-between gap-3 text-[0.9375rem]">
                  {CONTAMINANT_KEY_TO_SLUG[c.key] ? (
                    <Link href={`/learn/${CONTAMINANT_KEY_TO_SLUG[c.key]}`} className="inline-flex min-h-11 items-center font-semibold text-brand hover:underline">{c.name}</Link>
                  ) : (
                    <span className="text-ink">{c.name}</span>
                  )}
                  <span className="shrink-0 font-semibold text-ink">{b.label}</span>
                </div>
                <div className="mt-1 h-2.5 rounded-full bg-canvas">
                  <span className="block h-2.5 rounded-full" style={{ width: `${v}%`, background: b.bar }} />
                </div>
              </div>
            );
          })}
        </div>
        {(cSystems.length > 0 || cDepletes.length > 0) && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-[0.9375rem] font-semibold text-ink">Systems at risk</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {cSystems.map((o) => (
                  <span key={o} className="rounded-lg bg-canvas px-3 py-1.5 text-sm text-ink">{o}</span>
                ))}
              </div>
            </div>
            {cDepletes.length > 0 && (
              <div>
                <h3 className="text-[0.9375rem] font-semibold text-ink">Defenses these can affect</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {cDepletes.map((o) => (
                    <span key={o} className="rounded-lg bg-success-soft px-3 py-1.5 text-sm text-success">{o}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 🔴 A second card here listed "Minerals these metals can displace". It was
          DELETED on 2026-08-06, not relocated: there is no validated model from an
          exposure history to a nutrient deficit in a person, so it asserted a
          calculation that does not exist — and a depletion list one tap from a
          burden estimate is the click path that makes intent irrelevant on a
          surface whose whole job is documentation. */}
      <div className={card}>
        <h2 className={h2}>Where these metals tend to accumulate</h2>
        <p className={lede}>Documented biology: where each flagged metal is known to settle if exposure occurred.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {organs.length ? (
            organs.map((o) => {
              const s = ORGAN_NAME_TO_SLUG[o];
              return s ? (
                <Link key={o} href={`/learn/organ/${s}`} className="btn btn-secondary min-h-11 rounded-full px-4">{o}</Link>
              ) : (
                <span key={o} className="inline-flex min-h-11 items-center rounded-full bg-canvas px-4 text-[0.9375rem] text-ink">{o}</span>
              );
            })
          ) : (
            <span className="text-[0.9375rem] text-muted">Nothing elevated enough to map yet.</span>
          )}
        </div>
      </div>

      <div className={card}>
        <h2 className={h2}>What to investigate next</h2>
        <ul className="mt-2">
          {tests.map((t) => (
            <li key={t} className="border-t border-line py-3 text-[0.9375rem] text-ink first:border-t-0">
              {t}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border-2 border-brand bg-brand/5 px-5 py-4">
        <h2 className={h2}>A note on testing: stay safe</h2>
        <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink">
          Ask your clinician for <strong>standard, unprovoked</strong> tests (for example, a 24-hour urine
          collected <em>without</em> a chelating agent). <strong>Avoid &ldquo;provoked&rdquo; or
          &ldquo;chelation-challenge&rdquo; urine tests, and any unsupervised chelation or &ldquo;detox&rdquo;
          protocol</strong> — they aren&apos;t validated, can mislead, and can be dangerous. Real treatment, if
          any, is decided and supervised by a qualified clinician.
        </p>
      </div>

      <p className="border-t border-line px-1 pt-4 text-sm leading-relaxed text-muted">
        This is an exposure-history estimate — the lowest tier of evidence — meant to guide testing and a
        conversation with your clinician. It does not measure what is in your body, is not a diagnosis, never
        replaces medical care, and is not part of your VA claim. The exposure-to-toxicant mapping and weighting
        are heuristic and unvalidated. If anything feels heavy, the Veterans Crisis Line is one tap away:
        dial 988, then press 1.
      </p>

      <p className="rounded-xl border border-line bg-canvas px-4 py-3 text-sm leading-relaxed text-muted">
        <span className="font-semibold text-ink">Corrected 6 August 2026.</span> An earlier version of this page
        said the mapping and weightings &ldquo;will be reviewed and calibrated by the scientific advisory
        board.&rdquo; No such board exists, and that validation cannot currently be performed by anyone — there
        is no way to reconstruct how much of a substance a person absorbed from a description of their service,
        so there is nothing to calibrate these numbers against. The sentence has been removed. We would rather
        tell you we got that wrong than quietly delete it.
      </p>
    </div>
  );
}
