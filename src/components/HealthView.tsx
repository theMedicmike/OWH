"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { EXPOSURE_LABEL, INCIDENT_LABEL } from "@/lib/education";
import { conditionsBySystem, searchConditions, defFor, CONDITION_BY_LABEL, COMMON_STARTERS } from "@/lib/conditions";
import ServiceTimeline, { type TimelineData } from "./ServiceTimeline";
import { CONDITION_EXPOSURES } from "@/lib/education";
import { matchCondition, type TourLite } from "@/lib/conditionMatch";
import { mosNoiseLookup, NOISE_CONDITIONS, MOS_NOISE_REVIEWED } from "@/lib/mosNoise";
import { asthmaPostServiceNote } from "@/lib/presumptive";
import WheelPicker from "./WheelPicker";

const ONSET_YEARS = Array.from({ length: new Date().getUTCFullYear() - 1940 + 1 }, (_, i) => String(1940 + i));

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 — "Your conditions". Tap sheet + the connection to where you served.
//
// Council rules honored here, deliberately:
//   • Tap, don't fill in forms. The name is the only required thing.
//   • Onset year is asked HERE (it used to live on step 3 — nobody walked back),
//     because onset is what draws the timeline diamond and prints on page one.
//   • "Do you have this in writing?" — the field that most decides whether a
//     claim survives, phrased as the system's failure, not the veteran's.
//   • The match is a SENTENCE inside the condition, never a badge, never a
//     count, never "you qualify."
//   • Event-linked conditions (tinnitus, PTSD, TBI, backs) get an honest
//     explanation instead of a dead end.
//   • No condition count anywhere — "11 conditions" is a picture of everything
//     wrong with you.
// ─────────────────────────────────────────────────────────────────────────────

type Condition = {
  id: string;
  label: string;
  claim_status: string;
  onset_year: number | null;
  onset_precision: string | null;
  evidence_status: string | null;
  secondary_to: string | null;
  diagnosed_by: string | null;
};
type CheckRow = {
  place_name: string | null;
  date_start: string | null;
  notes: string | null;
  exposures: { exposure_class: string }[] | null;
  incidents: { incident_class: string }[] | null;
};

const EVIDENCE = [
  { v: "documented", label: "Yes, I have papers" },
  { v: "probably", label: "Somewhere, probably" },
  { v: "undocumented", label: "Nobody wrote it down" },
];
// Element 1 of a VA claim is a CURRENT DIAGNOSIS. The app used to let a
// veteran tap a condition onto their record with no way to say whether a
// doctor had ever actually diagnosed it — the single gap every VA rater, C&P
// doctor, and VSO in the council audit independently named as the packet's
// biggest weakness.
const DIAGNOSIS = [
  { v: "va", label: "Yes — VA doctor" },
  { v: "civilian", label: "Yes — civilian doctor" },
  { v: "military", label: "Yes — while I was in" },
  { v: "not_yet", label: "Not yet — no doctor has said it" },
];
const CLAIMS = [
  { v: "none", label: "Not yet" },
  { v: "filed", label: "Filed, waiting" },
  { v: "granted", label: "Yes, rated" },
  { v: "denied", label: "Denied" },
];
const PRECISION = [
  { v: "in_service", label: "While I was in" },
  { v: "after_service", label: "After I got out" },
  { v: "unsure", label: "Not sure" },
];

const MENTAL_HEALTH_SYSTEM = "Mental health";

export default function HealthView() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [tours, setTours] = useState<TourLite[]>([]);
  const [memberMos, setMemberMos] = useState<string | null>(null);
  const [memberBranch, setMemberBranch] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [openSystem, setOpenSystem] = useState<string | null>(null);
  const [detailFor, setDetailFor] = useState<string | null>(null);
  const [freeText, setFreeText] = useState("");
  const [showFree, setShowFree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const chosen = useMemo(() => new Set(conditions.map((c) => c.label)), [conditions]);

  // The rail reuses the timeline that already prints on the packet — read-only
  // here, and only when there's service to draw.
  const railData: TimelineData = useMemo(() => {
    const byKey = new Map<string, { place: string; startYear: number; endYear: number | null; exposures: Set<string>; incidents: Set<string> }>();
    for (const t of tours) {
      if (!t.year) continue;
      const key = `${t.place}|${t.year}`;
      const e = byKey.get(key) ?? { place: t.place, startYear: t.year, endYear: null, exposures: new Set<string>(), incidents: new Set<string>() };
      for (const c of t.classes) e.exposures.add(c);
      for (const c of t.incidentClasses ?? []) e.incidents.add(c);
      byKey.set(key, e);
    }
    return {
      serviceStart: null,
      serviceEnd: null,
      tours: Array.from(byKey.values()).map((t) => ({ ...t, exposures: Array.from(t.exposures), incidents: Array.from(t.incidents) })),
      conditions: conditions.map((c) => ({
        label: c.label,
        onsetYear: c.onset_year,
        linkedExposures: (CONDITION_EXPOSURES[c.label] ?? []).filter((ec) => tours.some((t) => t.classes.includes(ec))),
      })),
    };
  }, [tours, conditions]);
  const groups = useMemo(() => conditionsBySystem(), []);
  const results = useMemo(() => searchConditions(q), [q]);
  const showsMentalHealth = conditions.some(
    (c) => CONDITION_BY_LABEL[c.label]?.system === MENTAL_HEALTH_SYSTEM,
  );

  async function memberId(): Promise<string | null> {
    const { data: u } = await supabase.auth.getUser();
    const authId = u.user?.id;
    if (!authId) return null;
    const { data: ex } = await supabase.from("members").select("id").eq("auth_id", authId).maybeSingle();
    if (ex?.id) return ex.id;
    const { data: cr } = await supabase.from("members").insert({ auth_id: authId }).select("id").single();
    return cr?.id ?? null;
  }

  async function load() {
    // Optional columns (migrations 0012/0013/0022) are read defensively so the
    // page works before they're applied.
    const full = await supabase
      .from("conditions")
      .select("id, label, claim_status, onset_year, onset_precision, evidence_status, secondary_to, diagnosed_by")
      .order("created_at");
    if (!full.error) {
      setConditions((full.data ?? []) as Condition[]);
    } else {
      const withoutDiagnosis = await supabase
        .from("conditions")
        .select("id, label, claim_status, onset_year, onset_precision, evidence_status, secondary_to")
        .order("created_at");
      if (!withoutDiagnosis.error) {
        setConditions(
          ((withoutDiagnosis.data ?? []) as Omit<Condition, "diagnosed_by">[]).map((c) => ({ ...c, diagnosed_by: null })),
        );
      } else {
        const basic = await supabase.from("conditions").select("id, label, claim_status").order("created_at");
        setConditions(
          ((basic.data ?? []) as { id: string; label: string; claim_status: string }[]).map((c) => ({
            ...c, onset_year: null, onset_precision: null, evidence_status: null, secondary_to: null, diagnosed_by: null,
          })),
        );
      }
    }

    // MOS + branch power the noise-listing line (migration 0014, defensive).
    const mem = await supabase.from("members").select("mos, branch").maybeSingle();
    if (!mem.error && mem.data) {
      setMemberMos((mem.data.mos as string) ?? null);
      setMemberBranch((mem.data.branch as string) ?? null);
    } else if (mem.error) {
      const b = await supabase.from("members").select("branch").maybeSingle();
      if (!b.error && b.data) setMemberBranch((b.data.branch as string) ?? null);
    }

    // incidents (migration 0022) read defensively — join fails as a whole
    // query if the table doesn't exist yet, so fall back to exposures-only.
    let ci = (await supabase
      .from("check_ins")
      .select("place_name, date_start, notes, exposures(exposure_class), incidents(incident_class)")
      .order("date_start")).data as CheckRow[] | null;
    if (ci === null) {
      const fallback = await supabase
        .from("check_ins")
        .select("place_name, date_start, notes, exposures(exposure_class)")
        .order("date_start");
      ci = ((fallback.data ?? []) as Omit<CheckRow, "incidents">[]).map((r) => ({ ...r, incidents: [] }));
    }
    setTours(
      ((ci ?? []) as CheckRow[]).map((r) => ({
        place: r.place_name || "a place you logged",
        year: r.date_start ? new Date(r.date_start).getUTCFullYear() : null,
        note: r.notes,
        classes: (r.exposures ?? []).map((e) => e.exposure_class),
        incidentClasses: (r.incidents ?? []).map((e) => e.incident_class),
      })),
    );
  }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user ?? null);
      setReady(true);
      if (data.user) await load();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function add(label: string) {
    if (chosen.has(label)) return;
    setBusy(true); setErr(null);
    const mid = await memberId();
    if (!mid) { setBusy(false); setErr("Couldn't find your record — try again."); return; }
    const { error } = await supabase.from("conditions").insert({ member_id: mid, label, claim_status: "none" });
    if (error) setErr(`Couldn't add that: ${error.message}`);
    else await load();
    setBusy(false);
  }

  async function remove(id: string) {
    setBusy(true);
    await supabase.from("conditions").delete().eq("id", id);
    await load();
    setBusy(false);
    if (detailFor === id) setDetailFor(null);
  }

  // Patch one condition. Unknown columns (pre-migration) fail loudly rather
  // than showing the veteran a value the packet won't have.
  async function patch(id: string, fields: Record<string, unknown>) {
    setErr(null);
    const { error } = await supabase.from("conditions").update(fields).eq("id", id);
    if (error) {
      setErr(
        /column .* does not exist/i.test(error.message)
          ? "This detail needs a database migration applied before it'll save."
          : `Couldn't save that: ${error.message}`,
      );
      return;
    }
    await load();
  }

  async function addFreeText() {
    const label = freeText.trim();
    if (!label) return;
    await add(label);
    setFreeText("");
    setShowFree(false);
  }

  if (!ready) return <p className="text-sm text-muted">Loading…</p>;
  if (!user) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6">
        <p className="text-sm text-muted">Sign in to build your health record.</p>
        <Link href="/" className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">← Go to sign in</Link>
      </div>
    );
  }

  const pill = (on: boolean) =>
    `rounded-xl border px-3 py-2.5 text-left text-[13px] leading-snug transition ${
      on ? "border-brand bg-brand text-white font-semibold" : "border-line bg-surface text-ink hover:border-brand/40 hover:bg-canvas"
    }`;

  return (
    <div className="space-y-5">
      {/* ── The rail: step 2 was where you were; this is what it did to you ─ */}
      {tours.length > 0 && (
        <section className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-bold text-ink">Your service &amp; your health</h2>
            <span className="text-xs text-muted">The years between are the story</span>
          </div>
          <div className="mt-3">
            <ServiceTimeline data={railData} compact />
          </div>
        </section>
      )}

      {/* ── Ask ─────────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-ink">What are you dealing with?</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Tap everything that applies — you can change any of it later. Start with what bothers you most;
          you don&apos;t have to know whether it&apos;s &ldquo;service connected.&rdquo; That&apos;s what
          the rest of this is for.
        </p>
      </div>

      {err && (
        <div role="status" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{err}</div>
      )}

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-4 w-4"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" /></svg>
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search — try “ringing”, “breathing”, “back”…"
          className="w-full rounded-xl border border-line bg-surface py-2.5 pl-9 pr-4 text-sm text-ink placeholder:text-faint focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/15"
        />
        {results.length > 0 && (
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {results.map((c) => (
              <button key={c.label} type="button" disabled={busy} aria-pressed={chosen.has(c.label)}
                onClick={() => add(c.label)} className={pill(chosen.has(c.label))}>
                {chosen.has(c.label) && <span className="mr-1 text-accent">✓</span>}
                {c.label}
                {c.alt && <span className="mt-0.5 block text-[11px] font-normal opacity-70">{c.alt}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── One tap for the common case ─────────────────────────────────── */}
      {!q && (
        <div>
          <div className="text-xs font-semibold text-ink">Most veterans start here</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {COMMON_STARTERS.filter((l) => !chosen.has(l)).map((l) => (
              <button
                key={l}
                type="button"
                disabled={busy}
                onClick={() => add(l)}
                className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] text-ink transition hover:border-brand hover:bg-brand/5 hover:text-brand"
              >
                + {l}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-faint">
            Not here? Search above, or open a body system below — there are far more.
          </p>
        </div>
      )}

      {/* ── Browse by body system ───────────────────────────────────────── */}
      {!q && (
        <div className="space-y-2">
          {groups.map((g) => {
            const open = openSystem === g.system;
            const picked = g.items.filter((i) => chosen.has(i.label)).length;
            return (
              <div key={g.system} className="overflow-hidden rounded-xl border border-line bg-surface">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenSystem(open ? null : g.system)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                    {g.system}
                    {picked > 0 && <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-label="you have items here" />}
                  </span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className={`h-4 w-4 flex-none text-muted transition-transform ${open ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6" /></svg>
                </button>
                {open && (
                  <div className="grid grid-cols-1 gap-2 border-t border-line p-3 sm:grid-cols-2">
                    {g.items.map((c) => (
                      <button key={c.label} type="button" disabled={busy} aria-pressed={chosen.has(c.label)}
                        onClick={() => add(c.label)} className={pill(chosen.has(c.label))}>
                        {chosen.has(c.label) && <span className="mr-1 text-accent">✓</span>}
                        {c.label}
                        {c.alt && <span className="mt-0.5 block text-[11px] font-normal opacity-70">{c.alt}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Something else — free text, kept verbatim */}
          {showFree ? (
            <div className="rounded-xl border border-accent/40 bg-accent/5 p-3">
              <label className="text-xs font-semibold text-ink">In your own words — what is it called?</label>
              <div className="mt-2 flex gap-2">
                <input
                  autoFocus value={freeText} onChange={(e) => setFreeText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addFreeText(); if (e.key === "Escape") setShowFree(false); }}
                  placeholder="e.g. constrictive bronchiolitis with GERD"
                  className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-brand focus:outline-none"
                />
                <button onClick={addFreeText} disabled={!freeText.trim() || busy}
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-600 disabled:opacity-50">Add</button>
              </div>
              <p className="mt-1.5 text-[11px] text-faint">Kept exactly as you write it — your diagnosis, your words.</p>
            </div>
          ) : (
            <button onClick={() => setShowFree(true)}
              className="w-full rounded-xl border-2 border-dashed border-line py-3 text-sm font-semibold text-muted transition hover:border-brand hover:text-brand">
              ＋ Something else — type it yourself
            </button>
          )}
        </div>
      )}

      {/* ── Your list, with the connection ──────────────────────────────── */}
      {conditions.length > 0 && (
        <div className="space-y-3 border-t border-line pt-5">
          <h3 className="text-sm font-bold text-ink">What you&apos;ve told us</h3>

          {conditions.map((c) => {
            const m = matchCondition(c.label, c.onset_year, tours);
            const open = detailFor === c.id;
            const def = defFor(c.label);
            const others = conditions.filter((o) => o.id !== c.id);
            return (
              <div key={c.id} className="overflow-hidden rounded-xl border border-line bg-surface">
                <div className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="text-[15px] font-bold text-ink">{c.label}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                      {c.onset_year ? <span className="tabular-nums">since {c.onset_year}</span>
                        : c.onset_precision ? <span>{PRECISION.find((p) => p.v === c.onset_precision)?.label}</span>
                        : <span className="text-faint">no start date yet</span>}
                      {c.evidence_status === "documented" && <span className="rounded bg-success-soft px-1.5 py-0.5 font-medium text-success">in writing</span>}
                      {c.diagnosed_by && c.diagnosed_by !== "not_yet" && <span className="rounded bg-success-soft px-1.5 py-0.5 font-medium text-success">diagnosed</span>}
                      {c.diagnosed_by === "not_yet" && <span className="rounded bg-warn-soft px-1.5 py-0.5 font-medium text-warn">needs diagnosis</span>}
                      {c.claim_status !== "none" && <span className="rounded bg-canvas px-1.5 py-0.5">claim {c.claim_status}</span>}
                      {!def && <span className="text-faint">your words</span>}
                    </div>
                  </div>
                  <button onClick={() => remove(c.id)} aria-label={`Remove ${c.label}`}
                    className="flex-none text-xs text-faint transition hover:text-red-600">remove</button>
                </div>

                {/* The connection — a sentence, never a badge */}
                <div className="px-4 pb-4">
                  {m.kind === "place" && (
                    <div className="rounded-r-lg border-l-2 border-accent bg-accent/5 px-3 py-2.5">
                      {m.quote && (
                        <p className="mb-1.5 text-[12px] italic leading-relaxed text-muted">
                          You wrote: &ldquo;{m.quote}&rdquo;
                        </p>
                      )}
                      <p className="text-[13px] leading-relaxed text-ink">{m.sentence}</p>
                      {m.ask && <p className="mt-2 whitespace-pre-line text-[12px] font-semibold leading-relaxed text-accent">→ {m.ask}</p>}
                      {/* §1120(b)(1): the presumptive is asthma DIAGNOSED AFTER
                          SERVICE — honor the qualifier we have the data for. */}
                      {c.label === "Asthma" && asthmaPostServiceNote(c.onset_precision) && (
                        <p className="mt-2 rounded-md border border-warn/30 bg-warn-soft px-2.5 py-2 text-[12px] leading-relaxed text-ink">
                          {asthmaPostServiceNote(c.onset_precision)}
                        </p>
                      )}
                    </div>
                  )}
                  {m.kind === "incident" && (
                    <div className="rounded-r-lg border-l-2 border-accent bg-accent/5 px-3 py-2.5">
                      {m.quote && (
                        <p className="mb-1.5 text-[12px] italic leading-relaxed text-muted">
                          You wrote: &ldquo;{m.quote}&rdquo;
                        </p>
                      )}
                      <p className="text-[13px] leading-relaxed text-ink">{m.sentence}</p>
                    </div>
                  )}
                  {m.kind === "event" && (() => {
                    // Tinnitus / Hearing loss get the VA's own noise-listing
                    // line — the event-side version of "documented at your base."
                    if (!NOISE_CONDITIONS.has(c.label)) {
                      return (
                        <div className="rounded-r-lg border-l-2 border-line bg-canvas px-3 py-2.5">
                          <p className="text-[13px] leading-relaxed text-muted">{m.sentence}</p>
                        </div>
                      );
                    }
                    const hit = mosNoiseLookup(memberMos, memberBranch);
                    if (hit) {
                      return (
                        <div className="rounded-r-lg border-l-2 border-accent bg-accent/5 px-3 py-2.5">
                          <p className="text-[13px] leading-relaxed text-ink">
                            One more dot: your job code — {hit.code}, {hit.title} ({memberBranch}) — appears on the
                            VA&apos;s own Duty MOS Noise Exposure Listing, marked{" "}
                            <strong>&ldquo;{hit.rating}&rdquo;</strong> for hazardous noise. That&apos;s the same
                            table VA raters check for tinnitus and hearing loss. It rates the job, not your claim —
                            bring it to your VSO and mention the listing by name.
                            {(hit.rating === "Low" || hit.rating === "Moderate") &&
                              " A lower rating has never closed the door — a specific event you can describe (ranges, the flight line, a blast) still counts, and your own account is evidence."}
                          </p>
                          <p className="mt-1.5 text-[11px] leading-relaxed text-faint">
                            Held more than one job? The listing rates each one — tell your VSO all of them.
                            This listing was {MOS_NOISE_REVIEWED}. Your job code is as you reported it — check it against DD-214 Block 11.
                          </p>
                        </div>
                      );
                    }
                    return (
                      <div className="rounded-r-lg border-l-2 border-line bg-canvas px-3 py-2.5">
                        <p className="text-[13px] leading-relaxed text-muted">{m.sentence}</p>
                        <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
                          {memberMos
                            ? "Your job code isn't in the part of the VA's noise listing this app carries — which says nothing about the full listing or your claim. Ask your VSO to look it up by name: the Duty MOS Noise Exposure Listing."
                            : <>Have a job code (MOS / Rate / AFSC)? Add it in <Link href="/account" className="font-semibold text-brand hover:underline">Account</Link> — the VA keeps a noise-exposure listing by job code that matters for hearing claims.</>}
                        </p>
                      </div>
                    );
                  })()}
                  {m.kind === "none" && (
                    <div className="rounded-r-lg border-l-2 border-line bg-canvas px-3 py-2.5">
                      <p className="text-[13px] leading-relaxed text-muted">{m.sentence}</p>
                    </div>
                  )}
                  {m.kind === "no-locations" && (
                    <div className="rounded-r-lg border-l-2 border-brand bg-brand/5 px-3 py-2.5">
                      <p className="text-[13px] leading-relaxed text-ink">
                        Where were you when this started? Putting it on the map is what draws the connection.
                      </p>
                      <Link href="/map" className="mt-2 inline-block text-[12px] font-semibold text-brand hover:underline">
                        → Add where you served
                      </Link>
                    </div>
                  )}

                  <button onClick={() => setDetailFor(open ? null : c.id)} aria-expanded={open}
                    className="mt-2.5 text-xs font-semibold text-brand hover:underline">
                    {open ? "Hide details" : c.onset_year || c.evidence_status ? "Edit details" : "Add details (optional)"}
                  </button>
                </div>

                {/* Optional detail sheet — skippable, one question per line */}
                {open && (
                  <div className="space-y-4 border-t border-line bg-canvas p-4">
                    <div>
                      <div className="text-xs font-semibold text-ink">Has a doctor diagnosed this?</div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-faint">
                        VA calls this element one — a current diagnosis. A condition you named yourself is real, but
                        a rater still needs to see this answered before the claim can move.
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {DIAGNOSIS.map((d) => (
                          <button key={d.v} type="button" aria-pressed={c.diagnosed_by === d.v}
                            onClick={() => patch(c.id, { diagnosed_by: d.v })}
                            className={`rounded-full border px-3 py-1.5 text-xs transition ${c.diagnosed_by === d.v ? "border-brand bg-brand/10 font-semibold text-brand" : "border-line text-muted hover:bg-surface"}`}>
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-ink">About when did this start?</div>
                      <p className="mt-0.5 text-[11px] text-faint">Roughly is fine. This is what puts it on your timeline.</p>
                      <div className="mt-2 flex flex-wrap items-start gap-2">
                        <div className="w-20">
                          <WheelPicker
                            options={ONSET_YEARS}
                            index={c.onset_year ? c.onset_year - 1940 : ONSET_YEARS.length - 1}
                            onChange={(i) => patch(c.id, { onset_year: 1940 + i, onset_precision: "year" })}
                            ariaLabel="Year it started"
                          />
                        </div>
                        {PRECISION.map((p) => (
                          <button key={p.v} type="button" aria-pressed={c.onset_precision === p.v}
                            onClick={() => patch(c.id, { onset_precision: p.v, onset_year: null })}
                            className={`rounded-full border px-3 py-1.5 text-xs transition ${c.onset_precision === p.v ? "border-brand bg-brand/10 font-semibold text-brand" : "border-line text-muted hover:bg-surface"}`}>
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-ink">VA wants paper. Do you have any yet?</div>
                      <p className="mt-0.5 text-[11px] text-faint">No wrong answer — this just tells a VSO where to start.</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {EVIDENCE.map((e) => (
                          <button key={e.v} type="button" aria-pressed={c.evidence_status === e.v}
                            onClick={() => patch(c.id, { evidence_status: e.v })}
                            className={`rounded-full border px-3 py-1.5 text-xs transition ${c.evidence_status === e.v ? "border-brand bg-brand/10 font-semibold text-brand" : "border-line text-muted hover:bg-surface"}`}>
                            {e.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-ink">Is VA already paying on this?</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {CLAIMS.map((s) => (
                          <button key={s.v} type="button" aria-pressed={c.claim_status === s.v}
                            onClick={() => patch(c.id, { claim_status: s.v })}
                            className={`rounded-full border px-3 py-1.5 text-xs transition ${c.claim_status === s.v ? "border-brand bg-brand/10 font-semibold text-brand" : "border-line text-muted hover:bg-surface"}`}>
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* The cascade — the thing this app is named after */}
                    {others.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-ink">Did this come from another one of these?</div>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-faint">
                          Sleep apnea that came from PTSD. Reflux that came from the lung injury. VA calls this
                          &ldquo;secondary&rdquo; — it&apos;s how a lot of claims are actually won, and it&apos;s
                          the cascade this whole app is named after.
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button type="button" aria-pressed={!c.secondary_to}
                            onClick={() => patch(c.id, { secondary_to: null })}
                            className={`rounded-full border px-3 py-1.5 text-xs transition ${!c.secondary_to ? "border-brand bg-brand/10 font-semibold text-brand" : "border-line text-muted hover:bg-surface"}`}>
                            On its own
                          </button>
                          {others.map((o) => (
                            <button key={o.id} type="button" aria-pressed={c.secondary_to === o.id}
                              onClick={() => patch(c.id, { secondary_to: o.id })}
                              className={`rounded-full border px-3 py-1.5 text-xs transition ${c.secondary_to === o.id ? "border-brand bg-brand/10 font-semibold text-brand" : "border-line text-muted hover:bg-surface"}`}>
                              came from {o.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {m.classes && m.classes.length > 0 && (
                      <p className="text-[11px] leading-relaxed text-faint">
                        Documented at your locations: {m.classes.map((x) => EXPOSURE_LABEL[x] ?? x).join(", ")}.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <Link href="/report" className="mt-1 block rounded-xl bg-brand px-4 py-3 text-center text-sm font-bold text-brand-foreground transition hover:bg-brand-600">
            See this in your claim packet →
          </Link>
        </div>
      )}

      {/* Quiet, never alarming — only when it's relevant */}
      {showsMentalHealth && (
        <div className="rounded-xl border border-scarlet/30 bg-scarlet/5 px-4 py-3">
          <p className="text-[13px] leading-relaxed text-ink">
            If putting this down stirred something up, you don&apos;t have to sit with it alone.
            The Veterans Crisis Line is <a href="tel:988" className="font-bold text-scarlet hover:underline">988, then press 1</a> — any hour.
          </p>
        </div>
      )}

      <p className="border-t border-line pt-4 text-xs leading-relaxed text-faint">
        Everything here is what you told us — it prints in your packet as <strong>veteran-reported</strong>, which is
        exactly what it is. These connections are associations to investigate, not a diagnosis and not a promise
        about a claim. Dates, locations, and your service details decide presumptive status, and only VA decides it.
        Bring this to an accredited VSO (Veterans Service Officer — free help) and your clinician.
      </p>
    </div>
  );
}
