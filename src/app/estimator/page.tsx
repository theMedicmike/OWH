import Link from "next/link";
import EstimatorView from "@/components/EstimatorView";

export default function EstimatorPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 font-sans">
      <Link href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
        ← Back to the map
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        What your service likely exposed you to
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        A plain-language summary built from where you served and what you logged — a starting point to take to
        your clinician. An estimate, not a diagnosis.
      </p>
      <div className="mt-6">
        <EstimatorView />
      </div>
    </main>
  );
}
