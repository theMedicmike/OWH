"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { ServiceRibbon } from "./Patriotic";
import { searchGazetteer, nearestPlace, type GazEntry } from "@/lib/gazetteer";
import { EXPOSURES, EXPOSURE_LABEL } from "@/lib/education";

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

const STATUSES = [
  { label: "Recognized", value: "recognized", color: "#1D9E75" },
  { label: "Documented", value: "documented", color: "#BA7517" },
  { label: "Emerging", value: "emerging", color: "#E24B4A" },
];

function fmt(lat: number, lng: number) {
  return `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? "N" : "S"}, ${Math.abs(lng).toFixed(1)}°${lng >= 0 ? "E" : "W"}`;
}

function labelFor(value: string) {
  return EXPOSURE_LABEL[value] ?? value;
}

function yearOf(date: string | null): number | null {
  return date ? new Date(date).getUTCFullYear() : null;
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
  // When a known-site dot is clicked, we pin that exact site so its documented
  // exposures pre-select regardless of the service year the veteran chooses.
  const [pinnedSite, setPinnedSite] = useState<{ name: string; classes: string[] } | null>(null);
  // A plain map click drops a PENDING pin + confirm chip (never the full panel —
  // stray taps were spawning check-in drafts). The chip opens the draft.
  const [pending, setPending] = useState<{ lng: number; lat: number } | null>(null);
  // The veteran's own words — the primary evidence field on every check-in.
  const [story, setStory] = useState("");
  const [month, setMonth] = useState(0); // 0 = not sure; months matter for presumptives
  const [searchQ, setSearchQ] = useState("");
  const draftRef = useRef<{ lng: number; lat: number } | null>(null);
  const yearSeeded = useRef(false);

  // Known exposure sites double as gazetteer entries (search + local naming).
  const gazExtras = useMemo<GazEntry[]>(() =>
    sites.flatMap((s) => {
      const ll = wkbToLngLat(s.geom);
      return ll ? [{ name: s.name, region: "documented site", lat: ll[1], lng: ll[0] }] : [];
    }), [sites]);
  const searchResults = useMemo(() => searchGazetteer(searchQ, gazExtras), [searchQ, gazExtras]);
  const pendingNear = useMemo(
    () => (pending ? nearestPlace(pending.lat, pending.lng, gazExtras) : null),
    [pending, gazExtras],
  );

  // map filters
  const [activeClasses, setActiveClasses] = useState<Set<string>>(new Set());
  const [activeStatuses, setActiveStatuses] = useState<Set<string>>(new Set());
  const [yearOn, setYearOn] = useState(false);
  const [filterYear, setFilterYear] = useState(2007);
  const [showFilters, setShowFilters] = useState(false);

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

  // Every field that belongs to ONE check-in. Must be cleared whenever a new
  // draft opens, or the last location's narrative/month rides along into the
  // next one's record.
  function resetDraftFields() {
    setSelected([]);
    setOtherText("");
    setStory("");
    setMonth(0);
  }

  function closeDraft() {
    setDraft(null);
    setDraftName("");
    setPinnedSite(null);
    setPending(null);
    resetDraftFields();
  }

  // Confirm chip → open the real check-in draft at the pending pin.
  function beginDraft() {
    if (!pending) return;
    resetDraftFields();
    setDraft(pending);
    setPending(null);
  }

  // Search pick: fly there; a documented site seeds a full draft from that site,
  // anywhere else opens a draft at the base's coordinates.
  function pickSearch(e: GazEntry) {
    const ll: [number, number] = [e.lng, e.lat];
    mapRef.current?.flyTo({ center: ll, zoom: 9 });
    const site = sites.find((s) => s.name === e.name);
    setPending(null);
    if (site) startFromSite(site, ll);
    else { resetDraftFields(); setPinnedSite(null); setDraftName(e.name); setDraft({ lng: e.lng, lat: e.lat }); }
    setSearchQ("");
  }

  // Clicking a known-exposure dot seeds the check-in from THAT site: its name,
  // its coordinates, and — the key part — its documented exposures, all
  // pre-selected. The veteran keeps their own service year and can add anything
  // personal on top. No need to be a doctor to know what was in the ground.
  function startFromSite(site: Site, ll: [number, number]) {
    const classes = Array.from(new Set(site.exposure_classes ?? []));
    resetDraftFields();
    setPinnedSite({ name: site.name, classes });
    const fromY = yearOf(site.date_from);
    const toY = yearOf(site.date_to);
    setYear((y) => (fromY !== null && toY !== null && y >= fromY && y <= toY ? y : fromY ?? y));
    setDraft({ lng: ll[0], lat: ll[1] });
  }

  function classMatch(classes: string[]) {
    if (activeClasses.size === 0) return true;
    return classes.some((c) => activeClasses.has(c));
  }

  function toggleStatus(value: string) {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  function statusMatch(status: string) {
    return activeStatuses.size === 0 || activeStatuses.has(status);
  }

  function clearFilters() {
    setActiveClasses(new Set());
    setActiveStatuses(new Set());
    setYearOn(false);
  }

  const activeCount = activeClasses.size + activeStatuses.size + (yearOn ? 1 : 0);

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
  // Documented set shown + pre-selected = the pinned site's classes (always) plus
  // anything documented near the pin in that service year.
  const docClasses = useMemo(
    () => Array.from(new Set([...(pinnedSite?.classes ?? []), ...suggestions.classes])),
    [pinnedSite, suggestions],
  );
  const docSites = Array.from(new Set([...(pinnedSite ? [pinnedSite.name] : []), ...suggestions.sites]));

  // Seed the selection when the pin is dropped, or when the documented set
  // changes (e.g. moving the year). Manual edits persist while it's unchanged.
  const docKey = docClasses.join(",");
  useEffect(() => {
    if (!draft) return;
    setSelected(docClasses);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, docKey]);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [20, 25],
      zoom: 1.6,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), "bottom-right");
    map.on("load", () => setMapLoaded(true));
    // A stray tap must never destroy an open draft. Clearing pinnedSite while a
    // draft is up re-runs the name + documented-exposure effects and silently
    // discards the veteran's typed place and their exposure choices.
    map.on("click", (e) => {
      if (draftRef.current) return;
      setPinnedSite(null);
      setPending({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    });
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // reverse-geocode the dropped pin
  // Name the dropped pin from the LOCAL gazetteer — nothing leaves the device.
  useEffect(() => {
    if (!draft) {
      setDraftName("");
      return;
    }
    if (pinnedSite) {
      setDraftName(pinnedSite.name);
      return;
    }
    const near = nearestPlace(draft.lat, draft.lng, gazExtras);
    setDraftName(near ? near.name : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, pinnedSite]);

  // Keep the click handler's view of "is a draft open" current without
  // re-registering the map listener.
  useEffect(() => { draftRef.current = draft; }, [draft]);

  // Seed the service-year slider from the veteran's own service start — ONCE.
  // Supabase hands React a new user object on every token refresh; without the
  // ref guard that would silently reset a year the veteran had dragged, and
  // write the wrong year into a record whose whole point is the year.
  useEffect(() => {
    if (!user || yearSeeded.current) return;
    supabase.from("members").select("service_start").eq("auth_id", user.id).maybeSingle().then(({ data }) => {
      if (yearSeeded.current) return;
      yearSeeded.current = true;
      if (data?.service_start) setYear(new Date(data.service_start).getUTCFullYear());
    });
  }, [user?.id, supabase]);

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
      if (!statusMatch(s.status)) continue;
      if (yearOn) {
        const f = yearOf(s.date_from);
        const t = yearOf(s.date_to);
        if (f !== null && t !== null && !(f <= filterYear && filterYear <= t)) continue;
      }
      const el = document.createElement("div");
      el.style.cssText = `width:14px;height:14px;border-radius:50%;border:2px solid #fff;cursor:pointer;background:${STATUS_COLOR[s.status] ?? "#888780"};box-shadow:0 0 0 1px rgba(0,0,0,0.15)`;
      el.title = `${s.name} — click to start a check-in here`;
      el.addEventListener("click", (ev) => { ev.stopPropagation(); startFromSite(s, ll); });
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
  }, [sites, mapLoaded, activeClasses, activeStatuses, yearOn, filterYear]);

  // draft / pending marker (gold while pending confirmation, blue once drafting)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (draftMarkerRef.current) {
      draftMarkerRef.current.remove();
      draftMarkerRef.current = null;
    }
    const spot = draft ?? pending;
    if (spot) {
      const el = document.createElement("div");
      el.style.cssText = `width:18px;height:18px;border-radius:50%;border:3px solid #fff;background:${draft ? "#185FA5" : "#c1873d"};box-shadow:0 0 0 1px rgba(0,0,0,0.25)`;
      draftMarkerRef.current = new maplibregl.Marker({ element: el }).setLngLat([spot.lng, spot.lat]).addTo(map);
    }
  }, [draft, pending]);

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
      // Don't let tapping your own saved pin fall through to the map handler.
      el.addEventListener("click", (ev) => ev.stopPropagation());
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
    if (!draft || !user || (selected.length === 0 && !otherText.trim() && !story.trim())) return;
    setSaving(true);
    const { data: newId, error } = await supabase.rpc("log_check_in", {
      p_lng: draft.lng,
      p_lat: draft.lat,
      p_year: year,
      p_conflict: null,
      p_exposures: selected,
    });
    if (!error && newId) {
      const patch: { place_name?: string; notes?: string; date_start?: string } = {};
      if (draftName.trim()) patch.place_name = draftName.trim();
      // The veteran's narrative leads; a free-text "other exposure" follows it.
      const noteParts = [story.trim(), otherText.trim() ? `Other exposure noted: ${otherText.trim()}` : ""].filter(Boolean);
      if (noteParts.length) patch.notes = noteParts.join("\n");
      // Month-level dates when known — presumptive windows can turn on months.
      if (month >= 1 && month <= 12) patch.date_start = `${year}-${String(month).padStart(2, "0")}-01`;
      if (Object.keys(patch).length > 0) {
        // This patch carries the veteran's OWN WORDS and the month-precision
        // date. If it fails we must not close the panel — the text would be
        // gone for good, and nothing else in the app can re-enter it.
        const { error: patchErr } = await supabase.from("check_ins").update(patch).eq("id", newId);
        if (patchErr) {
          setSaving(false);
          alert(
            "The pin saved, but your notes and place name didn't: " + patchErr.message +
            "\n\nYour words are still on screen — try Save again."
          );
          return;
        }
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
      <div className="mb-3 overflow-hidden rounded-xl border border-line bg-surface">
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-ink">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
            </svg>
            Filter the map
            {activeCount > 0 && (
              <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-brand-foreground">{activeCount}</span>
            )}
          </span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 text-muted transition-transform ${showFilters ? "rotate-180" : ""}`}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {showFilters && (
          <div className="border-t border-line px-4 py-3">
            <div className="text-[11px] font-bold uppercase tracking-wide text-muted">By recognition</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {STATUSES.map((s) => {
                const on = activeStatuses.has(s.value);
                return (
                  <button
                    key={s.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleStatus(s.value)}
                    className={`${chipBase} inline-flex items-center gap-1.5 ${on ? "border-transparent text-white" : "border-line text-muted hover:bg-canvas"}`}
                    style={on ? { background: s.color } : undefined}
                  >
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: on ? "#fff" : s.color }} />
                    {s.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 text-[11px] font-bold uppercase tracking-wide text-muted">By exposure</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {EXPOSURES.map((x) => {
                const on = activeClasses.has(x.value);
                return (
                  <button
                    key={x.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleClass(x.value)}
                    className={on ? `${chipBase} border-brand bg-brand/10 font-medium text-brand` : `${chipBase} border-line text-muted hover:bg-canvas`}
                  >
                    {x.label}
                  </button>
                );
              })}
            </div>

            <label className="mt-3 flex items-center gap-1.5 text-xs text-muted">
              <input type="checkbox" checked={yearOn} onChange={(e) => setYearOn(e.target.checked)} />
              Filter by year
            </label>
            {yearOn && (
              <div className="mt-2 flex items-center gap-2">
                <span className="w-10 text-xs font-medium text-ink">{filterYear}</span>
                <input type="range" min={1945} max={2026} value={filterYear} onChange={(e) => setFilterYear(+e.target.value)} className="flex-1" />
              </div>
            )}

            {activeCount > 0 && (
              <button onClick={clearFilters} className="mt-3 text-xs font-medium text-brand hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Find your base — local gazetteer, nothing leaves the app */}
      <div className="relative mb-3">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-4 w-4"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" /></svg>
        </div>
        <input
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder="Find your base — type its name (e.g. Balad, Lejeune, Bagram)"
          className="w-full rounded-xl border border-line bg-white py-2.5 pl-9 pr-4 text-sm text-ink placeholder:text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
        />
        {searchResults.length > 0 && (
          <div className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-line bg-white shadow-lg">
            {searchResults.map((r) => (
              <button
                key={`${r.name}|${r.region}`}
                type="button"
                // onMouseDown only prevents the blur; the real activation is
                // onClick so Enter/Space and screen readers work.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pickSearch(r)}
                className="flex w-full items-center justify-between gap-2 border-b border-line px-3.5 py-2.5 text-left transition last:border-0 hover:bg-canvas"
              >
                <span className="text-sm font-medium text-ink">{r.name}</span>
                <span className={`flex-none text-[11px] ${r.region === "documented site" ? "font-semibold text-success" : "text-muted"}`}>
                  {r.region === "documented site" ? "● documented" : r.region}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <div ref={containerRef} className="h-[520px] w-full overflow-hidden rounded-xl border border-line" />

        {/* Confirm chip for a dropped pin — a stray tap never spawns the panel */}
        {pending && !draft && (
          <div className="absolute left-1/2 top-3 z-[3] flex max-w-[94%] -translate-x-1/2 items-center gap-2 rounded-full bg-white/95 py-1.5 pl-4 pr-1.5 shadow-lg ring-1 ring-line backdrop-blur">
            <span className="truncate text-xs font-medium text-ink">
              {pendingNear ? pendingNear.name : fmt(pending.lat, pending.lng)}
            </span>
            <button
              onClick={beginDraft}
              className="flex-none rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-600"
            >
              Check in here
            </button>
            <button onClick={() => setPending(null)} aria-label="Dismiss pin" className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-muted hover:bg-canvas">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-3.5 w-3.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
        )}

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
            <ServiceRibbon className="mb-3 rounded-full opacity-90" />
            <div className="text-sm font-semibold text-ink">New check-in</div>

            <label className="mt-2 block text-xs text-muted">Place</label>
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Name this place"
              className="mt-1 w-full rounded-md border border-line bg-canvas px-2.5 py-1.5 text-sm text-ink placeholder:text-faint focus:border-brand focus:bg-white focus:outline-none"
            />
            <div className="mt-1 text-xs text-faint">{fmt(draft.lat, draft.lng)}</div>

            <label className="mt-3 block text-xs text-muted">Service year: {year}</label>
            <input type="range" min={1945} max={2026} value={year} onChange={(e) => setYear(+e.target.value)} className="w-full" />

            <label className="mt-1 block text-xs text-muted">Month, if you remember — months can matter for presumptive windows</label>
            <select
              value={month}
              onChange={(e) => setMonth(+e.target.value)}
              className="mt-1 w-full cursor-pointer appearance-none rounded-md border border-line bg-canvas px-2.5 py-1.5 text-sm text-ink focus:border-brand focus:bg-white focus:outline-none"
            >
              <option value={0}>Not sure</option>
              {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>

            <label className="mt-3 block text-sm font-semibold text-ink">In your own words — what were you doing here?</label>
            <p className="mt-0.5 text-[11px] leading-snug text-faint">Your own memory is the strongest evidence a record can carry. A sentence or two. Nothing classified.</p>
            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              rows={2}
              placeholder="e.g. Convoy security out of the north gate; burn pit smoke drifted over our motor pool most nights."
              className="mt-1.5 w-full rounded-md border border-line bg-canvas px-2.5 py-1.5 text-sm text-ink placeholder:text-faint focus:border-brand focus:bg-white focus:outline-none"
            />

            {docSites.length > 0 ? (
              <>
                <div className="mt-3 text-sm font-semibold text-ink">Documented near this spot — confirm yours</div>
                <div className="mb-2 mt-1 flex items-start gap-2 rounded-lg border border-success/30 bg-success-soft px-2.5 py-1.5 text-xs text-success">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-3.5 w-3.5 flex-none">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3" />
                  </svg>
                  <span>
                    Documented at {docSites.slice(0, 2).join(", ")}
                    {docSites.length > 2 ? ` +${docSites.length - 2} more` : ""} — pre-checked below. Keep what matches your memory; uncheck anything that doesn&apos;t apply to you.
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
                const documented = docClasses.includes(x.value);
                const cls =
                  documented && on
                    ? `${chipBase} inline-flex items-center gap-1 border-success/50 bg-success-soft font-semibold text-success`
                    : on
                    ? `${chipBase} border-brand bg-brand/10 font-medium text-brand`
                    : `${chipBase} border-line text-muted hover:bg-canvas`;
                return (
                  <button key={x.label} type="button" aria-pressed={on} onClick={() => toggle(x.value)} className={cls}>
                    {documented && on && (
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
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
              <p className="mt-1.5 text-[11px] leading-relaxed text-faint">Keep it general — no classified, secret, or NDA-protected details.</p>
            </div>

            <div className="mt-4 flex gap-2">
              {user ? (
                <button
                  onClick={addCheckin}
                  disabled={saving || (selected.length === 0 && !otherText.trim() && !story.trim())}
                  className="flex-1 rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-brand-foreground hover:bg-brand-600 disabled:opacity-50"
                >
                  {saving ? "Saving…" : (selected.length || otherText.trim() || story.trim()) ? `Save check-in${selected.length ? ` (${selected.length})` : ""}` : "Add your words or an exposure"}
                </button>
              ) : (
                <div className="flex-1 text-xs text-muted">Sign in above to save this pin to your record.</div>
              )}
              <button onClick={closeDraft} className="rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:bg-canvas">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {user && checkins.length > 0 && (
        <div className="mt-4 rounded-xl border border-line bg-surface p-4">
          <div className="text-sm font-semibold text-ink">Your timeline ({checkins.length})</div>
          <ul className="mt-2 divide-y divide-line">
            {checkins.map((c, i) => (
              <li key={i} className="flex items-center justify-between gap-4 py-2 text-sm">
                <span className="text-ink">{c.year ?? "—"} · {c.place}</span>
                <span className="shrink-0 text-muted">{c.exposures}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-success">Saved to your private record.</p>
        </div>
      )}
    </div>
  );
}
