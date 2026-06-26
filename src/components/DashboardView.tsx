"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import VerifyCard from "./VerifyCard";

const EXPOSURE_LABEL: Record<string, string> = {
  burn_pit: "Burn pits",
  heavy_metal: "Heavy metals",
  chemical_solvent: "Chemical / solvent",
  water_contamination: "Water contamination",
  pesticide: "Pesticide / herbicide",
  asbestos_silica: "Asbestos / silica",
  nerve_agent: "Nerve agent",
  particulate: "Particulate / dust",
  radiation: "Radiation / DU",
  pfas_afff: "PFAS / AFFF",
  gulf_war_agent: "Gulf War agent",
};

type CheckRow = { place_name: string | null; date_start: string | null; exposures: { exposure_class: string }[] | null };
type Conn = { status: string; other_name: string | null; place: string | null; ev_year: number | null };

const QUICK = [
  { href: "/map", title: "Open the map", d: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" },
  { href: "/intake", title: "Guided intake", d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { href: "/report", title: "Your claim packet", d: "M14 3v5h5M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-5-5z" },
];

export default function DashboardView() {
  const { user, supabase } = useAuth();
  const [name, setName] = useState<string | null>(null);
  const [branch, setBranch] = useState<string | null>(null);
  const [years, setYears] = useState<string | null>(null);
  const [rows, setRows] = useState<CheckRow[]>([]);
  const [counts, setCounts] = useState({ exposures: 0, conditions: 0, corroborations: 0 });
  const [buddies, setBuddies] = useState<Conn[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const m = await supabase.from("members").select("display_name, branch, service_start, service_end").eq("auth_id", user.id).maybeSingle();
      if (!m.data) await supabase.from("members").insert({ auth_id: user.id });
      setName((m.data?.display_name as string) ?? null);
      setBranch((m.data?.branch as string) ?? null);
      const ss = m.data?.service_start ? new Date(m.data.service_start as string).getUTCFullYear() : null;
      const se = m.data?.service_end ? new Date(m.data.service_end as string).getUTCFullYear() : null;
      setYears(ss || se ? `${ss ?? "?"}–${se ?? "?"}` : null);

      const [ci, ex, co, exprows, conns] = await Promise.all([
        supabase.from("check_ins").select("place_name, date_start, exposures(exposure_class)").order("date_start", { ascending: false }),
        supabase.from("exposures").select("id", { count: "exact", head: true }),
        supabase.from("conditions").select("id", { count: "exact", head: true }),
        supabase.from("exposures").select("id"),
        supabase.rpc("list_buddy_connections"),
      ]);
      setRows((ci.data ?? []) as CheckRow[]);
      let corr = 0;
      const ids = (exprows.data ?? []).map((e: { id: string }) => e.id);
      if (ids.length) {
        const c = await supabase.from("corroborations").select("id", { count: "exact", head: true }).in("exposure_id", ids);
        corr = c.count ?? 0;
      }
      setCounts({ exposures: ex.count ?? 0, conditions: co.count ?? 0, corroborations: corr });
      setBuddies(((conns.data ?? []) as Conn[]).filter((x) => x.status === "accepted"));
      setLoaded(true);
    })();
  }, [user, supabase]);

  const greeting = name || user?.email?.split("@")[0] || "there";
  const initial = (name || user?.email || "V").trim().charAt(0).toUpperCase();
  const checkins = rows.length;

  const stats = [
    { label: "Locations", value: checkins },
    { label: "Exposures", value: counts.exposures },
    { label: "Conditions", value: counts.conditions },
    { label: "Corroborations", value: counts.corroborations },
    { label: "Battle buddies", value: buddies.length },
  ];

  const nextStep =
    checkins === 0
      ? { text: "Start by logging where you served — open the guided intake or the map.", href: "/intake", cta: "Begin your timeline" }
      : counts.conditions === 0
      ? { text: "Add the health conditions you live with so we can connect them to your exposures.", href: "/health", cta: "Add your health" }
      : { text: "Your record is taking shape. Assemble your claim packet to bring to your clinician or VSO.", href: "/report", cta: "Open your claim packet" };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl bg-brand text-brand-foreground">
        <div className="flex items-center gap-4 p-6">
          <div className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-white/15 text-xl font-bold">
            {initial}
          </div>
          <div>
            <div className="text-lg font-semibold tracking-tight">Welcome back, {greeting}.</div>
            <div className="text-sm text-white/70">
              {[branch, years].filter(Boolean).join(" · ") || "Let's build your record."}
            </div>
          </div>
        </div>
      </div>

      <VerifyCard />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-surface p-4">
            <div className="text-2xl font-bold text-ink">{loaded ? s.value : "—"}</div>
            <div className="mt-0.5 text-xs leading-snug text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Next step */}
      <div className="rounded-xl border border-brand/20 bg-brand/5 p-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-brand">Your next step</div>
        <p className="mt-1.5 text-sm text-ink">{nextStep.text}</p>
        <Link href={nextStep.href} className="mt-3 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-600">
          {nextStep.cta}
        </Link>
      </div>

      {/* Timeline + buddies */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-ink">Your timeline</div>
            <Link href="/map" className="text-xs font-medium text-brand hover:underline">Open map →</Link>
          </div>
          {checkins === 0 ? (
            <p className="mt-3 text-sm text-muted">No check-ins yet. Drop your first pin on the map.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {rows.slice(0, 6).map((r, i) => (
                <li key={i} className="border-t border-line pt-2 text-sm first:border-0 first:pt-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium text-ink">{r.place_name || "A logged location"}</span>
                    <span className="flex-none text-xs text-muted">{r.date_start ? new Date(r.date_start).getUTCFullYear() : "—"}</span>
                  </div>
                  <div className="text-xs text-muted">
                    {(r.exposures ?? []).map((e) => EXPOSURE_LABEL[e.exposure_class] ?? e.exposure_class).join(", ") || "—"}
                  </div>
                </li>
              ))}
              {checkins > 6 && <li className="pt-1 text-xs text-muted">+{checkins - 6} more on the map</li>}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-ink">Your battle buddies</div>
            <Link href="/buddies" className="text-xs font-medium text-brand hover:underline">Find buddies →</Link>
          </div>
          {buddies.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No connections yet. Reconnect with the veterans who served where you did — privately, and only if you both agree.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {buddies.map((b, i) => (
                <li key={i} className="border-t border-line pt-2 text-sm first:border-0 first:pt-0">
                  <div className="font-medium text-ink">{b.other_name || "A fellow veteran"}</div>
                  <div className="text-xs text-muted">Served near {b.place || "the same place"}{b.ev_year ? ` in ${b.ev_year}` : ""}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <div className="mb-2 text-sm font-semibold text-ink">Jump back in</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {QUICK.map((q) => (
            <Link key={q.href} href={q.href} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 transition hover:border-brand/40 hover:shadow-sm">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-brand/10 text-brand">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
                  <path d={q.d} />
                </svg>
              </span>
              <span className="text-sm font-semibold text-ink">{q.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
