"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

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
const RECOGNIZED = new Set(["burn_pit", "pesticide", "radiation", "water_contamination"]);

type CheckRow = { place_name: string | null; date_start: string | null; exposures: { exposure_class: string }[] | null };
type Member = { display_name: string | null; branch: string | null; service_start: string | null; service_end: string | null };

export default function ReportView() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [member, setMember] = useState<Member | null>(null);
  const [rows, setRows] = useState<CheckRow[]>([]);
  const [conditions, setConditions] = useState<{ label: string; claim_status: string }[]>([]);
  const [expoPlaces, setExpoPlaces] = useState<Record<string, string[]>>({});

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user ?? null);
      setReady(true);
      if (!data.user) return;
      const [{ data: m }, { data: c }, { data: cond }] = await Promise.all([
        supabase.from("members").select("display_name, branch, service_start, service_end").maybeSingle(),
        supabase.from("check_ins").select("place_name, date_start, exposures(exposure_class)").order("date_start"),
        supabase.from("conditions").select("label, claim_status").order("created_at"),
      ]);
      setMember((m as Member) ?? null);
      const checks = (c ?? []) as CheckRow[];
      setRows(checks);
      setConditions((cond ?? []) as { label: string; claim_status: string }[]);
      const map: Record<string, string[]> = {};
      for (const row of checks) {
        const place = row.place_name || "a logged location";
        for (const e of row.exposures ?? []) {
          (map[e.exposure_class] ??= []);
          if (!map[e.exposure_class].includes(place)) map[e.exposure_class].push(place);
        }
      }
      setExpoPlaces(map);
    });
  }, [supabase]);

  if (!ready) return <p className="text-sm text-zinc-500">Loading…</p>;
  if (!user) {
    return (
      <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">Sign in on the map to generate your report.</p>
        <Link href="/" className="mt-3 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400">← Go to the map</Link>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const years =
    member?.service_start || member?.service_end
      ? `${member?.service_start ? new Date(member.service_start).getUTCFullYear() : "?"}–${member?.service_end ? new Date(member.service_end).getUTCFullYear() : "?"}`
      : null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <span className="text-xs text-zinc-500">A one-page summary to bring to your clinician or VSO.</span>
        <button onClick={() => window.print()} className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white hover:opacity-90 dark:bg-white dark:text-zinc-900">
          Print / Save as PDF
        </button>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 print:border-0 print:p-0">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Service exposure summary</h2>
        <p className="mt-0.5 text-sm text-zinc-500">
          {member?.display_name || user.email}
          {member?.branch ? ` · ${member.branch}` : ""}
          {years ? ` · ${years}` : ""} · prepared {today}
        </p>

        <section className="mt-5">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Where served &amp; exposures</h3>
          {rows.length === 0 ? (
            <p className="mt-1 text-sm text-zinc-500">No locations logged yet.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {rows.map((r, i) => (
                <li key={i} className="text-sm">
                  <span className="font-medium">{r.date_start ? new Date(r.date_start).getUTCFullYear() : "—"}</span>
                  {" · "}
                  {r.place_name || "a logged location"}
                  {" — "}
                  <span className="text-zinc-500">
                    {(r.exposures ?? []).map((e) => EXPOSURE_LABEL[e.exposure_class] ?? e.exposure_class).join(", ") || "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-5">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Health conditions</h3>
          {conditions.length === 0 ? (
            <p className="mt-1 text-sm text-zinc-500">None recorded.</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {conditions.map((c, i) => (
                <li key={i} className="text-sm">
                  {c.label}
                  {c.claim_status !== "none" ? <span className="text-zinc-500"> — VA claim {c.claim_status}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-5">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Exposure–condition connections</h3>
          <ul className="mt-2 space-y-1.5">
            {conditions.flatMap((c) => {
              const matches = (CONDITION_EXPOSURES[c.label] ?? []).filter((e) => (expoPlaces[e] ?? []).length > 0);
              if (matches.length === 0) return [];
              return [
                <li key={c.label} className="text-sm">
                  <span className="font-medium">{c.label}</span> may be associated with{" "}
                  {matches
                    .map((e) => `${EXPOSURE_LABEL[e] ?? e} (${(expoPlaces[e] ?? []).join("; ")})${RECOGNIZED.has(e) ? " — PACT Act presumptive category" : ""}`)
                    .join("; ")}
                </li>,
              ];
            })}
            {conditions.every((c) => (CONDITION_EXPOSURES[c.label] ?? []).filter((e) => (expoPlaces[e] ?? []).length > 0).length === 0) && (
              <li className="text-sm text-zinc-500">No connections yet — add conditions and log exposures to populate this.</li>
            )}
          </ul>
        </section>

        <section className="mt-5">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Suggested next steps</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li>Discuss targeted exposure testing with a clinician (standard panels may read normal despite stored burden).</li>
            <li>Review PACT Act presumptive eligibility with an accredited VSO.</li>
            <li>Consider the exposure burden estimate in this app to guide which tests to request.</li>
          </ul>
        </section>

        <p className="mt-5 text-xs leading-relaxed text-zinc-400">
          This summary is a self-reported record with associations to investigate. It is not a diagnosis or a
          determination of service connection. Associations and PACT Act flags are general and depend on specific
          dates and locations. Veterans Crisis Line: dial 988, then press 1.
        </p>
      </div>
    </div>
  );
}
