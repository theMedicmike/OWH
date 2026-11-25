"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import type { Site } from "./MapView";
import { searchGazetteer, bootCampsFor, type GazEntry } from "@/lib/gazetteer";
import { EXPOSURES, EXPOSURE_LABEL } from "@/lib/education";
import { isMissingColumnError } from "@/lib/supabaseErrors";
import { wkbToLngLat } from "@/lib/geom";

// Add a place you served without touching the map: search, tap Add, pick the
// year. Picking the year is the save.
//
// The year is the one thing asked, because a place goes on the timeline and is
// checked against presumptive date windows; the app never invents one. It is
// stored as approximate. A documented exposure site carries what the
// government documents there, the same pre-selection the map makes when you
// tap a site dot, and the panel says so before anything is saved. Everything
// else (month, end date, his own story, anything personal he was around) is
// left for the map, never guessed.
const THIS_YEAR = new Date().getUTCFullYear();
const YEARS = Array.from({ length: THIS_YEAR - 1940 + 1 }, (_, i) => THIS_YEAR - i);
const VALID_EXPOSURES = new Set<string>(EXPOSURES.map((e) => e.value));

type Place = GazEntry & { documented: string[]; unpinned?: boolean };

export default function PlaceQuickAdd({ sites }: { sites: Site[] }) {
  const { user, supabase } = useAuth();
  const [q, setQ] = useState("");
  const [branch, setBranch] = useState<string | null>(null);
  const [mine, setMine] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<{ name: string; year: number } | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      const m = await supabase.from("members").select("branch").eq("auth_id", user.id).maybeSingle();
      const ci = await supabase.from("check_ins").select("place_name");
      if (!alive) return;
      setBranch((m.data?.branch as string) ?? null);
      setMine(new Set(((ci.data ?? []) as { place_name: string | null }[]).map((r) => (r.place_name ?? "").toLowerCase()).filter(Boolean)));
    })();
    return () => { alive = false; };
  }, [user, supabase]);

  // Documented sites, as searchable entries, each carrying what is documented there.
  const siteByName = useMemo(() => {
    const m = new Map<string, Site>();
    for (const s of sites) m.set(s.name, s);
    return m;
  }, [sites]);
  const siteEntries = useMemo<GazEntry[]>(
    () => sites.flatMap((s) => {
      const ll = wkbToLngLat(s.geom);
      return ll ? [{ name: s.name, region: "Documented exposure site", lat: ll[1], lng: ll[0] }] : [];
    }),
    [sites],
  );
  const withDocs = (e: GazEntry): Place => ({
    ...e,
    documented: Array.from(new Set((siteByName.get(e.name)?.exposure_classes ?? []).filter((c) => VALID_EXPOSURES.has(c)))),
  });

  const query = q.trim();
  const rows: Place[] = useMemo(() => {
    if (query.length >= 2) return searchGazetteer(query, siteEntries, 12).map(withDocs);
    return bootCampsFor(branch).map(withDocs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, siteEntries, branch, siteByName]);
  const exact = rows.some((r) => r.name.toLowerCase() === query.toLowerCase());

  async function save(p: Place, year: number) {
    if (!user) return;
    setBusy(true);
    setErr("");
    const { data: newId, error } = await supabase.rpc("log_check_in", {
      p_lng: p.unpinned ? 0 : p.lng,
      p_lat: p.unpinned ? 0 : p.lat,
      p_year: year,
      p_conflict: null,
      p_exposures: p.documented,
      p_incidents: [],
    });
    if (error || !newId) {
      setBusy(false);
      setErr("That did not save. Try again in a moment.");
      return;
    }
    const patch: Record<string, string> = { place_name: p.name, date_start_precision: "approximate" };
    if (p.unpinned) patch.notes = "Location not yet pinned on the map.";
    let { error: patchErr } = await supabase.from("check_ins").update(patch).eq("id", newId);
    if (patchErr && isMissingColumnError(patchErr)) {
      const { date_start_precision: _d, ...core } = patch;
      void _d;
      ({ error: patchErr } = await supabase.from("check_ins").update(core).eq("id", newId));
    }
    setBusy(false);
    if (patchErr) { setErr("The place saved, but its name did not. Open Your locations to fix it."); return; }
    setMine((prev) => new Set(prev).add(p.name.toLowerCase()));
    setOpen(null);
    setSaved({ name: p.name, year });
  }

  if (!user) return null;

  const renderRow = (p: Place) => {
    const key = `${p.name}|${p.region}`;
    const isOpen = open === key;
    const has = mine.has(p.name.toLowerCase());
    return (
      <div key={key} className="border-t border-line first:border-t-0">
        <div className="row">
          <span className="min-w-0 flex-1">
            <span className="block text-[0.9375rem] font-semibold leading-snug">{p.unpinned ? <>&ldquo;{p.name}&rdquo;</> : p.name}</span>
            <span className="mt-0.5 block text-sm leading-snug text-muted">
              {p.unpinned ? "Add it as you typed it. Pin it on the map later if you like." : p.region}
            </span>
          </span>
          {has && !isOpen ? (
            <span className="flex min-h-11 flex-none items-center gap-1.5 px-2 text-[0.9375rem] font-semibold text-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true"><path d="m5 12 4 4L19 7" /></svg>
              Added
            </span>
          ) : (
            <button
              type="button"
              onClick={() => { setOpen(isOpen ? null : key); setSaved(null); setErr(""); }}
              aria-expanded={isOpen}
              className={`btn min-w-[5.5rem] flex-none ${isOpen ? "btn-ghost" : "btn-secondary"}`}
            >
              {isOpen ? "Cancel" : "Add"}
            </button>
          )}
        </div>
        {isOpen && (
          <div className="border-t border-line bg-canvas px-4 pb-4 pt-3">
            {p.documented.length > 0 && (
              <p className="mb-3 text-[0.9375rem] leading-relaxed text-ink">
                What the government documents here is noted with it:{" "}
                <span className="font-semibold">{p.documented.map((c) => EXPOSURE_LABEL[c] ?? c).join(", ")}</span>.
                You can change that on the map.
              </p>
            )}
            <label htmlFor={`year-${key}`} className="field-label">About what year did you get there? Picking it saves it.</label>
            <select
              id={`year-${key}`}
              defaultValue=""
              disabled={busy}
              onChange={(e) => { if (e.target.value) save(p, parseInt(e.target.value, 10)); }}
              className="field"
            >
              <option value="">Choose a year</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <p className="mt-1.5 text-sm text-muted">Your best guess is fine. It is saved as approximate.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="display text-[1.75rem] text-ink sm:text-[2rem]">Where did you serve?</h2>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
          Search a base, port, or deployment. Tap Add, pick the year, and it is on your record. Add every place you
          can think of.
        </p>
      </div>

      <div className="sticky top-16 z-10 -mx-1 bg-canvas/95 px-1 py-1 backdrop-blur">
        <label htmlFor="place-search" className="sr-only">Search places</label>
        <input
          id="place-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search, e.g. Fort Bragg, Balad, Camp Lejeune"
          className="field"
          autoComplete="off"
        />
      </div>

      {saved && (
        <div className="rounded-2xl border border-success/30 bg-success-soft px-4 py-3" aria-live="polite">
          <p className="text-[0.9375rem] font-semibold text-success">{saved.name} is on your record, around {saved.year}.</p>
          <p className="mt-1 text-[0.9375rem] text-ink">
            Add the next one, or <Link href="/locations" className="font-semibold text-brand hover:underline">see all your places</Link>.
          </p>
        </div>
      )}
      {err && <p role="alert" className="text-[0.9375rem] font-medium text-scarlet">{err}</p>}

      {query.length < 2 && rows.length > 0 && (
        <h3 className="text-lg font-semibold tracking-tight text-ink">Where you trained</h3>
      )}
      {(rows.length > 0 || (query.length >= 2 && !exact)) && (
        <div className="card overflow-hidden">
          {rows.map(renderRow)}
          {query.length >= 2 && !exact && renderRow({ name: query, region: "", lat: 0, lng: 0, documented: [], unpinned: true })}
        </div>
      )}
      {query.length < 2 && rows.length === 0 && (
        <p className="text-[0.9375rem] text-muted">Type at least two letters of a base, city, or country.</p>
      )}
    </section>
  );
}
