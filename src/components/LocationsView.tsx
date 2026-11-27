"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useUndo } from "./Keep";
import { EXPOSURE_LABEL } from "@/lib/education";
import { EXPOSURE_BASIS } from "@/lib/citations";
import MonthYearWheel from "./MonthYearWheel";
import { isMissingColumnError } from "@/lib/supabaseErrors";
import { daysInMonth } from "@/lib/serviceDates";

// Rows written before migration 0023 (or read before it's applied) carry no
// date_*_precision at all, so a year-only save (stamped Jan 1 / Dec 31 by
// convention) and a genuine "arrived January 1st" / "left December 31st" are
// stored identically. Reading either boundary date back as "not sure" is
// wrong far less often than reading every year-only save back as a fake
// precise month — same tradeoff bootCamp.ts accepts, applied here because
// this screen can otherwise silently DESTROY a real month a veteran already
// entered on the map (an unconditional overwrite used to wipe it).
function monthOrUnsure(d: Date | null, boundaryMonth: number, boundaryDay: number): number {
  if (!d) return 0;
  if (d.getUTCMonth() + 1 === boundaryMonth && d.getUTCDate() === boundaryDay) return 0;
  return d.getUTCMonth() + 1;
}

type Expo = { exposure_class: string; confirmed: boolean };
type Row = {
  id: string;
  place_name: string | null;
  date_start: string | null;
  date_end: string | null;
  date_start_precision?: string | null;
  date_end_precision?: string | null;
  conflict: string | null;
  notes: string | null;
  exposures: Expo[] | null;
};

function yearOf(d: string | null) {
  return d ? new Date(d).getUTCFullYear() : null;
}

// A plain-English sense of how long the veteran was somewhere. Duration matters:
// a brief stop is weighed differently than a long assignment, and being honest
// about it keeps the record credible.
function durationLabel(sy: number | null, ey: number | null): string | null {
  if (!sy) return null;
  if (!ey || ey === sy) return null; // single year — we can't infer a span
  const yrs = ey - sy;
  if (yrs <= 0) return null;
  if (yrs === 1) return "about a year";
  return `about ${yrs} years`;
}

export default function LocationsView() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [info, setInfo] = useState<Record<string, string>>({});
  const [infoBusy, setInfoBusy] = useState<string | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);
  const { offer } = useUndo();
  const [editId, setEditId] = useState<string | null>(null);
  const [edStart, setEdStart] = useState("");
  const [edStartMonth, setEdStartMonth] = useState(0);
  const [edStartDay, setEdStartDay] = useState(0);
  const [edStartApprox, setEdStartApprox] = useState(false);
  const [edEnd, setEdEnd] = useState("");
  const [edEndMonth, setEdEndMonth] = useState(0);
  const [edEndDay, setEdEndDay] = useState(0);
  const [edEndApprox, setEdEndApprox] = useState(false);
  const [edHasEnd, setEdHasEnd] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user ?? null);
      if (!data.user) { setLoaded(true); return; }
      // date_*_precision (migration 0023) read defensively — fall back to the
      // plain columns if it hasn't landed yet.
      const withPrecision = await supabase
        .from("check_ins")
        .select("id, place_name, date_start, date_end, date_start_precision, date_end_precision, conflict, notes, exposures(exposure_class, confirmed)")
        .order("date_start", { ascending: true });
      if (!withPrecision.error) {
        setRows((withPrecision.data ?? []) as Row[]);
      } else {
        const fallback = await supabase
          .from("check_ins")
          .select("id, place_name, date_start, date_end, conflict, notes, exposures(exposure_class, confirmed)")
          .order("date_start", { ascending: true });
        setRows((fallback.data ?? []) as Row[]);
      }
      setLoaded(true);
    });
  }, [supabase]);

  async function loadInfo(r: Row) {
    if (!r.place_name || info[r.id] || infoBusy) return;
    setInfoBusy(r.id);
    try {
      const res = await fetch("/api/base-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: r.place_name }),
      });
      const { text } = await res.json();
      setInfo((p) => ({ ...p, [r.id]: text || "We don't have background on this place yet." }));
    } catch {
      setInfo((p) => ({ ...p, [r.id]: "Couldn't load background just now." }));
    } finally {
      setInfoBusy(null);
    }
  }

  // Remove is held behind the Undo bar: the row hides at once and the check-in
  // is only deleted when the bar closes.
  function remove(r: Row) {
    setHidden((h) => [...h, r.id]);
    if (editId === r.id) setEditId(null);
    offer({
      message: `Removed: ${r.place_name || "a logged location"}.`,
      commit: async () => {
        const { error } = await supabase.from("check_ins").delete().eq("id", r.id);
        if (!error) setRows((prev) => prev.filter((x) => x.id !== r.id));
        setHidden((h) => h.filter((x) => x !== r.id));
      },
      undo: () => setHidden((h) => h.filter((x) => x !== r.id)),
    });
  }

  function startEdit(r: Row) {
    setEditId(r.id);
    const ds = r.date_start ? new Date(r.date_start) : null;
    const de = r.date_end ? new Date(r.date_end) : null;
    setEdStart(yearOf(r.date_start)?.toString() ?? String(new Date().getUTCFullYear()));
    setEdStartApprox(r.date_start_precision === "approximate");
    setEdStartMonth(r.date_start_precision === "approximate" ? 0 : monthOrUnsure(ds, 1, 1));
    // "day" precision is a NEW explicit value (migration 0023) — no legacy
    // ambiguity like month has, since older rows simply never carry it.
    setEdStartDay(r.date_start_precision === "day" && ds ? ds.getUTCDate() : 0);
    setEdHasEnd(!!r.date_end);
    setEdEnd(yearOf(r.date_end)?.toString() ?? String(new Date().getUTCFullYear()));
    setEdEndApprox(r.date_end_precision === "approximate");
    setEdEndMonth(r.date_end_precision === "approximate" ? 0 : monthOrUnsure(de, 12, 31));
    setEdEndDay(r.date_end_precision === "day" && de ? de.getUTCDate() : 0);
  }
  async function saveDates(id: string) {
    const sy = parseInt(edStart, 10);
    const hasStartMonth = edStartMonth >= 1 && edStartMonth <= 12;
    const startDayClamped = hasStartMonth && edStartDay >= 1 && sy ? Math.min(edStartDay, daysInMonth(String(sy), String(edStartMonth))) : null;
    const date_start = sy
      ? `${sy}-${hasStartMonth ? String(edStartMonth).padStart(2, "0") : "01"}-${String(startDayClamped ?? 1).padStart(2, "0")}`
      : null;
    const date_start_precision = !sy ? null : edStartApprox ? "approximate" : startDayClamped ? "day" : hasStartMonth ? "month" : "year";
    let date_end: string | null = null;
    let date_end_precision: string | null = null;
    if (edHasEnd) {
      const ey = parseInt(edEnd, 10);
      const hasEndMonth = edEndMonth >= 1 && edEndMonth <= 12;
      const endDayClamped = hasEndMonth && edEndDay >= 1 && ey ? Math.min(edEndDay, daysInMonth(String(ey), String(edEndMonth))) : null;
      date_end = ey
        ? (hasEndMonth ? `${ey}-${String(edEndMonth).padStart(2, "0")}-${String(endDayClamped ?? 1).padStart(2, "0")}` : `${ey}-12-31`)
        : null;
      date_end_precision = !ey ? null : edEndApprox ? "approximate" : endDayClamped ? "day" : hasEndMonth ? "month" : "year";
    }
    let { error } = await supabase.from("check_ins").update({ date_start, date_end, date_start_precision, date_end_precision }).eq("id", id);
    if (error && isMissingColumnError(error)) {
      ({ error } = await supabase.from("check_ins").update({ date_start, date_end }).eq("id", id));
    }
    setRows((prev) => prev.map((x) => (x.id === id ? { ...x, date_start, date_end, date_start_precision, date_end_precision } : x)));
    setEditId(null);
  }

  if (!loaded) return <p className="text-[0.9375rem] text-muted">Loading…</p>;
  if (!user) {
    return (
      <div className="card p-6">
        <p className="text-[0.9375rem] text-muted">Sign in to see your locations.</p>
        <Link href="/" className="btn btn-primary mt-4">Go to sign in</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[0.9375rem] leading-relaxed text-muted">
        Every place you&apos;ve logged. Tap a location to learn its background, review the documented
        exposures tied to it, or remove it from your record.{" "}
        <Link href="/exposures" className="font-semibold text-brand hover:underline">See every exposure you ticked</Link>.
      </p>

      {rows.length > 0 && (
        <div className="rounded-xl border border-line bg-canvas px-4 py-3 text-[0.9375rem] leading-relaxed text-muted">
          <span className="font-semibold text-ink">How long you were somewhere matters.</span> A brief stop is
          weighed differently than a long assignment. Set your arrival and departure years on each location so your
          record, and your claim, stays accurate and credible.
        </div>
      )}

      {rows.filter((r) => !hidden.includes(r.id)).length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-[0.9375rem] text-muted">No locations yet.</p>
          <Link href="/map" className="btn btn-primary mt-4">
            Map where you served
          </Link>
        </div>
      ) : (
        rows.filter((r) => !hidden.includes(r.id)).map((r) => {
          const classes = Array.from(new Set((r.exposures ?? []).map((e) => e.exposure_class)));
          const confirmedSet = new Set((r.exposures ?? []).filter((e) => e.confirmed).map((e) => e.exposure_class));
          const ys = yearOf(r.date_start);
          const ye = yearOf(r.date_end);
          const range = ys || ye ? `${ys ?? "?"}${ye && ye !== ys ? `–${ye}` : ""}` : null;
          return (
            <div key={r.id} className="card p-5">
              <h2 className="text-lg font-semibold tracking-tight text-ink">{r.place_name || "A logged location"}</h2>
              <p className="mt-0.5 text-[0.9375rem] text-muted">
                {[range, durationLabel(ys, ye), r.conflict].filter(Boolean).join(", ") || "Year not set"}
              </p>

              {/* How long were you here? — duration nuance */}
              {editId === r.id ? (
                <div className="mt-4 rounded-xl border border-line bg-canvas p-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <span className="field-label">Arrived</span>
                      <MonthYearWheel month={edStartMonth} year={parseInt(edStart) || new Date().getUTCFullYear()} day={edStartDay} onMonthChange={setEdStartMonth} onYearChange={(y) => setEdStart(String(y))} onDayChange={setEdStartDay} approximate={edStartApprox} onApproximateChange={setEdStartApprox} />
                    </div>
                    <div>
                      <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-1 hover:bg-surface">
                        <input type="checkbox" checked={edHasEnd} onChange={(e) => setEdHasEnd(e.target.checked)} className="h-6 w-6 flex-none accent-brand" />
                        <span className="text-[0.9375rem] font-semibold text-ink">I know when I left</span>
                      </label>
                      {edHasEnd && (
                        <div className="mt-1">
                          <span className="field-label">Departed</span>
                          <MonthYearWheel month={edEndMonth} year={parseInt(edEnd) || new Date().getUTCFullYear()} day={edEndDay} onMonthChange={setEdEndMonth} onYearChange={(y) => setEdEnd(String(y))} onDayChange={setEdEndDay} minYear={parseInt(edStart) || 1945} approximate={edEndApprox} onApproximateChange={setEdEndApprox} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => saveDates(r.id)} className="btn btn-primary btn-lg">Save dates</button>
                    <button type="button" onClick={() => setEditId(null)} className="btn btn-secondary btn-lg">Cancel</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => startEdit(r)} className="btn btn-secondary mt-3">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                    <path d="M12 6v6l4 2M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z" />
                  </svg>
                  {ye && ye !== ys ? "Edit how long you were here" : "Set how long you were here"}
                </button>
              )}

              {classes.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-2" aria-label="Exposures at this place">
                  {classes.map((c) => {
                    const isConfirmed = confirmedSet.has(c);
                    return (
                      <li
                        key={c}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${
                          isConfirmed ? "bg-success-soft text-success" : "bg-brand/5 text-brand"
                        }`}
                      >
                        {isConfirmed && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        )}
                        {EXPOSURE_LABEL[c] ?? c}
                        {isConfirmed && <span className="sr-only">, confirmed</span>}
                      </li>
                    );
                  })}
                </ul>
              )}

              {classes.length > 0 && (
                <div className="mt-3 space-y-1.5 border-l-2 border-line pl-3">
                  {classes.map((c) => (
                    <p key={c} className="text-sm leading-relaxed text-muted">
                      <span className="font-semibold text-ink">{EXPOSURE_LABEL[c] ?? c}:</span>{" "}
                      {EXPOSURE_BASIS[c] ?? "ATSDR toxicological profile."}
                    </p>
                  ))}
                </div>
              )}

              {r.notes && <p className="mt-3 text-[0.9375rem] italic text-muted">{r.notes}</p>}

              {/* Background */}
              {info[r.id] ? (
                <div className="mt-4 rounded-xl bg-canvas p-4">
                  <h3 className="text-[0.9375rem] font-semibold text-ink">The history of this ground</h3>
                  <div className="mt-1.5 space-y-2">
                    {info[r.id].split(/\n{2,}/).map((para, k) => (
                      <p key={k} className="text-[0.9375rem] leading-relaxed text-ink">{para}</p>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-muted">General history drawn from the historical record. Confirm specific dates and details independently.</p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => loadInfo(r)}
                  disabled={infoBusy === r.id}
                  className="btn btn-secondary mt-3"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
                  </svg>
                  {infoBusy === r.id ? "Loading…" : "Learn about this place"}
                </button>
              )}

              {/* Remove */}
              <div className="mt-4 border-t border-line pt-3">
                <button
                  type="button"
                  onClick={() => remove(r)}
                  className="btn btn-ghost -ml-2 text-scarlet"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Remove from my profile
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
