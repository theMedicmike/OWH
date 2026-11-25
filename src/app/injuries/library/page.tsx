import Link from "next/link";
import AppShell from "@/components/AppShell";
import { INJURY_LIBRARY } from "@/lib/injuryLibrary";

export default function InjuryLibraryPage() {
  return (
    <AppShell title="What VA looks for, by injury type">
      <p className="mb-4 text-[0.9375rem] text-muted">
        The named exam, the diagnostic code, and what commonly gets claimed alongside it — cited to the source,
        never a diagnosis or a rating.
      </p>
      <div className="card overflow-hidden">
        {INJURY_LIBRARY.map((i) => (
          <Link key={i.slug} href={`/injuries/library/${i.slug}`} className="row flex-wrap justify-between text-[0.9375rem] hover:bg-canvas">
            <span className="font-semibold text-ink">{i.name}</span>
            <span className="text-sm text-muted">{i.hook}</span>
          </Link>
        ))}
      </div>
      <p className="mt-3 px-1 text-sm leading-relaxed text-muted">
        Four entries so far — more are added as this section grows. Don&apos;t see yours? Log it anyway; the
        library catching up doesn&apos;t change what counts as your record.
      </p>
      <div className="mt-4 text-center"><Link href="/injuries" className="btn btn-secondary">Back to injuries &amp; events</Link></div>
    </AppShell>
  );
}
