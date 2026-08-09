import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
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
    <AppShell title="Shot record">
      <article className="mx-auto max-w-2xl space-y-5">
        <Link href="/shots/library" className="text-xs font-medium text-brand hover:underline">← What these shots were</Link>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-ink">{s.name}</h1>
            <span className="rounded-md bg-canvas px-2 py-0.5 text-xs font-medium text-muted">{s.circumstance}</span>
          </div>
          <p className="mt-1 text-sm text-muted">{s.hook}</p>
        </div>

        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">What it was for, and who got it</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink">{s.policyContext}</p>
        </section>

        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Ingredients, as printed on the FDA label</h2>
          <p className="mt-1 text-xs leading-relaxed text-faint">
            This is quoted from the manufacturer&apos;s FDA-approved label, word for word, including the units. We
            don&apos;t convert it, round it, or interpret it. What it means for you is a question for your clinician.
          </p>
          <p className="mt-3 whitespace-pre-line font-mono text-[13px] leading-relaxed text-ink">{s.labelVerbatim}</p>
          <p className="mt-3 text-[11px] leading-relaxed text-faint">
            Source: {s.labelSource.product}, {s.labelSource.manufacturer}. FDA-approved prescribing information, Section 11 DESCRIPTION.
            {s.labelSource.setId !== "See current FDA-approved prescribing information" && ` DailyMed SetID ${s.labelSource.setId}.`}
            {" "}Retrieved {s.labelSource.retrieved}.{" "}
            <a href={s.labelSource.url} target="_blank" rel="noreferrer" className="text-brand hover:underline">View the label →</a>
          </p>
        </section>

        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">What the label itself warns about</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink">{s.labelWarning ?? NO_SPECIFIC_WARNING}</p>
        </section>

        {s.established && (
          <section className="rounded-xl border border-line bg-surface p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">What is and isn&apos;t established</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink">{s.established}</p>
          </section>
        )}

        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Where this was supposed to be written down</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {RECORD_FORMS.map((f) => (
              <Link key={f} href="/shots/record" className="rounded-full border border-line bg-canvas px-3 py-1 text-xs font-medium text-ink hover:border-brand hover:text-brand">
                {f}
              </Link>
            ))}
          </div>
        </section>

        <p className="px-1 text-xs leading-relaxed text-faint">
          This page documents. It does not diagnose, does not advise you, does not file for you, and is not your
          representative (38 CFR 14.629). If you or someone you know is struggling, the Veterans Crisis Line is
          here 24/7 — dial 988, then press 1.
        </p>

        <Link href="/shots" className="block text-center text-xs font-medium text-brand hover:underline">← Your shot record</Link>
      </article>
    </AppShell>
  );
}
