import Link from "next/link";
import AppShell from "@/components/AppShell";
import { INJURY_LIBRARY } from "@/lib/injuryLibrary";

export default function InjuryLibraryPage() {
  return (
    <AppShell title="What VA looks for, by injury type">
      <p className="mb-4 text-sm text-muted">
        The named exam, the diagnostic code, and what commonly gets claimed alongside it — cited to the source,
        never a diagnosis or a rating.
      </p>
      <div className="divide-y divide-line rounded-xl border border-line bg-surface">
        {INJURY_LIBRARY.map((i) => (
          <Link key={i.slug} href={`/injuries/library/${i.slug}`} className="flex items-baseline justify-between gap-2 px-4 py-3 text-sm hover:bg-canvas">
            <span className="font-medium text-ink">{i.name}</span>
            <span className="text-xs text-muted">{i.hook}</span>
          </Link>
        ))}
      </div>
      <p className="mt-3 px-1 text-xs leading-relaxed text-faint">
        Four entries so far — more are added as this section grows. Don&apos;t see yours? Log it anyway; the
        library catching up doesn&apos;t change what counts as your record.
      </p>
      <Link href="/injuries" className="mt-4 block text-center text-xs font-medium text-brand hover:underline">← Injuries &amp; events</Link>
    </AppShell>
  );
}
