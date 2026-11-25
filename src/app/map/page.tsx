import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import MapPanel from "@/components/MapPanel";
import PlaceQuickAdd from "@/components/PlaceQuickAdd";

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
      <div className="space-y-10">
        {/* The quick way first: search, Add, pick the year. */}
        <PlaceQuickAdd sites={sites ?? []} />

        {/* The map, for dates, a story, what you were around, or an exact pin. */}
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-ink">Or use the map</h2>
          <p className="mb-4 mt-1 text-[0.9375rem] leading-relaxed text-muted">
            Tap anywhere to drop a pin where you served, then add the dates, what you were around, and your own
            words.
          </p>
          <MapPanel sites={sites ?? []} />
        </section>
      </div>
    </AppShell>
  );
}
