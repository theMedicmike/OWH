"use client";

import dynamic from "next/dynamic";
import type { Site } from "./MapView";

// Load the map only in the browser. MapLibre touches browser globals at import,
// so it must never run during server-side rendering.
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[520px] w-full items-center justify-center rounded-xl border border-zinc-200 text-sm text-zinc-400 dark:border-zinc-800">
      Loading map…
    </div>
  ),
});

export default function MapPanel({ sites }: { sites: Site[] }) {
  return <MapView sites={sites} />;
}
