"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type Site = {
  name: string;
  status: string;
  geom: { type: string; coordinates: [number, number] } | null;
};

type CheckIn = {
  lng: number;
  lat: number;
  year: number;
  exposure: string;
  place: string;
};

const STATUS_COLOR: Record<string, string> = {
  recognized: "#1D9E75",
  documented: "#BA7517",
  emerging: "#E24B4A",
};

const EXPOSURES = [
  "Burn pits",
  "Heavy metals",
  "Depleted uranium",
  "Chemical / solvent",
  "Water contamination",
  "Pesticide / herbicide",
  "Asbestos / silica",
  "Radiation",
  "PFAS / AFFF",
];

function fmt(lat: number, lng: number) {
  return `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? "N" : "S"}, ${Math.abs(lng).toFixed(1)}°${lng >= 0 ? "E" : "W"}`;
}

export default function MapView({ sites }: { sites: Site[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const draftMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [draft, setDraft] = useState<{ lng: number; lat: number } | null>(null);
  const [year, setYear] = useState(2007);
  const [exposure, setExposure] = useState(EXPOSURES[0]);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [20, 25],
      zoom: 1.3,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      for (const s of sites) {
        const c = s.geom?.coordinates;
        if (!Array.isArray(c)) continue;
        const el = document.createElement("div");
        el.style.cssText = `width:14px;height:14px;border-radius:50%;border:2px solid #fff;cursor:pointer;background:${STATUS_COLOR[s.status] ?? "#888780"};box-shadow:0 0 0 1px rgba(0,0,0,0.15)`;
        new maplibregl.Marker({ element: el })
          .setLngLat([c[0], c[1]])
          .setPopup(
            new maplibregl.Popup({ offset: 16 }).setHTML(
              `<div style="font:14px system-ui"><strong>${s.name}</strong><br><span style="color:${STATUS_COLOR[s.status] ?? "#888780"};text-transform:capitalize">${s.status}</span></div>`,
            ),
          )
          .addTo(map);
      }
    });

    map.on("click", (e) => {
      setDraft({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [sites]);

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

  function addCheckin() {
    if (!draft) return;
    const place = fmt(draft.lat, draft.lng);
    setCheckins((prev) => [{ ...draft, year, exposure, place }, ...prev]);
    const map = mapRef.current;
    if (map) {
      const el = document.createElement("div");
      el.style.cssText =
        "width:14px;height:14px;border-radius:50%;border:2px solid #fff;background:#185FA5;box-shadow:0 0 0 1px rgba(0,0,0,0.2)";
      new maplibregl.Marker({ element: el }).setLngLat([draft.lng, draft.lat]).addTo(map);
    }
    setDraft(null);
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
          </div>
        </div>

        {draft && (
          <div className="absolute right-4 top-4 w-72 rounded-xl border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">New check-in</div>
            <div className="mt-1 text-xs text-zinc-500">{fmt(draft.lat, draft.lng)}</div>

            <label className="mt-3 block text-xs text-zinc-500">Service year: {year}</label>
            <input
              type="range"
              min={1955}
              max={2026}
              value={year}
              onChange={(e) => setYear(+e.target.value)}
              className="w-full"
            />

            <label className="mt-3 block text-xs text-zinc-500">Exposure</label>
            <select
              value={exposure}
              onChange={(e) => setExposure(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700"
            >
              {EXPOSURES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>

            <div className="mt-4 flex gap-2">
              <button
                onClick={addCheckin}
                className="flex-1 rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white hover:opacity-90 dark:bg-white dark:text-zinc-900"
              >
                Add to timeline
              </button>
              <button
                onClick={() => setDraft(null)}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {checkins.length > 0 && (
        <div className="mt-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Your timeline ({checkins.length})
          </div>
          <ul className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-800">
            {checkins.map((c, i) => (
              <li key={i} className="flex items-center justify-between py-2 text-sm">
                <span className="text-zinc-800 dark:text-zinc-200">
                  {c.year} · {c.place}
                </span>
                <span className="text-zinc-500">{c.exposure}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-zinc-400">
            Held in this session. Accounts and permanent saving come next.
          </p>
        </div>
      )}
    </div>
  );
}
