import { createClient } from "@/lib/supabase/server";

const statusColor: Record<string, string> = {
  recognized: "text-emerald-600 dark:text-emerald-400",
  documented: "text-amber-600 dark:text-amber-400",
  emerging: "text-rose-600 dark:text-rose-400",
};

export default async function Home() {
  const supabase = await createClient();
  const { data: sites, error } = await supabase
    .from("known_exposure_sites")
    .select("name, status, date_from, date_to")
    .order("name");

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-16 font-sans">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Connecting the Dots of Service
      </h1>
      <p className="mt-2 text-zinc-500 dark:text-zinc-400">
        A living record of where veterans served, what they were exposed to, and what it cost them.
      </p>

      <div className="mt-10 rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
        {error ? (
          <p className="text-rose-600 dark:text-rose-400">
            Could not reach the database: {error.message}
          </p>
        ) : (
          <>
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Connected to your live database
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {sites?.length ?? 0} known exposure sites loaded
            </p>
            <ul className="mt-5 divide-y divide-zinc-100 dark:divide-zinc-800">
              {sites?.map((s) => (
                <li
                  key={s.name}
                  className="flex items-center justify-between gap-4 py-2.5 text-sm"
                >
                  <span className="text-zinc-800 dark:text-zinc-200">{s.name}</span>
                  <span
                    className={`shrink-0 capitalize ${statusColor[s.status] ?? "text-zinc-400"}`}
                  >
                    {s.status}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <p className="mt-6 text-xs text-zinc-400 dark:text-zinc-600">
        Phase 1 foundation. Next: the map, the pin-drop, and the AI intake.
      </p>
    </main>
  );
}
