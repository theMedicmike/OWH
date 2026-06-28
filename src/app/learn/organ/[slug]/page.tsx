import AppShell from "@/components/AppShell";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ORGANS, ORGAN_BY_SLUG, TOXICANT_NAME_TO_SLUG, LIBRARY_NOTE } from "@/lib/toxlibrary";

export function generateStaticParams() {
  return ORGANS.map((o) => ({ slug: o.slug }));
}

export default async function OrganPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const o = ORGAN_BY_SLUG[slug];
  if (!o) notFound();

  return (
    <AppShell title="Exposure library">
      <article className="mx-auto max-w-2xl space-y-4">
        <Link href="/learn" className="text-xs font-medium text-brand hover:underline">← Exposure library</Link>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-ink">{o.name}</h1>
            <span className="rounded-md bg-brand/5 px-2 py-0.5 text-xs font-medium text-brand">Organ / system</span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{o.what}</p>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-bold text-ink">What toxicants do here</h2>
          {o.mechanism.map((p, i) => <p key={i} className="text-sm leading-relaxed text-ink">{p}</p>)}
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-bold text-ink">What targets it — tap to learn each one</h2>
          <div className="flex flex-wrap gap-1.5">
            {o.targetedBy.map((name) => TOXICANT_NAME_TO_SLUG[name] ? (
              <Link key={name} href={`/learn/${TOXICANT_NAME_TO_SLUG[name]}`} className="rounded-md bg-brand/5 px-2.5 py-1 text-xs font-medium text-brand hover:bg-brand/10">{name} →</Link>
            ) : (
              <span key={name} className="rounded-md bg-canvas px-2.5 py-1 text-xs text-muted">{name}</span>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-success/30 bg-success-soft p-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-success">What the government already links to it</div>
          <p className="mt-1 text-sm leading-relaxed text-ink">{o.conditions}</p>
        </div>

        <div className="rounded-xl border-l-2 border-accent bg-accent/5 px-4 py-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-accent">If it goes unaddressed</div>
          <p className="mt-1 text-sm leading-relaxed text-ink">{o.untreated}</p>
        </div>

        <div className="rounded-xl border-2 border-brand bg-brand/5 px-5 py-4">
          <p className="text-sm leading-relaxed text-ink">
            Bring this to your clinician and your VSO — they decide what testing and care, if any, is right
            for you. For general, whole-person ways to support your body, see{" "}
            <Link href="/solutions" className="font-semibold text-brand hover:underline">Solutions</Link>.
          </p>
        </div>

        <p className="border-t border-line pt-4 text-[11px] leading-relaxed text-faint">{LIBRARY_NOTE} Veterans Crisis Line: dial 988, then press 1.</p>
      </article>
    </AppShell>
  );
}
