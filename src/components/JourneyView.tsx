"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { ServiceRibbon } from "./Patriotic";
import { EXPOSURE_LABEL, CONDITION_EXPOSURES } from "@/lib/education";
import { CONDITION_BASIS } from "@/lib/citations";

type CheckRow = { place_name: string | null; date_start: string | null; exposures: { exposure_class: string }[] | null };
type Cond = { label: string; claim_status: string };

// Each logged exposure class points to its deep-dive page in the Exposure Library.
const EXPOSURE_TO_LEARN: Record<string, string> = {
  burn_pit: "burn-pits",
  particulate: "particulate-and-silica",
  pesticide: "dioxins",
  radiation: "ionizing-radiation",
  water_contamination: "solvents-and-fuels",
  chemical_solvent: "solvents-and-fuels",
  nerve_agent: "nerve-agents",
  gulf_war_agent: "nerve-agents",
  asbestos_silica: "asbestos",
  pfas_afff: "pfas",
  heavy_metal: "lead",
};

const ROW_H = 64;

export default function JourneyView() {
  const { user, supabase } = useAuth();
  const [name, setName] = useState<string | null>(null);
  const [branch, setBranch] = useState<string | null>(null);
  const [years, setYears] = useState<string | null>(null);
  const [rows, setRows] = useState<CheckRow[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [conditions, setConditions] = useState<Cond[]>([]);
  const [corr, setCorr] = useState(0);
  const [hasRecord, setHasRecord] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [sel, setSel] = useState<{ type: "exp" | "cond"; key: string } | null>(null);
  const [condStatus, setCondStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const m = await supabase.from("members").select("display_name, branch, service_start, service_end").eq("auth_id", user.id).maybeSingle();
      setName((m.data?.display_name as string) ?? null);
      setBranch((m.data?.branch as string) ?? null);
      const ss = m.data?.service_start ? new Date(m.data.service_start as string).getUTCFullYear() : null;
      const se = m.data?.service_end ? new Date(m.data.service_end as string).getUTCFullYear() : null;
      setYears(ss || se ? `${ss ?? "?"}–${se ?? "?"}` : null);

      const [ci, ex, co, files] = await Promise.all([
        supabase.from("check_ins").select("place_name, date_start, exposures(exposure_class)").order("date_start", { ascending: true }),
        supabase.from("exposures").select("id, exposure_class"),
        supabase.from("conditions").select("label, claim_status").order("created_at"),
        supabase.storage.from("records").list(user.id),
      ]);
      setRows((ci.data ?? []) as CheckRow[]);
      const exRows = (ex.data ?? []) as { id: string; exposure_class: string }[];
      setClasses(Array.from(new Set(exRows.map((e) => e.exposure_class))));
      const condList = (co.data ?? []) as Cond[];
      setConditions(condList);
      setCondStatus(Object.fromEntries(condList.map((c) => [c.label, c.claim_status])));
      const ids = exRows.map((e) => e.id);
      if (ids.length) {
        const c = await supabase.from("corroborations").select("id", { count: "exact", head: true }).in("exposure_id", ids);
        setCorr(c.count ?? 0);
      }
      setHasRecord(((files.data ?? []).filter((f) => f.name !== ".emptyFolderPlaceholder")).length > 0);
      setLoaded(true);
    })();
  }, [user, supabase]);

  if (!loaded) return <p className="text-sm text-muted">Loading…</p>;

  // Which exposure classes appear at each of the veteran's places (for the detail panel).
  const placesFor: Record<string, string[]> = {};
  for (const r of rows) {
    const place = r.place_name || "a logged location";
    for (const e of r.exposures ?? []) {
      (placesFor[e.exposure_class] ??= []);
      if (!placesFor[e.exposure_class].includes(place)) placesFor[e.exposure_class].push(place);
    }
  }

  // Edges: a documented link exists when a condition's studied exposures include one the veteran logged.
  const edges: { e: number; c: number }[] = [];
  conditions.forEach((cond, ci) => {
    (CONDITION_EXPOSURES[cond.label] ?? []).forEach((ec) => {
      const ei = classes.indexOf(ec);
      if (ei >= 0) edges.push({ e: ei, c: ci });
    });
  });
  const connectedConds = new Set(edges.map((e) => conditions[e.c].label));

  const nRows = Math.max(classes.length, conditions.length, 1);
  const height = nRows * ROW_H;
  const greeting = name || user?.email?.split("@")[0] || "there";

  const edgeActive = (e: number, c: number) =>
    !sel || (sel.type === "exp" && classes[e] === sel.key) || (sel.type === "cond" && conditions[c].label === sel.key);
  const nodeDim = (type: "exp" | "cond", key: string) => {
    if (!sel) return false;
    if (sel.type === type && sel.key === key) return false;
    // keep nodes connected to the selection highlighted
    if (sel.type === "exp") return type === "cond" ? !(CONDITION_EXPOSURES[key] ?? []).includes(sel.key) : true;
    return type === "exp" ? !(CONDITION_EXPOSURES[sel.key] ?? []).includes(key) : true;
  };
  function toggle(type: "exp" | "cond", key: string) {
    setSel((cur) => (cur && cur.type === type && cur.key === key ? null : { type, key }));
  }
  async function setStatus(label: string, value: string) {
    setCondStatus((p) => ({ ...p, [label]: value }));
    await supabase.from("conditions").update({ claim_status: value }).eq("label", label);
  }

  // Completeness steps (kept compact under the map).
  const steps = [
    { label: "Service details", done: !!(branch || years), href: "/account", cta: "Add your service details" },
    { label: "Where you served", done: rows.length > 0, href: "/map", cta: "Map where you served" },
    { label: "Exposures", done: classes.length > 0, href: "/map", cta: "Document your exposures" },
    { label: "Conditions", done: conditions.length > 0, href: "/health", cta: "Add your health conditions" },
    { label: "A documented link", done: connectedConds.size > 0, href: "/conditions", cta: "Connect a condition to an exposure" },
    { label: "Corroboration", done: corr > 0, href: "/buddies", cta: "Get a battle buddy to corroborate" },
    { label: "DD-214", done: hasRecord, href: "/account", cta: "Upload your DD-214" },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);
  const next = steps.filter((s) => !s.done);

  const canMap = classes.length > 0 && conditions.length > 0;

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="space-y-5">
      {/* Print-only letterhead */}
      <div className="hidden print:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/owh-logo.png" alt="Operation Whole Health" className="h-10 w-auto object-contain" />
        <div className="mt-2 text-lg font-bold text-ink">Connecting the Dots of Service</div>
        <div className="text-sm text-muted">{[name, branch, years, today].filter(Boolean).join(" · ")}</div>
        <div className="mt-1 text-sm text-ink">
          Documented {rows.length} location{rows.length === 1 ? "" : "s"}, {classes.length} exposure{classes.length === 1 ? "" : "s"}, and {conditions.length} condition{conditions.length === 1 ? "" : "s"}; {connectedConds.size} connected to a documented exposure.
        </div>
        <hr className="mt-3 border-line" />
      </div>

      <div className="flex justify-end print:hidden">
        <button onClick={() => window.print()} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-brand transition hover:bg-canvas">
          Print / Save as PDF to share
        </button>
      </div>

      {/* Arrival header */}
      <div className="overflow-hidden rounded-2xl bg-brand text-brand-foreground print:hidden">
        <ServiceRibbon />
        <div className="p-6">
          <div className="text-lg font-semibold tracking-tight">Connecting the dots of your service, {greeting}.</div>
          <div className="mt-1 text-sm text-white/75">
            You&apos;ve documented <strong>{rows.length}</strong> location{rows.length === 1 ? "" : "s"},{" "}
            <strong>{classes.length}</strong> exposure{classes.length === 1 ? "" : "s"}, and{" "}
            <strong>{conditions.length}</strong> condition{conditions.length === 1 ? "" : "s"} — and the app has
            connected <strong>{connectedConds.size}</strong> of them to a documented exposure.
          </div>
          <div className="mt-4">
            <div className="flex items-end justify-between">
              <span className="text-sm text-white/80">Your record is taking shape</span>
              <span className="text-sm font-bold">{doneCount} of {steps.length} · {pct}%</span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/15">
              <span className="block h-2.5 rounded-full bg-accent" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* The map */}
      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="text-sm font-bold text-ink">How your service connects to your health</div>
        <p className="mt-1 text-xs text-muted">
          Every line is a link the VA already recognizes. Tap any dot to see the connection and its citation.
        </p>

        {!canMap ? (
          <div className="mt-4 rounded-lg border border-line bg-canvas p-5 text-center">
            <p className="text-sm text-muted">
              Add at least one exposure and one condition and your connection map will appear here.
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Link href="/map" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-600">Map where you served</Link>
              <Link href="/health" className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-muted hover:bg-canvas">Add your health</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-4 flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-muted">
              <span>What you were exposed to</span>
              <span>What it&apos;s linked to</span>
            </div>
            <div className="relative mt-2" style={{ height }}>
              <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 100 ${nRows}`} preserveAspectRatio="none" aria-hidden="true">
                {edges.map((ed, i) => {
                  const ey = ed.e + 0.5;
                  const cy = ed.c + 0.5;
                  const active = edgeActive(ed.e, ed.c);
                  return (
                    <path
                      key={i}
                      d={`M40,${ey} C50,${ey} 50,${cy} 60,${cy}`}
                      fill="none"
                      stroke={active ? "#c1873d" : "#cbd5e1"}
                      strokeWidth={active ? 2 : 1}
                      strokeOpacity={sel ? (active ? 0.95 : 0.25) : 0.55}
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}
              </svg>

              {classes.map((ec, i) => {
                const dim = nodeDim("exp", ec);
                const on = sel?.type === "exp" && sel.key === ec;
                return (
                  <button
                    key={ec}
                    onClick={() => toggle("exp", ec)}
                    className={`absolute left-0 flex items-center rounded-lg border px-2.5 text-left text-xs font-medium leading-tight transition ${
                      on ? "border-accent bg-accent/10 text-accent" : "border-line bg-white text-ink hover:border-brand/40"
                    } ${dim ? "opacity-30" : ""}`}
                    style={{ top: i * ROW_H + 6, height: ROW_H - 12, width: "40%" }}
                  >
                    <span className="line-clamp-2">{EXPOSURE_LABEL[ec] ?? ec}</span>
                  </button>
                );
              })}

              {conditions.map((cond, i) => {
                const dim = nodeDim("cond", cond.label);
                const on = sel?.type === "cond" && sel.key === cond.label;
                const linked = connectedConds.has(cond.label);
                return (
                  <button
                    key={cond.label}
                    onClick={() => toggle("cond", cond.label)}
                    className={`absolute right-0 flex items-center justify-end rounded-lg border px-2.5 text-right text-xs font-medium leading-tight transition ${
                      on ? "border-accent bg-accent/10 text-accent" : linked ? "border-success/40 bg-success-soft text-ink" : "border-line bg-white text-ink hover:border-brand/40"
                    } ${dim ? "opacity-30" : ""}`}
                    style={{ top: i * ROW_H + 6, height: ROW_H - 12, width: "40%" }}
                  >
                    <span className="line-clamp-2">{cond.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Detail panel */}
        {sel && <Detail sel={sel} places={placesFor} />}
      </div>

      {/* Where each claim stands */}
      {conditions.length > 0 && (
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="text-sm font-bold text-ink">Where each claim stands</div>
          <p className="mt-1 text-xs text-muted">From documented here, to recognized by the VA, to filed, to rated. Update each as your claim moves.</p>
          <div className="mt-3 space-y-3">
            {conditions.map((cond) => {
              const basis = CONDITION_BASIS[cond.label];
              const status = condStatus[cond.label] ?? cond.claim_status;
              const recognized = !!basis?.presumptive && connectedConds.has(cond.label);
              return (
                <div key={cond.label} className="rounded-lg border border-line p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">{cond.label}</span>
                    <select value={status} onChange={(e) => setStatus(cond.label, e.target.value)} className="rounded-md border border-line bg-canvas px-2 py-1 text-xs text-ink print:hidden">
                      <option value="none">Not filed</option>
                      <option value="filed">Filed</option>
                      <option value="granted">Granted</option>
                      <option value="denied">Denied</option>
                    </select>
                  </div>
                  <div className="mt-3"><StatusStrip recognized={recognized} filed={status !== "none"} rated={status === "granted"} denied={status === "denied"} /></div>
                  {status === "denied" && <p className="mt-1.5 text-[11px] leading-relaxed text-muted">Denied isn&apos;t the end — you can appeal or file a supplemental claim, and this record strengthens it.</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Next dot */}
      {next.length > 0 && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-5 print:hidden">
          <div className="text-xs font-semibold uppercase tracking-wide text-accent">Connect your next dot</div>
          <p className="mt-1 text-sm text-ink">Each one makes your record — and your claim — stronger.</p>
          <div className="mt-3 space-y-2">
            {next.slice(0, 3).map((s) => (
              <Link key={s.label} href={s.href} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition hover:border-brand/40">
                {s.cta}<span className="text-brand">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <Link href="/report" className="block w-full rounded-xl bg-brand px-6 py-3 text-center text-sm font-bold text-brand-foreground transition hover:bg-brand-600 print:hidden">
        Open your claim packet →
      </Link>

      <p className="border-t border-line pt-4 text-xs leading-relaxed text-faint">
        Every connection here is drawn from what the VA already recognizes. This is your private record — an
        estimate and a record, not a diagnosis or a determination of service connection. Bring it to an
        accredited VSO and your clinician. If anything feels heavy, the Veterans Crisis Line is one tap away: dial 988, then press 1.
      </p>
    </div>
  );
}

function StatusStrip({ recognized, filed, rated, denied }: { recognized: boolean; filed: boolean; rated: boolean; denied: boolean }) {
  const steps = [
    { label: "Logged", done: true, bad: false },
    { label: "Recognized", done: recognized, bad: false },
    { label: "Filed", done: filed, bad: false },
    { label: denied ? "Denied" : "Rated", done: rated, bad: denied && filed && !rated },
  ];
  return (
    <div className="flex items-center">
      {steps.map((s, i) => (
        <div key={s.label} className="flex flex-1 items-center">
          <div className="flex flex-col items-center">
            <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-full ${s.bad ? "bg-red-500 text-white" : s.done ? "bg-success text-white" : "border border-line bg-white text-faint"}`}>
              {s.done || s.bad ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" className="h-2.5 w-2.5">
                  {s.bad ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M20 6 9 17l-5-5" />}
                </svg>
              ) : (
                <span className="text-[9px] font-bold">{i + 1}</span>
              )}
            </span>
            <span className={`mt-1 text-[9px] leading-none ${s.done || s.bad ? "font-medium text-ink" : "text-faint"}`}>{s.label}</span>
          </div>
          {i < steps.length - 1 && <div className={`mx-1 mb-3.5 h-0.5 flex-1 ${steps[i + 1].done ? "bg-success" : "bg-line"}`} />}
        </div>
      ))}
    </div>
  );
}

function Detail({ sel, places }: { sel: { type: "exp" | "cond"; key: string }; places: Record<string, string[]> }) {
  if (sel.type === "exp") {
    const slug = EXPOSURE_TO_LEARN[sel.key];
    const linkedConds = Object.keys(CONDITION_EXPOSURES).filter((c) => (CONDITION_EXPOSURES[c] ?? []).includes(sel.key));
    return (
      <div className="mt-4 rounded-lg border-l-2 border-accent bg-accent/5 p-4">
        <div className="text-sm font-bold text-ink">{EXPOSURE_LABEL[sel.key] ?? sel.key}</div>
        {(places[sel.key]?.length ?? 0) > 0 && <div className="mt-1 text-xs text-muted">You logged this at: {places[sel.key].join(", ")}</div>}
        <div className="mt-2 text-xs text-ink">Conditions the VA and science link to this exposure: {linkedConds.join(", ")}.</div>
        {slug && (
          <Link href={`/learn/${slug}`} className="mt-2 inline-block text-xs font-semibold text-brand hover:underline">
            Learn what this does to the body →
          </Link>
        )}
      </div>
    );
  }

  // condition
  const basis = CONDITION_BASIS[sel.key];
  const linked = CONDITION_EXPOSURES[sel.key] ?? [];
  return (
    <div className="mt-4 rounded-lg border border-success/30 bg-success-soft p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-ink">{sel.key}</span>
        {basis && (
          <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${basis.presumptive ? "bg-success text-white" : "bg-warn-soft text-warn"}`}>{basis.tag}</span>
        )}
      </div>
      {basis && <p className="mt-1.5 text-xs leading-relaxed text-ink">{basis.cite}</p>}
      <div className="mt-2 text-xs text-muted">
        Linked exposures: {linked.map((e) => EXPOSURE_LABEL[e] ?? e).join(", ")}.
      </div>
      <Link href="/conditions" className="mt-2 inline-block text-xs font-semibold text-brand hover:underline">
        See the full breakdown and what to track →
      </Link>
    </div>
  );
}
