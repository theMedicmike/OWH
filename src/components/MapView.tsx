"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export type Site = {
  name: string;
  status: string;
  geom: string | null;
  exposure_classes: string[] | null;
  date_from: string | null;
  date_to: string | null;
};

type CheckIn = {
  lng: number;
  lat: number;
  year: number | null;
  classes: string[];
  exposures: string;
  place: string;
};

type Row = {
  geom: string | null;
  date_start: string | null;
  place_name: string | null;
  exposures: { exposure_class: string }[] | null;
};

const STATUS_COLOR: Record<string, string> = {
  recognized: "#1D9E75",
  documented: "#BA7517",
  emerging: "#E24B4A",
};

const EXPOSURES = [
  { label: "Burn pits", value: "burn_pit" },
  { label: "Heavy metals", value: "heavy_metal" },
  { label: "Chemical / solvent", value: "chemical_solvent" },
  { label: "Water contamination", value: "water_contamination" },
  { label: "Pesticide / herbicide", value: "pesticide" },
  { label: "Asbestos / silica", value: "asbestos_silica" },
  { label: "Nerve agent", value: "nerve_agent" },
  { label: "Particulate / dust", value: "particulate" },
  { label: "Radiation / depleted uranium", value: "radiation" },
  { label: "PFAS / AFFF", value: "pfas_afff" },
  { label: "Gulf War agent", value: "gulf_war_agent" },
];

function fmt(lat: number, lng: number) {
  return `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? "N" : "S"}, ${Math.abs(lng).toFixed(1)}°${lng >= 0 ? "E" : "W"}`;
}

function labelFor(value: string) {
  return EXPOSURES.find((e) => e.value === value)?.label ?? value;
}

function yearOf(date: string | null): number | null {
  return date ? new Date(date).getUTCFullYear() : null;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const r = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
    );
    const j = await r.json();
    const parts = [j.locality || j.city, j.principalSubdivision, j.countryName].filter(Boolean);
    return Array.from(new Set(parts)).join(", ");
  } catch {
    return "";
  }
}

function wkbToLngLat(hex: string | null): [number, number] | null {
  if (typeof hex !== "string" || hex.length < 42) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  const view = new DataView(bytes.buffer);
  const le = bytes[0] === 1;
  const type = view.getUint32(1, le);
  let offset = 5;
  if (type & 0x20000000) offset += 4;
  const lng = view.getFloat64(offset, le);
  const lat = view.getFloat64(offset + 8, le);
  if (Number.isNaN(lng) || Number.isNaN(lat)) return null;
  return [lng, lat];
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function fetchCheckins(supabase: ReturnType<typeof createClient>): Promise<CheckIn[]> {
  const { data } = await supabase
    .from("check_ins")
    .select("geom, date_start, place_name, exposures(exposure_class)")
    .order("date_start", { ascending: false });
  const list: CheckIn[] = [];
  for (const row of (data ?? []) as Row[]) {
    const ll = wkbToLngLat(row.geom);
    if (!ll) continue;
    const classes = (row.exposures ?? []).map((e) => e.exposure_class);
    list.push({
      lng: ll[0],
      lat: ll[1],
      year: row.date_start ? new Date(row.date_start).getUTCFullYear() : null,
      classes,
      exposures: classes.length ? classes.map(labelFor).join(", ") : "—",
      place: row.place_name || fmt(ll[1], ll[0]),
    });
  }
  return list;
}

export default function MapView({ sites, user }: { sites: Site[]; user: User | null }) {
  const [supabase] = useState(() => createClient());
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const draftMarkerRef = useRef<maplibregl.Marker | null>(null);
  const siteMarkersRef = useRef<maplibregl.Marker[]>([]);
  const userMarkersRef = useRef<maplibregl.Marker[]>([]);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [draft, setDraft] = useState<{ lng: number; lat: number } | null>(null);
  const [draftName, setDraftName] = useState("");
  const [year, setYear] = useState(2007);
  const [selected, setSelected] = useState<string[]>([]);
  const [otherText, setOtherText] = useState("");
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [saving, setSaving] = useState(false);
  const [showLegend, setShowLegend] = useState(false);

  // map filters
  const [activeClasses, setActiveClasses] = useState<Set<string>>(new Set());
  const [yearOn, setYearOn] = useState(false);
  const [filterYear, setFilterYear] = useState(2007);

  function toggle(value: string) {
    setSelected((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  function toggleClass(value: string) {
    setActiveClasses((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  function closeDraft() {
    setDraft(null);
    setDraftName("");
    setSelected([]);
    setOtherText("");
  }

  function classMatch(classes: string[]) {
    if (activeClasses.size === 0) return true;
    return classes.some((c) => activeClasses.has(c));
  }

  // The flip: instead of asking the veteran to name the chemicals, read the
  // documented exposures from recognized sites near the dropped pin in that year,
  // and offer them to confirm. (~160km / one year window.)
  const suggestions = useMemo(() => {
    if (!draft) return { classes: [] as string[], sites: [] as string[] };
    const within: { name: string; classes: string[] }[] = [];
    for (const s of sites) {
      const ll = wkbToLngLat(s.geom);
      if (!ll) continue;
      if (haversineKm(draft.lat, draft.lng, ll[1], ll[0]) > 160) continue;
      const f = yearOf(s.date_from);
      const t = yearOf(s.date_to);
      if (f !== null && t !== null && !(f <= year && year <= t)) continue;
      within.push({ name: s.name, classes: s.exposure_classes ?? [] });
    }
    return {
      classes: Array.from(new Set(within.flatMap((w) => w.classes))),
      sites: Array.from(new Set(within.map((w) => w.name))),
    };
  }, [draft, year, sites]);

  // Seed the selection from suggestions when the pin is dropped, or when moving
  // the year reveals a different documented set. Manual edits are preserved while
  // the suggested set is unchanged.
  const suggestionKey = suggestions.classes.join(",");
  useEffect(() => {
    if (!draft) return;
    setSelected(suggestions.classes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, suggestionKey]);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [20, 25],
      zoom: 1.3,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), "bottom-right");
    map.on("load", () => setMapLoaded(true));
    map.on("click", (e) => setDraft({ lng: e.lngLat.lng, lat: e.lngLat.lat }));
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // reverse-geocode the dropped pin
  useEffect(() => {
    let active = true;
    if (!draft) {
      setDraftName("");
      return;
    }
    setDraftName("");
    reverseGeocode(draft.lat, draft.lng).then((name) => {
      if (active) setDraftName(name);
    });
    return () => {
      active = false;
    };
  }, [draft]);

  useEffect(() => {
    let active = true;
    if (!user) {
      setCheckins([]);
      return;
    }
    fetchCheckins(supabase).then((list) => {
      if (active) setCheckins(list);
    });
    return () => {
      active = false;
    };
  }, [user, supabase]);

  // render known-site markers (filtered)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    for (const m of siteMarkersRef.current) m.remove();
    siteMarkersRef.current = [];
    for (const s of sites) {
      const ll = wkbToLngLat(s.geom);
      if (!ll) continue;
      if (!classMatch(s.exposure_classes ?? [])) continue;
      if (yearOn) {
        const f = yearOf(s.date_from);
        const t = yearOf(s.date_to);
        if (f !== null && t !== null && !(f <= filterYear && filterYear <= t)) continue;
      }
      const el = document.createElement("div");
      el.style.cssText = `width:14px;height:14px;border-radius:50%;border:2px solid #fff;cursor:pointer;background:${STATUS_COLOR[s.status] ?? "#888780"};box-shadow:0 0 0 1px rgba(0,0,0,0.15)`;
      const m = new maplibregl.Marker({ element: el })
        .setLngLat(ll)
        .setPopup(
          new maplibregl.Popup({ offset: 16, maxWidth: "240px" }).setHTML(
            `<div style="font:14px system-ui;max-width:220px;line-height:1.35"><strong>${s.name}</strong><br><span style="color:${STATUS_COLOR[s.status] ?? "#888780"};text-transform:capitalize">${s.status}</span></div>`,
          ),
        )
        .addTo(map);
      siteMarkersRef.current.push(m);
    }
  }, [sites, mapLoaded, activeClasses, yearOn, filterYear]);

  // draft marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (draftMarkerRef.current) {
      draftMarkerRef.current.remove();
      draftMarkerRef.current = null;
    }
    if (draft) {
      const el = document.createElement("div");
      el.style.cssText =
        "width:18px;height:18px;border-radius:50%;border:3px solid #fff;background:#185FA5;box-shadow:0 0 0 1px rgba(0,0,0,0.25)";
      draftMarkerRef.current = new maplibregl.Marker({ element: el }).setLngLat([draft.lng, draft.lat]).addTo(map);
    }
  }, [draft]);

  // render check-in markers (filtered)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    for (const m of userMarkersRef.current) m.remove();
    userMarkersRef.current = [];
    for (const c of checkins) {
      if (!classMatch(c.classes)) continue;
      if (yearOn && c.year !== filterYear) continue;
      const el = document.createElement("div");
      el.style.cssText =
        "width:14px;height:14px;border-radius:50%;border:2px solid #fff;background:#185FA5;box-shadow:0 0 0 1px rgba(0,0,0,0.2)";
      const m = new maplibregl.Marker({ element: el })
        .setLngLat([c.lng, c.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 16 }).setHTML(
            `<div style="font:14px system-ui"><strong>${c.year ?? ""} · ${c.exposures}</strong><br>${c.place}</div>`,
          ),
        )
        .addTo(map);
      userMarkersRef.current.push(m);
    }
  }, [checkins, mapLoaded, activeClasses, yearOn, filterYear]);

  async function addCheckin() {
    if (!draft || !user || (selected.length === 0 && !otherText.trim())) return;
    setSaving(true);
    const { data: newId, error } = await supabase.rpc("log_check_in", {
      p_lng: draft.lng,
      p_lat: draft.lat,
      p_year: year,
      p_conflict: null,
      p_exposures: selected,
    });
    if (!error && newId) {
      const patch: { place_name?: string; notes?: string } = {};
      if (draftName.trim()) patch.place_name = draftName.trim();
      if (otherText.trim()) patch.notes = `Other exposure noted: ${otherText.trim()}`;
      if (Object.keys(patch).length > 0) {
        await supabase.from("check_ins").update(patch).eq("id", newId);
      }
    }
    setSaving(false);
    if (error) {
      alert("Could not save: " + error.message);
      return;
    }
    closeDraft();
    setCheckins(await fetchCheckins(supabase));
  }

  const chipBase = "rounded-full border px-2.5 py-1 text-xs";

  return (
    <div>
      <div className="mb-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Filter the map</span>
          <div className="flex items-center gap-3">
            {activeClasses.size > 0 && (
              <button onClick={() => setActiveClasses(new Set())} className="text-xs text-blue-600 hover:underline dark:text-blue-400">
                clear categories
              </button>
            )}
            <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
              <input type="checkbox" checked={yearOn} onChange={(e) => setYearOn(e.target.checked)} />
              filter by year
            </label>
          </div>
        </div>

        {yearOn && (
          <div className="mt-2 flex items-center gap-2">
            <span className="w-10 text-xs font-medium">{filterYear}</span>
            <input type="range" min={1955} max={2026} value={filterYear} onChange={(e) => setFilterYear(+e.target.value)} className="flex-1" />
          </div>
        )}

        <div className="mt-2 flex flex-wrap gap-1.5">
          {EXPOSURES.map((x) => {
            const on = activeClasses.has(x.value);
            return (
              <button
                key={x.value}
                type="button"
                onClick={() => toggleClass(x.value)}
                className={
                  on
                    ? `${chipBase} border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-300`
                    : `${chipBase} border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800`
                }
              >
                {x.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative">
        <div ref={containerRef} className="h-[520px] w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800" />

        <div className="absolute left-3 top-3 z-[2]">
          <button
            type="button"
            onClick={() => setShowLegend((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-ink shadow-sm backdrop-blur transition hover:bg-white"
          >
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#1D9E75" }} />
            Known exposure sites
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`h-3.5 w-3.5 text-muted transition-transform ${showLegend ? "rotate-180" : ""}`}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {showLegend && (
            <div className="mt-1.5 rounded-lg bg-white/95 px-3 py-2 text-xs shadow-sm backdrop-blur">
              <div className="flex flex-col gap-0.5 text-muted">
                <span><span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: "#1D9E75" }} />recognized</span>
                <span><span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: "#BA7517" }} />documented</span>
                <span><span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: "#E24B4A" }} />emerging</span>
                <span><span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: "#185FA5" }} />your check-ins</span>
              </div>
            </div>
          )}
        </div>

        {draft && (
          <div className="mt-3 w-full rounded-xl border border-line bg-white p-4 shadow-lg sm:absolute sm:right-4 sm:top-4 sm:mt-0 sm:w-80 sm:max-h-[calc(100%-2rem)] sm:overflow-auto">
            <div className="text-sm font-semibold text-ink">New check-in</div>

            <label className="mt-2 block text-xs text-zinc-500">Place</label>
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Name this place"
              className="mt-1 w-full rounded-md border border-zinc-300 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700"
            />
            <div className="mt-1 text-xs text-zinc-400">{fmt(draft.lat, draft.lng)}</div>

            <label className="mt-3 block text-xs text-zinc-500">Service year: {year}</label>
            <input type="range" min={1955} max={2026} value={year} onChange={(e) => setYear(+e.target.value)} className="w-full" />

            {suggestions.sites.length > 0 ? (
              <>
                <div className="mt-3 text-sm font-semibold text-ink">Documented exposures here</div>
                <div className="mb-2 mt-1 flex items-start gap-2 rounded-lg border border-success/30 bg-success-soft px-2.5 py-1.5 text-xs text-success">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-3.5 w-3.5 flex-none">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3" />
                  </svg>
                  <span>
                    Confirmed at {suggestions.sites.slice(0, 2).join(", ")}
                    {suggestions.sites.length > 2 ? ` +${suggestions.sites.length - 2} more` : ""}. We&apos;ve pre-selected them — confirm or adjust.
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="mt-3 text-sm font-semibold text-ink">What were you exposed to here?</div>
                <div className="mb-2 text-xs text-muted">Tap what applies — everything you pick is tagged to this check-in.</div>
              </>
            )}
            <div className="flex flex-wrap gap-1.5">
              {EXPOSURES.map((x) => {
                const on = selected.includes(x.value);
                const documented = suggestions.classes.includes(x.value);
                const cls =
                  documented && on
                    ? `${chipBase} inline-flex items-center gap-1 border-success/50 bg-success-soft font-semibold text-success`
                    : on
                    ? `${chipBase} border-brand bg-brand/10 font-medium text-brand`
                    : `${chipBase} border-line text-muted hover:bg-canvas`;
                return (
                  <button key={x.label} type="button" onClick={() => toggle(x.value)} className={cls}>
                    {documented && on && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                    {x.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-muted">
                Something else? Add an exposure that isn&apos;t listed.
              </label>
              <input
                type="text"
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                placeholder="e.g. specific chemical, contaminated fuel, paint fumes…"
                className="w-full rounded-md border border-line bg-canvas px-2.5 py-1.5 text-sm text-ink placeholder:text-faint focus:border-brand focus:bg-white focus:outline-none"
              />
            </div>

            <div className="mt-4 flex gap-2">
              {user ? (
                <button
                  onClick={addCheckin}
                  disabled={saving || (selected.length === 0 && !otherText.trim())}
                  className="flex-1 rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-brand-foreground hover:bg-brand-600 disabled:opacity-50"
                >
                  {saving ? "Saving…" : (selected.length || otherText.trim()) ? `Save check-in${selected.length ? ` (${selected.length})` : ""}` : "Pick at least one"}
                </button>
              ) : (
                <div className="flex-1 text-xs text-zinc-500">Sign in above to save this pin to your record.</div>
              )}
              <button onClick={closeDraft} className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {user && checkins.length > 0 && (
        <div className="mt-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Your timeline ({checkins.length})</div>
          <ul className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-800">
            {checkins.map((c, i) => (
              <li key={i} className="flex items-center justify-between gap-4 py-2 text-sm">
                <span className="text-zinc-800 dark:text-zinc-200">{c.year ?? "—"} · {c.place}</span>
                <span className="shrink-0 text-zinc-500">{c.exposures}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">Saved to your private record.</p>
        </div>
      )}
    </div>
  );
}
