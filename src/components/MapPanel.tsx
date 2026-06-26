"use client";

import dynamic from "next/dynamic";
import { useAuth } from "./AuthProvider";
import type { Site } from "./MapView";

// Load the map only in the browser. MapLibre touches browser globals at import.
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[520px] w-full items-center justify-center rounded-xl border border-line text-sm text-faint">
      Loading map…
    </div>
  ),
});

export default function MapPanel({ sites }: { sites: Site[] }) {
  const { user } = useAuth();
  return <MapView sites={sites} user={user} />;
}
