"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import VerifyCard from "./VerifyCard";
import { ServiceRibbon, Seal250, RibbonDivider } from "./Patriotic";
import { CONDITION_EXPOSURES } from "@/lib/education";
import { recordProgress } from "@/lib/nextaction";

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

type CheckRow = { id: string; place_name: string | null; date_start: string | null; exposures: { exposure_class: string }[] | null };
type Conn = { status: string; other_name: string | null; place: string | null; ev_year: number | null };

const QUICK = [
  { href: "/journey", title: "Connect the dots", d: "M5 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM19 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM19 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM7.5 10.5l9-5M7.5 13l9 5" },
  { href: "/map", title: "Open the map", d: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" },
  { href: "/intake/ai", title: "Voice guided intake", d: "M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" },
  { href: "/learn", title: "Exposure library", d: "M9 2h6M10 2v5.5L5.2 16A2 2 0 0 0 7 19h10a2 2 0 0 0 1.8-3L14 7.5V2" },
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
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [classes, setClasses] = useState<string[]>([]);
  const [condLabels, setCondLabels] = useState<string[]>([]);
  const [hasDD214, setHasDD214] = useState(false);

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

      const [ci, exprows, cond, conns, files] = await Promise.all([
        supabase.from("check_ins").select("id, place_name, date_start, exposures(exposure_class)").order("date_start", { ascending: false }),
        supabase.from("exposures").select("id, exposure_class"),
        supabase.from("conditions").select("label").order("created_at"),
        supabase.rpc("list_buddy_connections"),
        supabase.storage.from("records").list(user.id),
      ]);
      setRows((ci.data ?? []) as CheckRow[]);
      const exRows = (exprows.data ?? []) as { id: string; exposure_class: string }[];
      setClasses(Array.from(new Set(exRows.map((e) => e.exposure_class))));
      const condRows = (cond.data ?? []) as { label: string }[];
      setCondLabels(condRows.map((c) => c.label));
      let corr = 0;
      const ids = exRows.map((e) => e.id);
      if (ids.length) {
        const c = await supabase.from("corroborations").select("id", { count: "exact", head: true }).in("exposure_id", ids);
        corr = c.count ?? 0;
      }
      setCounts({ exposures: exRows.length, conditions: condRows.length, corroborations: corr });
      setBuddies(((conns.data ?? []) as Conn[]).filter((x) => x.status === "accepted"));
      setHasDD214(((files.data ?? []).filter((f) => f.name !== ".emptyFolderPlaceholder")).length > 0);
      setLoaded(true);
    })();
  }, [user, supabase]);

  const greeting = name || user?.email?.split("@")[0] || "there";
  const initial = (name || user?.email || "V").trim().charAt(0).toUpperCase();
  const checkins = rows.length;

  async function removeCheckin(id: string) {
    await supabase.from("check_ins").delete().eq("id", id);
    setRows((prev) => prev.filter((r) => r.id !== id));
    setConfirmDel(null);
  }

  const stats = [
    { label: "Locations", value: checkins, href: "/locations" },
    { label: "Exposures", value: counts.exposures, href: "/exposures" },
    { label: "Conditions", value: counts.conditions, href: "/conditions" },
    { label: "Corroborations", value: counts.corroborations, href: "/buddies" },
    { label: "Battle buddies", value: buddies.length, href: "/buddies" },
    { label: "Solutions", value: counts.exposures + counts.conditions, href: "/solutions" },
  ];

  const connectedCount = condLabels.filter((label) =>
    (CONDITION_EXPOSURES[label] ?? []).some((ec) => classes.includes(ec))
  ).length;
  const prog = recordProgress({
    hasService: !!(branch || years),
    locations: checkins,
    exposures: classes.length,
    conditions: counts.conditions,
    connectedConditions: connectedCount,
    corroborations: counts.corroborations,
    hasDD214,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl bg-brand text-brand-foreground">
        <ServiceRibbon />
        <div className="flex items-center gap-4 p-6">
          <div className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-white/15 text-xl font-bold">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-semibold tracking-tight">Welcome back, {greeting}.</div>
            <div className="text-sm text-white/70">
              {[branch, years].filter(Boolean).join(" · ") || "Let's build your record."}
            </div>
          </div>
          <Seal250 className="hidden sm:flex" />
        </div>
      </div>

      <VerifyCard />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group overflow-hidden rounded-xl border border-line bg-surface transition hover:border-brand/40 hover:shadow-sm"
          >
            <div className="h-1 bg-accent" />
            <div className="p-4">
              <div className="text-2xl font-bold text-ink">{loaded ? s.value : "—"}</div>
              <div className="mt-0.5 flex items-center gap-1 text-xs leading-snug text-muted">
                {s.label}
                <span className="opacity-0 transition group-hover:opacity-100">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Resume / next-action bridge */}
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-accent">
            {!loaded ? "Your record" : prog.claimReady ? "Your record is claim-ready" : "Pick up where you left off"}
          </div>
          <span className="flex-none text-xs font-semibold text-muted">{loaded ? `${prog.done} of ${prog.total} · ${prog.pct}%` : "—"}</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-line">
          <span className="block h-2 rounded-full bg-accent transition-all" style={{ width: loaded ? `${prog.pct}%` : "0%" }} />
        </div>
        {!loaded ? (
          <p className="mt-3 text-sm text-muted">Loading your record…</p>
        ) : prog.next ? (
          <>
            <p className="mt-3 text-sm text-ink">
              You&apos;re <strong>{prog.remaining.length}</strong> step{prog.remaining.length === 1 ? "" : "s"} from a
              claim-ready record. Next: {prog.next.label.toLowerCase()}.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <Link href={prog.next.href} className="inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-600">
                {prog.next.cta}
              </Link>
              {prog.claimReady && (
                <Link href="/report" className="text-sm font-semibold text-brand hover:underline">
                  or open your claim packet →
                </Link>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm text-ink">
              Every dot is connected. Assemble your claim packet and bring it to an accredited VSO to file.
            </p>
            <Link href="/report" className="mt-3 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-600">
              Open your claim packet
            </Link>
          </>
        )}
      </div>

      <RibbonDivider label="Your record" />

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
              {rows.slice(0, 6).map((r) => (
                <li key={r.id} className="border-t border-line pt-2 text-sm first:border-0 first:pt-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium text-ink">{r.place_name || "A logged location"}</span>
                    <span className="flex-none text-xs text-muted">{r.date_start ? new Date(r.date_start).getUTCFullYear() : "—"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-muted">
                      {(r.exposures ?? []).map((e) => EXPOSURE_LABEL[e.exposure_class] ?? e.exposure_class).join(", ") || "—"}
                    </div>
                    {confirmDel === r.id ? (
                      <span className="flex flex-none items-center gap-2 text-xs">
                        <button onClick={() => removeCheckin(r.id)} className="font-semibold text-red-600 hover:underline">Remove</button>
                        <button onClick={() => setConfirmDel(null)} className="text-muted hover:underline">Cancel</button>
                      </span>
                    ) : (
                      <button onClick={() => setConfirmDel(r.id)} className="flex-none text-xs text-faint transition hover:text-red-600" aria-label="Remove location">
                        Remove
                      </button>
                    )}
                  </div>
                </li>
              ))}
              {checkins > 6 && (
                <li className="pt-1 text-xs">
                  <Link href="/locations" className="font-medium text-brand hover:underline">Manage all {checkins} locations →</Link>
                </li>
              )}
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
