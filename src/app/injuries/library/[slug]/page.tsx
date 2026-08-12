import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import { INJURY_LIBRARY, INJURY_BY_SLUG } from "@/lib/injuryLibrary";
import { INCIDENT_LABEL } from "@/lib/education";

export function generateStaticParams() {
  return INJURY_LIBRARY.map((i) => ({ slug: i.slug }));
}

export default async function InjuryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const i = INJURY_BY_SLUG[slug];
  if (!i) notFound();

  return (
    <AppShell title="Injury library">
      <article className="mx-auto max-w-2xl space-y-5">
        <Link href="/injuries/library" className="text-xs font-medium text-brand hover:underline">← What VA looks for, by injury type</Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{i.name}</h1>
          <p className="mt-1 text-sm text-muted">{i.hook}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {i.incidentClasses.map((c) => (
              <span key={c} className="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-medium text-muted">{INCIDENT_LABEL[c] ?? c}</span>
            ))}
          </div>
        </div>

        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">What VA usually asks for</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink">{i.evidence}</p>
        </section>

        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">How this gets rated — structure, not a number</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink">{i.ratingStructure}</p>
        </section>

        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Commonly documented alongside it</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink">{i.associatedNote}</p>
        </section>

        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Sources</h2>
          <ul className="mt-2 space-y-2">
            {i.citations.map((c) => (
              <li key={c.label} className="text-xs leading-relaxed">
                <span className="font-semibold text-ink">{c.label}</span> — <span className="text-muted">{c.detail}</span>
              </li>
            ))}
          </ul>
        </section>

        <Link
          href="/injuries/add"
          className="block rounded-lg bg-brand px-4 py-2.5 text-center text-sm font-semibold text-brand-foreground hover:bg-brand-600"
        >
          Log this →
        </Link>

        <p className="px-1 text-xs leading-relaxed text-faint">
          This page documents what VA asks for procedurally. It is not a diagnosis, does not assert a rating, and
          is not your representative (38 CFR 14.629). If you or someone you know is struggling, the Veterans
          Crisis Line is here 24/7 — dial 988, then press 1.
        </p>

        <Link href="/injuries" className="block text-center text-xs font-medium text-brand hover:underline">← Injuries &amp; events</Link>
      </article>
    </AppShell>
  );
}
