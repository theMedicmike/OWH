import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import InjuryAddToRecord from "@/components/InjuryAddToRecord";
import { INJURY_LIBRARY, INJURY_BY_SLUG } from "@/lib/injuryLibrary";
import { INCIDENTS, type IncidentClass } from "@/lib/education";

export function generateStaticParams() {
  return INJURY_LIBRARY.map((i) => ({ slug: i.slug }));
}

const KNOWN = new Set<string>(INCIDENTS.map((x) => x.value));

export default async function InjuryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const i = INJURY_BY_SLUG[slug];
  if (!i) notFound();
  // Only event types the injuries table actually knows can be offered as a
  // one-tap choice; anything else would fail the save.
  const classes = i.incidentClasses.filter((c) => KNOWN.has(c)) as IncidentClass[];

  return (
    <AppShell title="Injury library">
      <article className="space-y-5">
        <Link href="/injuries/library" className="btn btn-ghost -ml-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          All injury types
        </Link>

        <div>
          <h2 className="display text-[1.85rem] text-ink sm:text-[2.125rem]">{i.name}</h2>
          <p className="mt-1.5 text-[0.9375rem] text-muted">{i.hook}</p>
        </div>

        {/* The one action on this page: log it on your own record. */}
        {classes.length > 0 && <InjuryAddToRecord name={i.name} classes={classes} />}

        <section className="card p-5 sm:p-6">
          <h3 className="text-[0.9375rem] font-semibold text-ink">What VA usually asks for</h3>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink">{i.evidence}</p>
        </section>

        <section className="card p-5 sm:p-6">
          <h3 className="text-[0.9375rem] font-semibold text-ink">How this gets rated: structure, not a number</h3>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink">{i.ratingStructure}</p>
        </section>

        <section className="card p-5 sm:p-6">
          <h3 className="text-[0.9375rem] font-semibold text-ink">Commonly documented alongside it</h3>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink">{i.associatedNote}</p>
        </section>

        <section className="card p-5 sm:p-6">
          <h3 className="text-[0.9375rem] font-semibold text-ink">Sources</h3>
          <ul className="mt-2 space-y-2">
            {i.citations.map((c) => (
              <li key={c.label} className="text-[0.9375rem] leading-relaxed">
                <span className="font-semibold text-ink">{c.label}.</span> <span className="text-muted">{c.detail}</span>
              </li>
            ))}
          </ul>
        </section>

        <p className="px-1 text-sm leading-relaxed text-muted">
          This page documents what VA asks for procedurally. It is not a diagnosis, does not assert a rating, and
          is not your representative (38 CFR 14.629). If you or someone you know is struggling, the Veterans
          Crisis Line is here 24/7: dial 988, then press 1.
        </p>
      </article>
    </AppShell>
  );
}
