"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { ServiceRibbon } from "./Patriotic";
import { EXPOSURE_LABEL, CONDITION_EXPOSURES } from "@/lib/education";
import { CONDITION_BASIS } from "@/lib/citations";

type CheckRow = { place_name: string | null; date_start: string | null; exposures: { exposure_class: string }[] | null };
type Cond = { label: string; claim_status: string };

export default function JourneyView() {
  const { user, supabase } = useAuth();
  const [name, setName] = useState<string | null>(null);
  const [branch, setBranch] = useState<string | null>(null);
  const [years, setYears] = useState<string | null>(null);
  const [rows, setRows] = useState<CheckRow[]>([]);
  const [classes, setClasses] = useState<Set<string>>(new Set());
  const [conditions, setConditions] = useState<Cond[]>([]);
  const [corr, setCorr] = useState(0);
  const [hasRecord, setHasRecord] = useState(false);
  const [loaded, setLoaded] = useState(false);

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
      setClasses(new Set(exRows.map((e) => e.exposure_class)));
      setConditions((co.data ?? []) as Cond[]);
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

  const connections = conditions
    .map((c) => ({
      label: c.label,
      exposures: (CONDITION_EXPOSURES[c.label] ?? []).filter((e) => classes.has(e)),
      basis: CONDITION_BASIS[c.label],
    }))
    .filter((c) => c.exposures.length > 0);

  const steps = [
    { label: "Service details", done: !!(branch || years), href: "/account", cta: "Add your service details" },
    { label: "Where you served", done: rows.length > 0, href: "/map", cta: "Map where you served" },
    { label: "Exposures", done: classes.size > 0, href: "/map", cta: "Document your exposures" },
    { label: "Conditions", done: conditions.length > 0, href: "/health", cta: "Add your health conditions" },
    { label: "A documented link", done: connections.length > 0, href: "/conditions", cta: "Connect a condition to an exposure" },
    { label: "Corroboration", done: corr > 0, href: "/buddies", cta: "Get a battle buddy to corroborate" },
    { label: "DD-214", done: hasRecord, href: "/account", cta: "Upload your DD-214" },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);
  const next = steps.filter((s) => !s.done);
  const greeting = name || user?.email?.split("@")[0] || "there";

  return (
    <div className="space-y-5">
      {/* Header + completeness */}
      <div className="overflow-hidden rounded-2xl bg-brand text-brand-foreground">
        <ServiceRibbon />
        <div className="p-6">
          <div className="text-lg font-semibold tracking-tight">Connecting the dots of your service, {greeting}.</div>
          <div className="mt-0.5 text-sm text-white/70">{[branch, years].filter(Boolean).join(" · ") || "Let's build your record."}</div>
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

      {/* The dots */}
      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="text-sm font-semibold text-ink">The dots</div>
        <div className="mt-3 flex items-start gap-1 overflow-x-auto pb-1">
          {steps.map((s, i) => (
            <div key={s.label} className="flex flex-1 items-start">
              <Link href={s.href} className="flex min-w-[64px] flex-col items-center text-center">
                <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-full border-2 text-xs font-bold transition ${s.done ? "border-success bg-success text-white" : "border-line bg-white text-faint"}`}>
                  {s.done ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M20 6 9 17l-5-5" /></svg>
                  ) : (i + 1)}
                </span>
                <span className={`mt-1.5 text-[11px] leading-tight ${s.done ? "font-medium text-ink" : "text-muted"}`}>{s.label}</span>
              </Link>
              {i < steps.length - 1 && <div className={`mt-4 h-0.5 flex-1 ${steps[i + 1].done && s.done ? "bg-success" : "bg-line"}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Connections made — the payoff */}
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="h-1 bg-accent" />
        <div className="p-5">
          <div className="text-sm font-bold text-ink">
            {connections.length > 0
              ? `You've connected ${connections.length} condition${connections.length === 1 ? "" : "s"} to a documented exposure`
              : "The dots you've connected"}
          </div>
          {connections.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              As you add where you served, what you were exposed to, and the conditions you live with, we&apos;ll
              surface the links the VA already recognizes — and they&apos;ll appear here as connected dots.
            </p>
          ) : (
            <div className="mt-3 space-y-2.5">
              {connections.map((c) => (
                <div key={c.label} className="rounded-lg border border-success/30 bg-success-soft px-3.5 py-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold text-ink">{c.label}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-success"><path d="M7 17 17 7M7 7h10v10" /></svg>
                    <span className="text-ink">{c.exposures.map((e) => EXPOSURE_LABEL[e] ?? e).join(", ")}</span>
                    {c.basis && (
                      <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${c.basis.presumptive ? "bg-success text-white" : "bg-warn-soft text-warn"}`}>{c.basis.tag}</span>
                    )}
                  </div>
                  {c.basis && <p className="mt-1 text-[11px] leading-relaxed text-muted">{c.basis.cite}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-ink">Your service timeline</div>
          <Link href="/locations" className="text-xs font-medium text-brand hover:underline">Manage →</Link>
        </div>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No locations yet. Drop your first pin on the map.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {rows.map((r, i) => (
              <li key={i} className="border-t border-line pt-2 text-sm first:border-0 first:pt-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium text-ink">{r.place_name || "A logged location"}</span>
                  <span className="flex-none text-xs text-muted">{r.date_start ? new Date(r.date_start).getUTCFullYear() : "—"}</span>
                </div>
                <div className="text-xs text-muted">{(r.exposures ?? []).map((e) => EXPOSURE_LABEL[e.exposure_class] ?? e.exposure_class).join(", ") || "—"}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Next dot */}
      {next.length > 0 ? (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-accent">Connect your next dot</div>
          <p className="mt-1 text-sm text-ink">Each one makes your record — and your claim — stronger.</p>
          <div className="mt-3 space-y-2">
            {next.map((s) => (
              <Link key={s.label} href={s.href} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition hover:border-brand/40">
                {s.cta}
                <span className="text-brand">→</span>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-success/40 bg-success-soft p-5 text-center">
          <div className="text-sm font-bold text-ink">Every dot is connected. 🎖️</div>
          <p className="mt-1 text-sm text-muted">Your record is complete. Bring your packet to an accredited VSO and your clinician.</p>
        </div>
      )}

      <Link href="/report" className="block w-full rounded-xl bg-brand px-6 py-3 text-center text-sm font-bold text-brand-foreground transition hover:bg-brand-600">
        Open your claim packet →
      </Link>

      <p className="border-t border-line pt-4 text-xs leading-relaxed text-faint">
        This is your private record. It is an estimate and a record — not a diagnosis or a determination of
        service connection. Bring it to an accredited VSO and your clinician. Veterans Crisis Line: dial 988, then press 1.
      </p>
    </div>
  );
}
