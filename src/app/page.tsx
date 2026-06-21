import { createClient } from "@/lib/supabase/server";
import MapPanel from "@/components/MapPanel";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const { data: sites } = await supabase
    .from("known_exposure_sites")
    .select("name, status, geom, exposure_classes, date_from, date_to");

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 font-sans">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Connecting the Dots of Service
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {sites?.length ?? 0} known exposure sites loaded. Click anywhere on the map to drop a pin and
        log where you served.
      </p>

      <div className="mt-2 flex flex-wrap gap-4 text-sm">
        <Link href="/intake" className="text-blue-600 hover:underline dark:text-blue-400">
          Build your timeline with the guide →
        </Link>
        <Link href="/estimator" className="text-blue-600 hover:underline dark:text-blue-400">
          Your exposure burden estimate →
        </Link>
        <Link href="/health" className="text-blue-600 hover:underline dark:text-blue-400">
          Your health &amp; connections →
        </Link>
        <Link href="/report" className="text-blue-600 hover:underline dark:text-blue-400">
          Clinician &amp; VSO report →
        </Link>
        <Link href="/buddies" className="text-blue-600 hover:underline dark:text-blue-400">
          Battle buddies →
        </Link>
      </div>

      <div className="mt-6">
        <MapPanel sites={sites ?? []} />
      </div>

      <p className="mt-6 text-xs text-zinc-400 dark:text-zinc-600">
        Phase 1. Next: accounts so pins save permanently, then the AI intake and the burden estimator.
      </p>
    </main>
  );
}
