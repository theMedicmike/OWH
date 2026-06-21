import Link from "next/link";
import ReportView from "@/components/ReportView";

export default function ReportPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 font-sans">
      <Link href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400 print:hidden">
        ← Back to the map
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 print:hidden">
        Clinician &amp; VSO report
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 print:hidden">
        Your service, exposures, conditions, and the connections between them, on one page to print or save.
      </p>
      <div className="mt-6">
        <ReportView />
      </div>
    </main>
  );
}
