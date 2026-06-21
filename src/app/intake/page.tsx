import Link from "next/link";
import IntakeView from "@/components/IntakeView";

export default function IntakePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10 font-sans">
      <Link href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
        ← Back to the map
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Build your timeline with your guide
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Talk it through instead of clicking the map. Your guide asks the questions and turns your answers into
        check-ins you can save.
      </p>
      <div className="mt-6">
        <IntakeView />
      </div>
    </main>
  );
}
