import AppShell from "@/components/AppShell";
import Link from "next/link";
import { ServiceRibbon } from "@/components/Patriotic";
import { TOXICANTS, ORGANS, LIBRARY_NOTE } from "@/lib/toxlibrary";

export const metadata = { title: "Exposure library" };

const metals = TOXICANTS.filter((t) => t.kind === "metal");
const contaminants = TOXICANTS.filter((t) => t.kind === "contaminant");

function Group({ title, blurb, items, base }: { title: string; blurb: string; items: { slug: string; name: string; short: string }[]; base: string }) {
  return (
    <div>
      <h2 className="text-sm font-bold uppercase tracking-widest text-accent">{title}</h2>
      <p className="mt-1 text-xs text-muted">{blurb}</p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((t) => (
          <Link key={t.slug} href={`${base}/${t.slug}`} className="rounded-xl border border-line bg-surface p-3 transition hover:border-brand/40 hover:shadow-sm">
            <div className="text-sm font-semibold text-ink">{t.name}</div>
            <div className="mt-0.5 text-xs leading-snug text-muted line-clamp-2">{t.short}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function LearnIndex() {
  return (
    <AppShell title="Exposure library">
      <div className="space-y-6">
        <div>
          <ServiceRibbon className="mb-4 w-40 rounded-full opacity-90" />
          <p className="text-sm leading-relaxed text-muted">
            A plain-language encyclopedia of what your service may have exposed you to — built on the
            government&apos;s own record. Tap any exposure or body system to learn where it comes from,
            what it does in the body, the conditions the VA already links to it, and what to ask your
            clinician. This is documentation for your record — not medical advice or a treatment plan.
          </p>
        </div>

        <Group title="Heavy metals" blurb="The 16 metals the app tracks — where they store and what they do." base="/learn" items={metals} />
        <Group title="Chemicals & contaminants" blurb="Burn pits, jet fuel, solvents, PFAS, dioxins, asbestos, radiation, and more." base="/learn" items={contaminants} />
        <Group title="Organs & systems" blurb="What these exposures do to bone, marrow, brain, kidney, lungs, and more." base="/learn/organ" items={ORGANS.map((o) => ({ slug: o.slug, name: o.name, short: o.what }))} />

        <p className="border-t border-line pt-4 text-xs leading-relaxed text-faint">{LIBRARY_NOTE} Veterans Crisis Line: dial 988, then press 1.</p>
      </div>
    </AppShell>
  );
}
