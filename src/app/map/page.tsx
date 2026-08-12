import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import MapPanel from "@/components/MapPanel";

export default async function MapPage() {
  const supabase = await createClient();

  // Page zero (same gate /intake uses): the dashboard's "Start here" CTA for
  // a brand-new veteran points HERE first, not the wizard — so this is the
  // entry point that actually needs the gate, not just /intake. A veteran
  // with no service data yet and who has never confirmed /welcome sees it
  // once, before dropping a pin. Read defensively (migration 0023); any
  // error here means "don't gate," never block someone from the map.
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: m, error } = await supabase
      .from("members")
      .select("branch, service_start, intro_seen_at")
      .eq("auth_id", user.id)
      .maybeSingle();
    if (!error && (!m || (!m.branch && !m.service_start && !m.intro_seen_at))) {
      redirect("/welcome");
    }
  }

  const { data: sites } = await supabase
    .from("known_exposure_sites")
    .select("name, status, geom, exposure_classes, date_from, date_to");

  return (
    <AppShell title="Where you served">
      <p className="mb-4 text-sm text-muted">
        {sites?.length ?? 0} known exposure sites loaded. Click anywhere on the map to drop a pin where you
        served, then tag what you were exposed to.
      </p>
      <MapPanel sites={sites ?? []} />
    </AppShell>
  );
}
