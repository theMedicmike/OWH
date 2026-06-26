"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { EXPOSURE_BASIS, CONDITION_BASIS } from "@/lib/citations";

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
// Exposure classes that carry a recognized presumptive pathway.
const RECOGNIZED = new Set(["burn_pit", "particulate", "pesticide", "radiation", "water_contamination", "gulf_war_agent"]);

type ExpoRow = { id: string; exposure_class: string };
type CheckRow = { place_name: string | null; date_start: string | null; exposures: ExpoRow[] | null };
type Member = { display_name: string | null; branch: string | null; service_start: string | null; service_end: string | null };

export default function ReportView() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [member, setMember] = useState<Member | null>(null);
  const [rows, setRows] = useState<CheckRow[]>([]);
  const [conditions, setConditions] = useState<{ label: string; claim_status: string }[]>([]);
  const [expoPlaces, setExpoPlaces] = useState<Record<string, string[]>>({});
  const [corroByClass, setCorroByClass] = useState<Record<string, number>>({});

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user ?? null);
      setReady(true);
      if (!data.user) return;
      const [{ data: m }, { data: c }, { data: cond }] = await Promise.all([
        supabase.from("members").select("display_name, branch, service_start, service_end").maybeSingle(),
        supabase.from("check_ins").select("place_name, date_start, exposures(id, exposure_class)").order("date_start"),
        supabase.from("conditions").select("label, claim_status").order("created_at"),
      ]);
      setMember((m as Member) ?? null);
      const checks = (c ?? []) as CheckRow[];
      setRows(checks);
      setConditions((cond ?? []) as { label: string; claim_status: string }[]);

      const map: Record<string, string[]> = {};
      const classOfExposure: Record<string, string> = {};
      const ids: string[] = [];
      for (const row of checks) {
        const place = row.place_name || "a logged location";
        for (const e of row.exposures ?? []) {
          (map[e.exposure_class] ??= []);
          if (!map[e.exposure_class].includes(place)) map[e.exposure_class].push(place);
          classOfExposure[e.id] = e.exposure_class;
          ids.push(e.id);
        }
      }
      setExpoPlaces(map);

      if (ids.length) {
        const { data: corr } = await supabase.from("corroborations").select("exposure_id").in("exposure_id", ids);
        const byClass: Record<string, number> = {};
        for (const r of (corr ?? []) as { exposure_id: string }[]) {
          const cl = classOfExposure[r.exposure_id];
          if (cl) byClass[cl] = (byClass[cl] ?? 0) + 1;
        }
        setCorroByClass(byClass);
      }
    });
  }, [supabase]);

  if (!ready) return <p className="text-sm text-muted">Loading…</p>;
  if (!user) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6">
        <p className="text-sm text-muted">Sign in to generate your claim packet.</p>
        <Link href="/" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">← Go to sign in</Link>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const years =
    member?.service_start || member?.service_end
      ? `${member?.service_start ? new Date(member.service_start).getUTCFullYear() : "?"}–${member?.service_end ? new Date(member.service_end).getUTCFullYear() : "?"}`
      : null;

  const classesPresent = Object.keys(expoPlaces);
  const presumptiveConditions = conditions.filter((c) => CONDITION_BASIS[c.label]?.presumptive).length;

  // Contentions: conditions that line up with at least one logged exposure.
  const contentions = conditions
    .map((c) => {
      const matches = (CONDITION_EXPOSURES[c.label] ?? []).filter((e) => (expoPlaces[e] ?? []).length > 0);
      return { label: c.label, matches };
    })
    .filter((c) => c.matches.length > 0);

  const sectionTitle = "mb-2 text-[13px] font-bold uppercase tracking-wide text-brand";
  const sectionWrap = "mt-6 break-inside-avoid border-t border-line pt-5 first:mt-0 first:border-0 first:pt-0";

  return (
    <div>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <span className="text-xs text-muted">A claim-support packet to bring to your VSO and clinician.</span>
        <button onClick={() => window.print()} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-600">
          Print / Save as PDF
        </button>
      </div>

      <div className="rounded-xl border border-line bg-white p-6 text-ink shadow-sm sm:p-8 print:border-0 print:p-0 print:shadow-none">
        {/* Cover */}
        <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-accent">Connecting the Dots of Service · Operation Whole Health</div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-ink">Claim Support Packet</h2>
            <p className="mt-0.5 text-sm text-muted">
              {member?.display_name || user.email}
              {member?.branch ? ` · ${member.branch}` : ""}
              {years ? ` · ${years}` : ""}
            </p>
          </div>
          <div className="text-right text-xs text-muted">Prepared<br />{today}</div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Prepared from veteran-entered data. This is a self-reported record with documented-source citations to
          assist an accredited VSO and a clinician. It is not a diagnosis or a determination of service connection.
        </p>

        {/* Plain-language summary */}
        <div className="mt-5 rounded-lg border border-brand/20 bg-brand/5 p-4">
          <div className="text-[13px] font-bold uppercase tracking-wide text-brand">What this means</div>
          <p className="mt-1.5 text-sm leading-relaxed text-ink">
            You logged service at {rows.length} location{rows.length === 1 ? "" : "s"}. Documented exposures include{" "}
            {classesPresent.length ? classesPresent.map((c) => EXPOSURE_LABEL[c] ?? c).join(", ") : "none yet"}.{" "}
            {conditions.length > 0
              ? `Of your ${conditions.length} condition${conditions.length === 1 ? "" : "s"}, ${presumptiveConditions} ${presumptiveConditions === 1 ? "carries" : "carry"} a recognized presumptive pathway.`
              : "Add your conditions to see which carry a recognized presumptive pathway."}
          </p>
          <p className="mt-2 text-sm font-medium text-ink">
            Your next step: bring this packet to an accredited VSO (DAV, VFW, American Legion), and ask a clinician to
            review the hand-off sheet on the last page.
          </p>
        </div>

        {/* 1. Service-exposure timeline */}
        <section className={sectionWrap}>
          <h3 className={sectionTitle}>1 · Service &amp; exposure timeline</h3>
          {rows.length === 0 ? (
            <p className="text-sm text-muted">No locations logged yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {rows.map((r, i) => (
                <li key={i} className="text-sm">
                  <span className="font-semibold">{r.date_start ? new Date(r.date_start).getUTCFullYear() : "—"}</span>
                  {" · "}
                  {r.place_name || "a logged location"}
                  {" — "}
                  <span className="text-muted">
                    {(r.exposures ?? []).map((e) => EXPOSURE_LABEL[e.exposure_class] ?? e.exposure_class).join(", ") || "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 2. Documented exposure basis (citations) */}
        <section className={sectionWrap}>
          <h3 className={sectionTitle}>2 · Documented basis for each exposure</h3>
          {classesPresent.length === 0 ? (
            <p className="text-sm text-muted">Log exposures on the map to populate this.</p>
          ) : (
            <ul className="space-y-2.5">
              {classesPresent.map((c) => (
                <li key={c} className="text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{EXPOSURE_LABEL[c] ?? c}</span>
                    {RECOGNIZED.has(c) && (
                      <span className="rounded bg-success-soft px-1.5 py-0.5 text-[11px] font-medium text-success">Presumptive pathway</span>
                    )}
                    <span className="text-xs text-muted">({(expoPlaces[c] ?? []).join("; ")})</span>
                  </div>
                  <div className="mt-0.5 text-xs leading-relaxed text-muted">{EXPOSURE_BASIS[c] ?? "ATSDR toxicological profile."}</div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 3. Conditions & documented links */}
        <section className={sectionWrap}>
          <h3 className={sectionTitle}>3 · Conditions &amp; their documented links</h3>
          {conditions.length === 0 ? (
            <p className="text-sm text-muted">No conditions recorded.</p>
          ) : (
            <ul className="space-y-2">
              {conditions.map((c, i) => {
                const matches = (CONDITION_EXPOSURES[c.label] ?? []).filter((e) => (expoPlaces[e] ?? []).length > 0);
                const basis = CONDITION_BASIS[c.label];
                return (
                  <li key={i} className="text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{c.label}</span>
                      {basis && (
                        <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${basis.presumptive ? "bg-success-soft text-success" : "bg-warn-soft text-warn"}`}>
                          {basis.tag}
                        </span>
                      )}
                      {c.claim_status !== "none" ? <span className="text-xs text-muted">VA claim {c.claim_status}</span> : null}
                    </div>
                    {matches.length > 0 ? (
                      <div className="mt-0.5 text-xs leading-relaxed text-muted">
                        Documented association with {matches.map((e) => EXPOSURE_LABEL[e] ?? e).join(", ")}.
                      </div>
                    ) : (
                      <div className="mt-0.5 text-xs text-muted">No logged exposure linked yet.</div>
                    )}
                    {basis && <div className="mt-0.5 text-xs leading-relaxed text-faint">{basis.cite}</div>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* 4. Corroboration / lay statements */}
        <section className={sectionWrap}>
          <h3 className={sectionTitle}>4 · Corroboration by fellow service members</h3>
          {Object.keys(corroByClass).length === 0 ? (
            <p className="text-sm text-muted">
              No corroboration yet. In Battle buddies, others who served where you did can confirm your exposures —
              each confirmation strengthens this record.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {Object.entries(corroByClass).map(([c, n]) => (
                <li key={c} className="text-sm">
                  <span className="font-medium">{n}</span> fellow service member{n === 1 ? "" : "s"} corroborate
                  {n === 1 ? "s" : ""} exposure to <span className="font-medium">{EXPOSURE_LABEL[c] ?? c}</span> at{" "}
                  {(expoPlaces[c] ?? []).join("; ")}.
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-muted">Lay statements consistent with VA Form 21-10210. Corroborators are kept anonymous unless they consent to be named.</p>
        </section>

        {/* 5. Clinician hand-off sheet */}
        <section className="mt-6 break-before-page break-inside-avoid border-t border-line pt-5">
          <h3 className={sectionTitle}>5 · For the reviewing clinician</h3>
          <p className="text-sm leading-relaxed text-ink">
            The veteran requests your medical opinion on whether the following condition(s) are <strong>at least as
            likely as not</strong> (50% or greater probability) connected to the documented service exposures below. A
            signed nexus statement, or a completed Disability Benefits Questionnaire (DBQ), supports this claim.
          </p>
          {contentions.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Add conditions and exposures to generate the contentions list.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {contentions.map((c) => {
                const basis = CONDITION_BASIS[c.label];
                return (
                  <li key={c.label} className="text-sm">
                    <span className="font-semibold">{c.label}</span>
                    <span className="text-muted">
                      {" "}— claimed as connected to {c.matches.map((e) => EXPOSURE_LABEL[e] ?? e).join(", ")}
                    </span>
                    {basis && <div className="mt-0.5 text-xs text-faint">{basis.cite}</div>}
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-5 grid grid-cols-2 gap-6 text-sm">
            <div>
              <div className="border-b border-ink pb-6" />
              <div className="mt-1 text-xs text-muted">Clinician signature</div>
            </div>
            <div>
              <div className="border-b border-ink pb-6" />
              <div className="mt-1 text-xs text-muted">Date · License #</div>
            </div>
          </div>
        </section>

        {/* 6. Attachments */}
        <section className={sectionWrap}>
          <h3 className={sectionTitle}>6 · Attachments</h3>
          <p className="text-sm text-muted">
            Attach your DD-214 and any uploaded service or medical records (stored under Account) when you submit this
            packet to your VSO.
          </p>
        </section>

        <p className="mt-6 border-t border-line pt-4 text-xs leading-relaxed text-faint">
          This packet assembles veteran-entered facts with documented sources. It states associations and presumptive
          pathways; it does not assert medical causation, which requires a licensed clinician&apos;s opinion. Citations
          are general and depend on your specific dates and locations — confirm with your VSO. Sources: PACT Act of
          2022, 38 CFR Part 3, Camp Lejeune Justice Act, and ATSDR toxicological profiles (VA.gov, June 2026). Veterans
          Crisis Line: dial 988, then press 1.
        </p>
      </div>
    </div>
  );
}
