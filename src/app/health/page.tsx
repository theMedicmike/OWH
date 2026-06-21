import Link from "next/link";
import HealthView from "@/components/HealthView";
import DocumentsCard from "@/components/DocumentsCard";

export default function HealthPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 font-sans">
      <Link href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
        ← Back to the map
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Your health &amp; connections
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        List what you live with now, and see where it lines up with the exposures you logged on the map.
      </p>
      <div className="mt-6 space-y-4">
        <HealthView />
        <DocumentsCard />
      </div>
    </main>
  );
}
