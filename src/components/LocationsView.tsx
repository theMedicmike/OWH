"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { EXPOSURE_LABEL } from "@/lib/education";
import { EXPOSURE_BASIS } from "@/lib/citations";
import MonthYearWheel from "./MonthYearWheel";

// check_ins has no precision column, so a year-only save (stamped Jan 1 /
// Dec 31 by convention) and a genuine "arrived January 1st" / "left December
// 31st" are stored identically. Reading either boundary date back as "not
// sure" is wrong far less often than reading every year-only save back as a
// fake precise month — same tradeoff bootCamp.ts accepts, applied here
// because this screen can otherwise silently DESTROY a real month a veteran
// already entered on the map (an unconditional overwrite used to wipe it).
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
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [edStart, setEdStart] = useState("");
  const [edStartMonth, setEdStartMonth] = useState(0);
  const [edEnd, setEdEnd] = useState("");
  const [edEndMonth, setEdEndMonth] = useState(0);
  const [edHasEnd, setEdHasEnd] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user ?? null);
      if (!data.user) { setLoaded(true); return; }
      const { data: ci } = await supabase
        .from("check_ins")
        .select("id, place_name, date_start, date_end, conflict, notes, exposures(exposure_class, confirmed)")
        .order("date_start", { ascending: true });
      setRows((ci ?? []) as Row[]);
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

  async function remove(id: string) {
    await supabase.from("check_ins").delete().eq("id", id);
    setRows((prev) => prev.filter((x) => x.id !== id));
    setConfirmDel(null);
  }

  function startEdit(r: Row) {
    setEditId(r.id);
    const ds = r.date_start ? new Date(r.date_start) : null;
    const de = r.date_end ? new Date(r.date_end) : null;
    setEdStart(yearOf(r.date_start)?.toString() ?? String(new Date().getUTCFullYear()));
    setEdStartMonth(monthOrUnsure(ds, 1, 1));
    setEdHasEnd(!!r.date_end);
    setEdEnd(yearOf(r.date_end)?.toString() ?? String(new Date().getUTCFullYear()));
    setEdEndMonth(monthOrUnsure(de, 12, 31));
  }
  async function saveDates(id: string) {
    const sy = parseInt(edStart, 10);
    const date_start = sy
      ? (edStartMonth >= 1 && edStartMonth <= 12 ? `${sy}-${String(edStartMonth).padStart(2, "0")}-01` : `${sy}-01-01`)
      : null;
    let date_end: string | null = null;
    if (edHasEnd) {
      const ey = parseInt(edEnd, 10);
      date_end = ey
        ? (edEndMonth >= 1 && edEndMonth <= 12 ? `${ey}-${String(edEndMonth).padStart(2, "0")}-01` : `${ey}-12-31`)
        : null;
    }
    await supabase.from("check_ins").update({ date_start, date_end }).eq("id", id);
    setRows((prev) => prev.map((x) => (x.id === id ? { ...x, date_start, date_end } : x)));
    setEditId(null);
  }

  if (!loaded) return <p className="text-sm text-muted">Loading…</p>;
  if (!user) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6">
        <p className="text-sm text-muted">Sign in to see your locations.</p>
        <Link href="/" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">← Go to sign in</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Every place you&apos;ve logged. Tap a location to learn its background, review the documented
        exposures tied to it, or remove it from your record.
      </p>

      {rows.length > 0 && (
        <div className="rounded-lg border-l-2 border-accent bg-accent/5 px-3.5 py-2.5 text-xs leading-relaxed text-muted">
          <span className="font-semibold text-ink">How long you were somewhere matters.</span> A brief stop is
          weighed differently than a long assignment. Set your arrival and departure years on each location so your
          record — and your claim — stays accurate and credible.
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-6 text-center">
          <p className="text-sm text-muted">No locations yet.</p>
          <Link href="/map" className="mt-3 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-600">
            Map where you served
          </Link>
        </div>
      ) : (
        rows.map((r) => {
          const classes = Array.from(new Set((r.exposures ?? []).map((e) => e.exposure_class)));
          const confirmedSet = new Set((r.exposures ?? []).filter((e) => e.confirmed).map((e) => e.exposure_class));
          const ys = yearOf(r.date_start);
          const ye = yearOf(r.date_end);
          const range = ys || ye ? `${ys ?? "?"}${ye && ye !== ys ? `–${ye}` : ""}` : null;
          return (
            <div key={r.id} className="overflow-hidden rounded-xl border border-line bg-surface">
              <div className="h-1 bg-accent" />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-ink">{r.place_name || "A logged location"}</div>
                    <div className="text-xs text-muted">
                      {[range, durationLabel(ys, ye), r.conflict].filter(Boolean).join(" · ") || "Year not set"}
                    </div>
                  </div>
                </div>

                {/* How long were you here? — duration nuance */}
                {editId === r.id ? (
                  <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <div className="text-xs font-medium text-ink">Arrived</div>
                        <div className="mt-1">
                          <MonthYearWheel month={edStartMonth} year={parseInt(edStart) || new Date().getUTCFullYear()} onMonthChange={setEdStartMonth} onYearChange={(y) => setEdStart(String(y))} />
                        </div>
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-xs font-medium text-ink">
                          <input type="checkbox" checked={edHasEnd} onChange={(e) => setEdHasEnd(e.target.checked)} />
                          Departed
                        </label>
                        {edHasEnd && (
                          <div className="mt-1">
                            <MonthYearWheel month={edEndMonth} year={parseInt(edEnd) || new Date().getUTCFullYear()} onMonthChange={setEdEndMonth} onYearChange={(y) => setEdEnd(String(y))} minYear={parseInt(edStart) || 1945} />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => saveDates(r.id)} className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground hover:bg-brand-600">Save</button>
                      <button onClick={() => setEditId(null)} className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-muted hover:bg-canvas">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => startEdit(r)} className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                      <path d="M12 6v6l4 2M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z" />
                    </svg>
                    {ye && ye !== ys ? "Edit how long you were here" : "Set how long you were here"}
                  </button>
                )}

                {classes.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {classes.map((c) => {
                      const isConfirmed = confirmedSet.has(c);
                      return (
                        <span
                          key={c}
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs ${
                            isConfirmed ? "bg-success-soft text-success" : "bg-brand/5 text-brand"
                          }`}
                        >
                          {isConfirmed && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                          )}
                          {EXPOSURE_LABEL[c] ?? c}
                        </span>
                      );
                    })}
                  </div>
                )}

                {classes.length > 0 && (
                  <div className="mt-3 space-y-1 border-l-2 border-line pl-3">
                    {classes.map((c) => (
                      <p key={c} className="text-xs leading-relaxed text-muted">
                        <span className="font-semibold text-ink">{EXPOSURE_LABEL[c] ?? c}:</span>{" "}
                        {EXPOSURE_BASIS[c] ?? "ATSDR toxicological profile."}
                      </p>
                    ))}
                  </div>
                )}

                {r.notes && <p className="mt-3 text-xs italic text-muted">{r.notes}</p>}

                {/* Background */}
                {info[r.id] ? (
                  <div className="mt-4 rounded-lg bg-canvas p-4">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-accent">The history of this ground</div>
                    <div className="mt-1.5 space-y-2">
                      {info[r.id].split(/\n{2,}/).map((para, k) => (
                        <p key={k} className="text-sm leading-relaxed text-ink">{para}</p>
                      ))}
                    </div>
                    <p className="mt-2 text-[11px] text-faint">General history drawn from the historical record — confirm specific dates and details independently.</p>
                  </div>
                ) : (
                  <button
                    onClick={() => loadInfo(r)}
                    disabled={infoBusy === r.id}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-brand transition hover:border-brand/40 hover:bg-brand/5 disabled:opacity-60"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
                    </svg>
                    {infoBusy === r.id ? "Loading…" : "Learn about this place"}
                  </button>
                )}

                {/* Remove */}
                <div className="mt-4 border-t border-line pt-3">
                  {confirmDel === r.id ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted">Remove this location? This can&apos;t be undone.</span>
                      <button onClick={() => remove(r.id)} className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700">
                        Remove
                      </button>
                      <button onClick={() => setConfirmDel(null)} className="rounded-md border border-line px-3 py-1 text-xs font-medium text-muted hover:bg-canvas">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDel(r.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:underline"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      Remove from my profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
