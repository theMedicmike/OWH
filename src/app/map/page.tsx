import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import MapPanel from "@/components/MapPanel";

export default async function MapPage() {
  const supabase = await createClient();
  const { data: sites } = await supabase
    .from("known_exposure_sites")
    .select("name, status, geom, exposure_classes, date_from, date_to");

  return (
    <AppShell title="Map">
      <p className="mb-4 text-sm text-muted">
        {sites?.length ?? 0} recognized exposure sites loaded. Click anywhere on the map to drop a pin where you
        served, then tag what you were exposed to.
      </p>
      <MapPanel sites={sites ?? []} />
    </AppShell>
  );
}
