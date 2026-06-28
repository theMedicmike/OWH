import AppShell from "@/components/AppShell";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NUTRIENTS, NUTRIENT_BY_SLUG, TOXICANT_NAME_TO_SLUG, LIBRARY_NOTE } from "@/lib/toxlibrary";

export function generateStaticParams() {
  return NUTRIENTS.map((n) => ({ slug: n.slug }));
}

export default async function NutrientPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const n = NUTRIENT_BY_SLUG[slug];
  if (!n) notFound();

  return (
    <AppShell title="Exposure library">
      <article className="mx-auto max-w-2xl space-y-4">
        <Link href="/learn" className="text-xs font-medium text-brand hover:underline">← Exposure library</Link>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-ink">{n.name}</h1>
            <span className="rounded-md bg-success-soft px-2 py-0.5 text-xs font-medium text-success">Nutrient</span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{n.role}</p>
        </div>

        <div className="rounded-xl border-l-2 border-accent bg-accent/5 px-4 py-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-accent">Toxic metals that push it out</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {n.displacedBy.map((name) => TOXICANT_NAME_TO_SLUG[name] ? (
              <Link key={name} href={`/learn/${TOXICANT_NAME_TO_SLUG[name]}`} className="rounded-md bg-brand/5 px-2.5 py-1 text-xs font-medium text-brand hover:bg-brand/10">{name} →</Link>
            ) : (
              <span key={name} className="rounded-md bg-canvas px-2.5 py-1 text-xs text-muted">{name}</span>
            ))}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-ink">When these metals are present, the body holds less {n.name.toLowerCase()} — so replenishing it through food can help your body do its repair work.</p>
        </div>

        <div className="overflow-hidden rounded-xl border border-success/30 bg-success-soft p-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-success">Foods that help restore it</div>
          <ul className="mt-1.5 space-y-1">
            {n.restore.map((f, i) => <li key={i} className="flex gap-2 text-sm leading-relaxed text-ink"><span className="text-success">•</span>{f}</li>)}
          </ul>
        </div>

        <div className="rounded-xl border border-warn/30 bg-warn-soft p-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-warn">What can work against it</div>
          <ul className="mt-1.5 space-y-1">
            {n.hinder.map((f, i) => <li key={i} className="flex gap-2 text-sm leading-relaxed text-ink"><span className="text-warn">•</span>{f}</li>)}
          </ul>
        </div>

        <p className="border-t border-line pt-4 text-[11px] leading-relaxed text-faint">
          This is general nutrition education, not a treatment plan — confirm what&apos;s right for you with your
          clinician (some nutrients must be balanced carefully, especially with kidney disease). {LIBRARY_NOTE}{" "}
          Veterans Crisis Line: dial 988, then press 1.
        </p>
      </article>
    </AppShell>
  );
}
