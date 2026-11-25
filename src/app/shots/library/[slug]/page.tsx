import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import ShotAddToRecord from "@/components/ShotAddToRecord";
import { SHOTS, SHOT_BY_SLUG, RECORD_FORMS, NO_SPECIFIC_WARNING } from "@/lib/shotlibrary";

export function generateStaticParams() {
  return SHOTS.map((s) => ({ slug: s.slug }));
}

// Seven blocks, one shorter than a toxicant page. NO organ map, NO "where it
// goes in the body," NO /learn or /solutions link — ever, in either direction.
// The chip row below replaces the organ map on purpose: it points the deepest
// click at the only thing this feature can actually deliver.
export default async function ShotDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = SHOT_BY_SLUG[slug];
  if (!s) notFound();

  return (
    <AppShell title="Shot library">
      <article className="space-y-5">
        <Link href="/shots/library" className="btn btn-ghost -ml-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          All shots
        </Link>

        <div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="display text-[1.85rem] text-ink sm:text-[2.125rem]">{s.name}</h2>
            <span className="rounded-full bg-canvas px-2.5 py-0.5 text-[0.8125rem] font-medium text-muted">{s.circumstance}</span>
          </div>
          <p className="mt-1.5 text-[0.9375rem] text-muted">{s.hook}</p>
        </div>

        {/* The one action on this page: put this shot on your own record. */}
        <ShotAddToRecord slug={s.slug} name={s.name} kind={s.group === "other" ? "medication" : "vaccination"} />

        <section className="card p-5 sm:p-6">
          <h3 className="text-[0.9375rem] font-semibold text-ink">What it was for, and who got it</h3>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink">{s.policyContext}</p>
        </section>

        <section className="card p-5 sm:p-6">
          <h3 className="text-[0.9375rem] font-semibold text-ink">Ingredients, as printed on the FDA label</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            This is quoted from the manufacturer&apos;s FDA-approved label, word for word, including the units. We
            don&apos;t convert it, round it, or interpret it. What it means for you is a question for your clinician.
          </p>
          <p className="mt-3 whitespace-pre-line rounded-xl bg-canvas p-4 text-[0.9375rem] leading-relaxed text-ink">{s.labelVerbatim}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Source: {s.labelSource.product}, {s.labelSource.manufacturer}. FDA-approved prescribing information, Section 11 DESCRIPTION.
            {s.labelSource.setId !== "See current FDA-approved prescribing information" && ` DailyMed SetID ${s.labelSource.setId}.`}
            {" "}Retrieved {s.labelSource.retrieved}.{" "}
            <a href={s.labelSource.url} target="_blank" rel="noreferrer" className="font-semibold text-brand hover:underline">View the label</a>
          </p>
        </section>

        <section className="card p-5 sm:p-6">
          <h3 className="text-[0.9375rem] font-semibold text-ink">What the label itself warns about</h3>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink">{s.labelWarning ?? NO_SPECIFIC_WARNING}</p>
        </section>

        {s.established && (
          <section className="card p-5 sm:p-6">
            <h3 className="text-[0.9375rem] font-semibold text-ink">What is and isn&apos;t established</h3>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink">{s.established}</p>
          </section>
        )}

        <section className="card p-5 sm:p-6">
          <h3 className="text-[0.9375rem] font-semibold text-ink">Where this was supposed to be written down</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {RECORD_FORMS.map((f) => (
              <Link key={f} href="/shots/record" className="btn btn-secondary btn-sm rounded-full">
                {f}
              </Link>
            ))}
          </div>
        </section>

        <p className="px-1 text-sm leading-relaxed text-muted">
          This page documents. It does not diagnose, does not advise you, does not file for you, and is not your
          representative (38 CFR 14.629). If you or someone you know is struggling, the Veterans Crisis Line is
          here 24/7: dial 988, then press 1.
        </p>
      </article>
    </AppShell>
  );
}
