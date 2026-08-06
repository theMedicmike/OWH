import AppShell from "@/components/AppShell";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  TOXICANTS, TOXICANT_BY_SLUG, ORGAN_BY_SLUG, prettySlug, LIBRARY_NOTE,
} from "@/lib/toxlibrary";

// NOTE: nutrient pages ("the foods that restore them") were removed from this
// documentation app — dietary remediation advice is care guidance, not exposure
// documentation, and it must not sit next to the founder's separate nutrition
// work. The nutrients a toxicant DISPLACES stay, as plain biology, unlinked.

export function generateStaticParams() {
  return TOXICANTS.map((t) => ({ slug: t.slug }));
}

export default async function ToxicantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = TOXICANT_BY_SLUG[slug];
  if (!t) notFound();

  return (
    <AppShell title="Exposure library">
      <article className="mx-auto max-w-2xl space-y-4">
        <Link href="/learn" className="text-xs font-medium text-brand hover:underline">← Exposure library</Link>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-ink">{t.name}</h1>
            <span className="rounded-md bg-brand/5 px-2 py-0.5 text-xs font-medium text-brand">{t.kind === "metal" ? "Heavy metal" : "Contaminant"}</span>
            {t.iarc && <span className="rounded-md bg-warn-soft px-2 py-0.5 text-xs font-medium text-warn">{t.iarc.split("(")[0].trim()}</span>}
          </div>
          <p className="mt-1.5 text-sm font-medium text-muted">{t.short}</p>
        </div>

        <Section title="Where it comes from in service"><p className="text-sm leading-relaxed text-muted">{t.where}</p></Section>

        <Section title="How it harms the body">
          {t.harm.map((p, i) => <p key={i} className="text-sm leading-relaxed text-ink">{p}</p>)}
        </Section>

        <Section title="How long it stays in you"><p className="text-sm leading-relaxed text-muted">{t.retention}</p></Section>

        {t.organs.length > 0 && (
          <Section title="Where it goes — tap an organ to go deeper">
            <div className="flex flex-wrap gap-1.5">
              {t.organs.map((o) => ORGAN_BY_SLUG[o] ? (
                <Link key={o} href={`/learn/organ/${o}`} className="rounded-md bg-brand/5 px-2.5 py-1 text-xs font-medium text-brand hover:bg-brand/10">{ORGAN_BY_SLUG[o].name} →</Link>
              ) : (
                <span key={o} className="rounded-md bg-canvas px-2.5 py-1 text-xs text-muted">{prettySlug(o)}</span>
              ))}
            </div>
          </Section>
        )}

        {/* 🔴 REMOVED: a "Minerals it displaces in the body" section listing the
            nutrients each metal interferes with. There is no validated model from
            an exposure history to a nutrient deficit in a specific person, so the
            section asserted a calculation that does not exist — and it sat one
            click from the metal chips in an app whose founder separately sells
            nutritional supplements. The underlying data has been deleted from
            toxlibrary.ts rather than unlinked; unlinked data is one refactor away
            from rendering again. Do not restore this section. */}

        <div className="overflow-hidden rounded-xl border border-success/30 bg-success-soft">
          <div className="p-4">
            <div className="text-[11px] font-bold uppercase tracking-wide text-success">What the government already links to it</div>
            <p className="mt-1 text-sm leading-relaxed text-ink">{t.conditions}</p>
          </div>
        </div>

        <div className="rounded-xl border-l-2 border-accent bg-accent/5 px-4 py-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-accent">If it goes unaddressed</div>
          <p className="mt-1 text-sm leading-relaxed text-ink">{t.untreated}</p>
        </div>

        <Section title="What to ask your clinician about">
          <ul className="space-y-1">
            {t.tests.map((q, i) => <li key={i} className="flex gap-2 text-sm leading-relaxed text-ink"><span className="text-accent">•</span>{q}</li>)}
          </ul>
        </Section>

        <div className="rounded-xl border-2 border-brand bg-brand/5 px-5 py-4">
          <p className="text-sm leading-relaxed text-ink">
            Bring this to your clinician and your VSO — they decide what testing and care, if any, is right
            for you. For general, whole-person ways to support your body, see{" "}
            <Link href="/solutions" className="font-semibold text-brand hover:underline">Whole health</Link>.
          </p>
        </div>

        <p className="border-t border-line pt-4 text-[11px] leading-relaxed text-faint">
          Sources: {t.sources.join(" · ")}. {LIBRARY_NOTE} Veterans Crisis Line: dial 988, then press 1.
        </p>
      </article>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-bold text-ink">{title}</h2>
      {children}
    </div>
  );
}
