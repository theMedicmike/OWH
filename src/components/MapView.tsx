"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export type Site = {
  name: string;
  status: string;
  geom: string | null;
};

type CheckIn = {
  lng: number;
  lat: number;
  year: number | null;
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

async function fetchCheckins(supabase: ReturnType<typeof createClient>): Promise<CheckIn[]> {
  const { data } = await supabase
    .from("check_ins")
    .select("geom, date_start, place_name, exposures(exposure_class)")
    .order("date_start", { ascending: false });
  const list: CheckIn[] = [];
  for (const row of (data ?? []) as Row[]) {
    const ll = wkbToLngLat(row.geom);
    if (!ll) continue;
    const labels = (row.exposures ?? []).map((e) => labelFor(e.exposure_class));
    list.push({
      lng: ll[0],
      lat: ll[1],
      year: row.date_start ? new Date(row.date_start).getUTCFullYear() : null,
      exposures: labels.length ? labels.join(", ") : "—",
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
  const userMarkersRef = useRef<maplibregl.Marker[]>([]);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [draft, setDraft] = useState<{ lng: number; lat: number } | null>(null);
  const [draftName, setDraftName] = useState("");
  const [year, setYear] = useState(2007);
  const [selected, setSelected] = useState<string[]>([]);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [saving, setSaving] = useState(false);

  function toggle(value: string) {
    setSelected((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  function closeDraft() {
    setDraft(null);
    setDraftName("");
    setSelected([]);
  }

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

    map.on("load", () => {
      for (const s of sites) {
        const ll = wkbToLngLat(s.geom);
        if (!ll) continue;
        const el = document.createElement("div");
        el.style.cssText = `width:14px;height:14px;border-radius:50%;border:2px solid #fff;cursor:pointer;background:${STATUS_COLOR[s.status] ?? "#888780"};box-shadow:0 0 0 1px rgba(0,0,0,0.15)`;
        new maplibregl.Marker({ element: el })
          .setLngLat(ll)
          .setPopup(
            new maplibregl.Popup({ offset: 16 }).setHTML(
              `<div style="font:14px system-ui"><strong>${s.name}</strong><br><span style="color:${STATUS_COLOR[s.status] ?? "#888780"};text-transform:capitalize">${s.status}</span></div>`,
            ),
          )
          .addTo(map);
      }
      setMapLoaded(true);
    });

    map.on("click", (e) => setDraft({ lng: e.lngLat.lng, lat: e.lngLat.lat }));

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [sites]);

  // reverse-geocode the dropped pin to auto-fill a place name
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
      draftMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([draft.lng, draft.lat])
        .addTo(map);
    }
  }, [draft]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    for (const m of userMarkersRef.current) m.remove();
    userMarkersRef.current = [];
    for (const c of checkins) {
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
  }, [checkins, mapLoaded]);

  async function addCheckin() {
    if (!draft || !user || selected.length === 0) return;
    setSaving(true);
    const { data: newId, error } = await supabase.rpc("log_check_in", {
      p_lng: draft.lng,
      p_lat: draft.lat,
      p_year: year,
      p_conflict: null,
      p_exposures: selected,
    });
    if (!error && newId && draftName.trim()) {
      await supabase.from("check_ins").update({ place_name: draftName.trim() }).eq("id", newId);
    }
    setSaving(false);
    if (error) {
      alert("Could not save: " + error.message);
      return;
    }
    closeDraft();
    setCheckins(await fetchCheckins(supabase));
  }

  return (
    <div>
      <div className="relative">
        <div
          ref={containerRef}
          className="h-[520px] w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800"
        />

        <div className="pointer-events-none absolute left-4 top-4 rounded-lg bg-white/90 px-3 py-2 text-xs shadow-sm backdrop-blur dark:bg-zinc-900/90">
          <div className="font-medium text-zinc-700 dark:text-zinc-200">Known exposure sites</div>
          <div className="mt-1 flex flex-col gap-0.5 text-zinc-500">
            <span><span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: "#1D9E75" }} />recognized</span>
            <span><span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: "#BA7517" }} />documented</span>
            <span><span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: "#E24B4A" }} />emerging</span>
            <span><span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: "#185FA5" }} />your check-ins</span>
          </div>
        </div>

        {draft && (
          <div className="absolute right-4 top-4 w-80 rounded-xl border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">New check-in</div>

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
            <input
              type="range"
              min={1955}
              max={2026}
              value={year}
              onChange={(e) => setYear(+e.target.value)}
              className="w-full"
            />

            <div className="mt-3 text-sm font-medium text-zinc-800 dark:text-zinc-200">
              What were you exposed to here?
            </div>
            <div className="mb-2 text-xs text-zinc-500">
              Select all that apply. Everything you pick is tagged to this check-in.
            </div>
            <div className="flex flex-wrap gap-1.5">
              {EXPOSURES.map((x) => {
                const on = selected.includes(x.value);
                return (
                  <button
                    key={x.label}
                    type="button"
                    onClick={() => toggle(x.value)}
                    className={
                      on
                        ? "rounded-full border border-blue-500 bg-blue-50 px-2.5 py-1 text-xs text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-300"
                        : "rounded-full border border-zinc-300 px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    }
                  >
                    {x.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex gap-2">
              {user ? (
                <button
                  onClick={addCheckin}
                  disabled={saving || selected.length === 0}
                  className="flex-1 rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
                >
                  {saving ? "Saving…" : selected.length ? `Save check-in (${selected.length})` : "Pick at least one"}
                </button>
              ) : (
                <div className="flex-1 text-xs text-zinc-500">Sign in above to save this pin to your record.</div>
              )}
              <button
                onClick={closeDraft}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {user && checkins.length > 0 && (
        <div className="mt-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Your timeline ({checkins.length})
          </div>
          <ul className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-800">
            {checkins.map((c, i) => (
              <li key={i} className="flex items-center justify-between gap-4 py-2 text-sm">
                <span className="text-zinc-800 dark:text-zinc-200">
                  {c.year ?? "—"} · {c.place}
                </span>
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
