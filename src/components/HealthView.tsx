"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

const CONDITIONS = [
  "Chronic rhinitis / sinusitis",
  "Asthma / reactive airway",
  "COPD / chronic bronchitis",
  "Constrictive bronchiolitis",
  "Respiratory or lung cancer",
  "Other cancer",
  "Thyroid disorder",
  "Kidney disease",
  "Hypertension",
  "Neurological / cognitive (TBI)",
  "Peripheral neuropathy",
  "Gut / GI disorder",
  "Autoimmune disorder",
  "Hormonal / reproductive",
  "PTSD / mental health",
];

const CONDITION_EXPOSURES: Record<string, string[]> = {
  "Chronic rhinitis / sinusitis": ["burn_pit", "particulate", "chemical_solvent"],
  "Asthma / reactive airway": ["burn_pit", "particulate", "chemical_solvent", "pfas_afff"],
  "COPD / chronic bronchitis": ["burn_pit", "particulate"],
  "Constrictive bronchiolitis": ["burn_pit", "particulate"],
  "Respiratory or lung cancer": ["burn_pit", "radiation", "chemical_solvent", "particulate"],
  "Other cancer": ["burn_pit", "radiation", "pesticide", "chemical_solvent", "heavy_metal", "pfas_afff"],
  "Thyroid disorder": ["radiation", "chemical_solvent", "pesticide"],
  "Kidney disease": ["heavy_metal", "radiation", "pfas_afff", "water_contamination"],
  "Hypertension": ["heavy_metal", "chemical_solvent"],
  "Neurological / cognitive (TBI)": ["heavy_metal", "nerve_agent"],
  "Peripheral neuropathy": ["heavy_metal", "chemical_solvent", "nerve_agent", "pesticide"],
  "Gut / GI disorder": ["heavy_metal", "pesticide", "water_contamination"],
  "Autoimmune disorder": ["chemical_solvent", "pesticide", "heavy_metal"],
  "Hormonal / reproductive": ["chemical_solvent", "pesticide", "radiation", "pfas_afff"],
  "PTSD / mental health": ["nerve_agent", "gulf_war_agent"],
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

const RECOGNIZED = new Set(["burn_pit", "pesticide", "radiation", "water_contamination"]);
const CLAIMS = ["none", "filed", "granted", "denied"];

type Condition = { id: string; label: string; claim_status: string };
type CheckRow = { place_name: string | null; exposures: { exposure_class: string }[] | null };

export default function HealthView() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [expoPlaces, setExpoPlaces] = useState<Record<string, string[]>>({});
  const [newCond, setNewCond] = useState(CONDITIONS[0]);
  const [newClaim, setNewClaim] = useState("none");
  const [busy, setBusy] = useState(false);

  async function ensureMember(): Promise<string | null> {
    const { data: u } = await supabase.auth.getUser();
    const authId = u.user?.id;
    if (!authId) return null;
    const { data: existing } = await supabase.from("members").select("id").eq("auth_id", authId).maybeSingle();
    if (existing?.id) return existing.id;
    const { data: created } = await supabase.from("members").insert({ auth_id: authId }).select("id").single();
    return created?.id ?? null;
  }

  async function loadConditions() {
    const { data } = await supabase.from("conditions").select("id, label, claim_status").order("created_at");
    setConditions((data ?? []) as Condition[]);
  }

  async function loadExposures() {
    const { data } = await supabase.from("check_ins").select("place_name, exposures(exposure_class)");
    const map: Record<string, string[]> = {};
    for (const row of (data ?? []) as CheckRow[]) {
      const place = row.place_name || "a logged location";
      for (const e of row.exposures ?? []) {
        (map[e.exposure_class] ??= []);
        if (!map[e.exposure_class].includes(place)) map[e.exposure_class].push(place);
      }
    }
    setExpoPlaces(map);
  }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user ?? null);
      setReady(true);
      if (data.user) {
        await Promise.all([loadConditions(), loadExposures()]);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function addCondition() {
    setBusy(true);
    const memberId = await ensureMember();
    if (memberId) {
      await supabase.from("conditions").insert({ member_id: memberId, label: newCond, claim_status: newClaim });
      await loadConditions();
    }
    setBusy(false);
  }

  async function removeCondition(id: string) {
    await supabase.from("conditions").delete().eq("id", id);
    await loadConditions();
  }

  if (!ready) return <p className="text-sm text-zinc-500">Loading…</p>;

  if (!user) {
    return (
      <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">Sign in on the map to use your health record.</p>
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
        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Your health conditions</div>
        <div className="mt-1 text-xs text-zinc-500">What you live with now. The app will connect these to where you served.</div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select value={newCond} onChange={(e) => setNewCond(e.target.value)} className="rounded-md border border-zinc-300 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700">
            {CONDITIONS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select value={newClaim} onChange={(e) => setNewClaim(e.target.value)} className="rounded-md border border-zinc-300 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700">
            {CLAIMS.map((c) => (
              <option key={c} value={c}>VA claim: {c}</option>
            ))}
          </select>
          <button onClick={addCondition} disabled={busy} className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-zinc-900">
            Add
          </button>
        </div>

        {conditions.length > 0 && (
          <ul className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
            {conditions.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="text-zinc-800 dark:text-zinc-200">{c.label}</span>
                <div className="flex items-center gap-3">
                  {c.claim_status !== "none" && (
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      claim {c.claim_status}
                    </span>
                  )}
                  <button onClick={() => removeCondition(c.id)} className="text-xs text-zinc-400 hover:text-rose-500">
                    remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={card}>
        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Connecting the dots</div>
        <div className="mt-1 text-xs text-zinc-500">
          Where your conditions line up with the exposures you logged on the map.
        </div>

        {conditions.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">Add a condition above to see its connections.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {conditions.map((c) => {
              const assoc = CONDITION_EXPOSURES[c.label] ?? [];
              const matches = assoc.filter((e) => (expoPlaces[e] ?? []).length > 0);
              return (
                <div key={c.id} className="rounded-lg border border-zinc-100 p-3 dark:border-zinc-800">
                  <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{c.label}</div>
                  {matches.length === 0 ? (
                    <div className="mt-1 text-xs text-zinc-500">
                      No logged exposures match this yet. Map where you served to draw the connections.
                    </div>
                  ) : (
                    <ul className="mt-2 space-y-1.5">
                      {matches.map((e) => (
                        <li key={e} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                          <span className="text-zinc-400">linked to</span>
                          <span className="rounded-md bg-blue-50 px-2 py-0.5 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            {EXPOSURE_LABEL[e] ?? e}
                          </span>
                          <span className="text-zinc-400">at</span>
                          <span className="text-zinc-600 dark:text-zinc-300">{(expoPlaces[e] ?? []).join(", ")}</span>
                          {RECOGNIZED.has(e) && (
                            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                              may be PACT Act presumptive
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="px-1 text-xs leading-relaxed text-zinc-400">
        These connections are associations to investigate, not a diagnosis or a guarantee of a claim. They are meant
        to guide a conversation with your clinician and your VSO. PACT Act flags are general and depend on your
        specific dates and locations.
      </p>
    </div>
  );
}
