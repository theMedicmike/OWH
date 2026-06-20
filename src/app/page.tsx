import { createClient } from "@/lib/supabase/server";
import MapView from "@/components/MapView";

export default async function Home() {
  const supabase = await createClient();
  const { data: sites } = await supabase
    .from("known_exposure_sites")
    .select("name, status, geom");

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 font-sans">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Connecting the Dots of Service
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {sites?.length ?? 0} known exposure sites loaded. Click anywhere on the map to drop a pin and
        log where you served.
      </p>

      <div className="mt-6">
        <MapView sites={sites ?? []} />
      </div>

      <p className="mt-6 text-xs text-zinc-400 dark:text-zinc-600">
        Phase 1. Next: accounts so pins save permanently, then the AI intake and the burden estimator.
      </p>
    </main>
  );
}
