"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import VerifyCard from "./VerifyCard";
import { ServiceRibbon, Seal250, RibbonDivider } from "./Patriotic";
import { CONDITION_EXPOSURES, EXPOSURE_LABEL } from "@/lib/education";
import { recordProgress } from "@/lib/nextaction";


type CheckRow = { id: string; place_name: string | null; date_start: string | null; exposures: { exposure_class: string }[] | null };
type Conn = { id: string; direction: "sent" | "received"; status: string; other_name: string | null; place: string | null; ev_year: number | null };

const QUICK = [
  { href: "/mike", title: "Talk to Medic Mike", d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { href: "/journey", title: "Connect the dots", d: "M5 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM19 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM19 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM7.5 10.5l9-5M7.5 13l9 5" },
  { href: "/map", title: "Open the map", d: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" },
  { href: "/shots", title: "Your shot record", d: "M9 2h6M12 2v6M7 8h10l1 12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L7 8zM9 13h6M9 17h4" },
  { href: "/intake/ai", title: "Voice guided intake", d: "M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" },
  { href: "/learn", title: "Exposure library", d: "M9 2h6M10 2v5.5L5.2 16A2 2 0 0 0 7 19h10a2 2 0 0 0 1.8-3L14 7.5V2" },
  { href: "/solutions", title: "Whole health", d: "M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" },
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
  const [pendingReqs, setPendingReqs] = useState<Conn[]>([]);
  const [filedCount, setFiledCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [classes, setClasses] = useState<string[]>([]);
  const [condLabels, setCondLabels] = useState<string[]>([]);
  const [hasDD214, setHasDD214] = useState(false);
  const [deniedCount, setDeniedCount] = useState(0);
  const [stillServing, setStillServing] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // still_serving is 0017; fall back so the header still renders before it is run.
      let m = await supabase.from("members").select("display_name, branch, service_start, service_end, still_serving").eq("auth_id", user.id).maybeSingle();
      if (m.error) m = await supabase.from("members").select("display_name, branch, service_start, service_end").eq("auth_id", user.id).maybeSingle();
      if (!m.data) await supabase.from("members").insert({ auth_id: user.id });
      setName((m.data?.display_name as string) ?? null);
      setBranch((m.data?.branch as string) ?? null);
      const ss = m.data?.service_start ? new Date(m.data.service_start as string).getUTCFullYear() : null;
      const se = m.data?.service_end ? new Date(m.data.service_end as string).getUTCFullYear() : null;
      // A still-serving member reads "2018–present", never "2018–?" — a "?" here
      // looks like an incomplete record when in fact he answered the question.
      const serving = m.data?.still_serving === true;
      setYears(ss || se ? (serving ? `${ss ?? "?"}–present` : `${ss ?? "?"}–${se ?? "?"}`) : null);
      setStillServing(serving);

      const [ci, exprows, cond, conns, files] = await Promise.all([
        supabase.from("check_ins").select("id, place_name, date_start, exposures(exposure_class)").order("date_start", { ascending: false }),
        supabase.from("exposures").select("id, exposure_class"),
        supabase.from("conditions").select("label, claim_status").order("created_at"),
        supabase.rpc("list_buddy_connections"),
        supabase.storage.from("records").list(user.id),
      ]);
      setRows((ci.data ?? []) as CheckRow[]);
      const exRows = (exprows.data ?? []) as { id: string; exposure_class: string }[];
      setClasses(Array.from(new Set(exRows.map((e) => e.exposure_class))));
      const condRows = (cond.data ?? []) as { label: string; claim_status?: string }[];
      setCondLabels(condRows.map((c) => c.label));
      setFiledCount(condRows.filter((c) => c.claim_status && c.claim_status !== "none").length);
      setDeniedCount(condRows.filter((c) => c.claim_status === "denied").length);
      let corr = 0;
      const ids = exRows.map((e) => e.id);
      if (ids.length) {
        const c = await supabase.from("corroborations").select("id", { count: "exact", head: true }).in("exposure_id", ids);
        corr = c.count ?? 0;
      }
      setCounts({ exposures: exRows.length, conditions: condRows.length, corroborations: corr });
      const allConns = (conns.data ?? []) as Conn[];
      setBuddies(allConns.filter((x) => x.status === "accepted"));
      // A human is waiting — that must never be invisible on the home screen.
      setPendingReqs(allConns.filter((x) => x.direction === "received" && x.status === "pending"));
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
    // Never a numeric tally of conditions — "11 conditions" is a picture of
    // everything wrong with you. State, not score.
    { label: "Your health", value: counts.conditions > 0 ? "On file" : "Not yet", href: "/health" },
    { label: "Corroborations", value: counts.corroborations, href: "/buddies" },
    { label: "Battle buddies", value: buddies.length, href: "/buddies" },
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
    filedConditions: filedCount,
  });

  const [reqErr, setReqErr] = useState<string | null>(null);
  async function respondReq(id: string, accept: boolean) {
    setReqErr(null);
    // The RPC never throws — it RETURNS 'accepted'/'declined' or a failure
    // code ('no_member'/'not_found'/'forbidden'). Only a confirmed outcome
    // may dismiss the card; a failed Accept must never look successful.
    const { data, error } = await supabase.rpc("respond_buddy_connection", { p_connection_id: id, p_accept: accept });
    if (error || (data !== "accepted" && data !== "declined")) {
      setReqErr("That didn't go through — try again in a moment.");
      return;
    }
    const req = pendingReqs.find((r) => r.id === id);
    setPendingReqs((prev) => prev.filter((r) => r.id !== id));
    if (data === "accepted" && req) setBuddies((prev) => [...prev, { ...req, status: "accepted" }]);
  }

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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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

      {/* A veteran reached out — the human moment outranks everything below it */}
      {pendingReqs.length > 0 && (
        <div className="rounded-xl border border-accent/40 bg-accent/5 p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-accent">Battle buddies</div>
          {reqErr && <p role="status" className="mt-1 text-xs font-medium text-red-600">{reqErr}</p>}
          {pendingReqs.map((r) => (
            <div key={r.id} className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ink">
                <strong>{r.other_name || "A veteran"}</strong> who served{r.place ? ` near ${r.place}` : " where you did"}
                {r.ev_year ? ` around ${r.ev_year}` : ""} asked to connect.
              </p>
              <div className="flex gap-2">
                <button onClick={() => respondReq(r.id, true)} className="rounded-lg bg-brand px-3.5 py-1.5 text-sm font-semibold text-brand-foreground hover:bg-brand-600">Accept</button>
                <button onClick={() => respondReq(r.id, false)} className="rounded-lg border border-line px-3.5 py-1.5 text-sm text-muted hover:bg-canvas">Not now</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* A denial just happened — surface the path forward without waiting to be asked */}
      {deniedCount > 0 && (
        <Link href="/denied" className="block rounded-xl border border-line bg-surface p-5 transition hover:border-brand/40">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">
            {deniedCount} condition{deniedCount === 1 ? "" : "s"} denied
          </div>
          <div className="mt-1 text-sm font-semibold text-ink">A denial isn&apos;t the end — see your next steps →</div>
        </Link>
      )}

      {/* Still serving — BDD is the fastest path to benefits with no gap in coverage */}
      {stillServing && (
        <Link href="/bdd" className="block rounded-xl border border-line bg-surface p-5 transition hover:border-brand/40">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">Still serving</div>
          <div className="mt-1 text-sm font-semibold text-ink">File before you separate — see the BDD timeline →</div>
        </Link>
      )}

      {/* Start here (brand-new) / Resume (returning) — one lit door either way */}
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
        {!loaded ? (
          <>
            <div className="text-xs font-semibold uppercase tracking-wide text-accent">Your record</div>
            <p className="mt-1.5 text-sm text-muted">Loading your record…</p>
          </>
        ) : checkins === 0 ? (
          <>
            <div className="text-xs font-semibold uppercase tracking-wide text-accent">Start here</div>
            <p className="mt-1.5 text-sm leading-relaxed text-ink">
              Welcome{name ? `, ${name}` : ""}. The first step is the map — drop a pin where you served, and
              we&apos;ll show you the exposures the government already documents there. That&apos;s the whole
              idea: connect where you were to what it did to your health.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <Link href="/map" className="inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-600">
                Drop your first pin on the map
              </Link>
              <Link href="/intake/ai" className="text-sm font-semibold text-brand hover:underline">
                or answer a few questions instead →
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-accent">
                {prog.claimReady ? "Your record is claim-ready" : "Pick up where you left off"}
              </div>
              <span className="flex-none text-xs font-semibold text-muted">{prog.done} of {prog.total} · {prog.pct}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-line">
              <span className="block h-2 rounded-full bg-accent transition-all" style={{ width: `${prog.pct}%` }} />
            </div>
            {prog.next ? (
              <>
                <p className="mt-3 text-sm text-ink">
                  {prog.claimReady
                    ? <>Your record is claim-ready. Make it stronger — next: {prog.next.label.toLowerCase()}.</>
                    : <>You&apos;re <strong>{prog.remaining.length}</strong> step{prog.remaining.length === 1 ? "" : "s"} from a
                  claim-ready record. Next: {prog.next.label.toLowerCase()}.</>}
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
                  Every dot is connected. Assemble your claim packet and bring it to an accredited VSO (Veterans Service Officer — free help) to file.
                </p>
                <Link href="/report" className="mt-3 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-600">
                  Open your claim packet
                </Link>
              </>
            )}
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
            <div className="mt-3">
              <p className="text-sm text-muted">No locations yet. Start by marking one place you served.</p>
              <Link href="/map" className="mt-3 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-600">
                Drop your first pin
              </Link>
            </div>
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
            <div className="mt-3">
              <p className="text-sm text-muted">No connections yet. Reconnect with the veterans who served where you did — privately, and only if you both agree.</p>
              <Link href="/buddies" className="mt-3 inline-block rounded-lg border border-line px-4 py-2 text-sm font-semibold text-brand hover:bg-canvas">
                Find battle buddies
              </Link>
            </div>
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
