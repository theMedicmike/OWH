import AppShell from "@/components/AppShell";
import Link from "next/link";
import { TOXICANTS, ORGANS, LIBRARY_NOTE } from "@/lib/toxlibrary";
import { Chevron } from "@/components/ui";

// Counts come from the data, not a typed-in number, so the description can't
// claim 30 pages after someone adds the 31st.
export const metadata = {
  title: "Exposure library",
  description: `Plain-English pages on ${TOXICANTS.length} exposures veterans carried home — burn pits, Agent Orange, Camp Lejeune water, heavy metals and more — plus ${ORGANS.length} organ systems: where each came from in service, what it does in the body, and the conditions the government already links to it.`,
  alternates: { canonical: "/learn" },
};

const metals = TOXICANTS.filter((t) => t.kind === "metal");
const contaminants = TOXICANTS.filter((t) => t.kind === "contaminant");
const topics = TOXICANTS.filter((t) => t.kind === "topic");

type Item = { slug: string; name: string; short: string };

const GROUPS: { id: string; title: string; blurb: string; base: string; items: Item[] }[] = [
  { id: "metals", title: "Heavy metals", blurb: "The metals the app tracks, where they store, and what they do.", base: "/learn", items: metals },
  { id: "chemicals", title: "Chemicals and contaminants", blurb: "Burn pits, jet fuel, solvents, PFAS, dioxins, asbestos, radiation, and more.", base: "/learn", items: contaminants },
  { id: "topics", title: "Topic guides", blurb: "TBI, hearing, cancer screening, and sleep apnea. Same documented, cited approach.", base: "/learn", items: topics },
  { id: "organs", title: "Organs and systems", blurb: "What these exposures do to bone, marrow, brain, kidney, lungs, and more.", base: "/learn/organ", items: ORGANS.map((o) => ({ slug: o.slug, name: o.name, short: o.what })) },
];

const GUIDES = [
  { href: "/learn/timeline", name: "Building your exposure timeline", short: "Deck logs, NARA requests, the burn pit registry." },
  { href: "/learn/women-veterans", name: "Women veterans and service", short: "Deployment roles, MST care, and where the real resources are." },
  { href: "/learn/korea", name: "Korea: the cold and the DMZ", short: "Cold injury, the DMZ herbicide dates, records and family benefits." },
  { href: "/cp-exam", name: "Your C&P exam, demystified", short: "What it is, who examines you, and how to prepare." },
  { href: "/clinician", name: "A primer for your clinician", short: "Print it and hand it over: what a DBQ and a nexus opinion are." },
];

// One list per group, one entry per line. A list reads top to bottom; the
// old grid of fifty same-size boxes gave the eye nowhere to start.
function Group({ id, title, blurb, items, base }: { id: string; title: string; blurb: string; items: Item[]; base: string }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
      <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted">{blurb}</p>
      <div className="card mt-3 overflow-hidden">
        {items.map((t) => (
          <Link key={t.slug} href={`${base}/${t.slug}`} className="row group">
            <span className="min-w-0 flex-1">
              <span className="block text-[0.9375rem] font-semibold leading-snug">{t.name}</span>
              <span className="mt-0.5 block text-sm leading-snug text-muted">{t.short}</span>
            </span>
            <Chevron className="text-faint transition-colors group-hover:text-ink" />
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function LearnIndex() {
  return (
    <AppShell title="Exposure library" publicPage>
      <div className="space-y-8">
        <div>
          <p className="display text-[1.75rem] text-ink sm:text-[2rem]">
            What your service may have exposed you to, in plain language.
          </p>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
            Built on the government&apos;s own record. Open any exposure or body system to learn where it comes
            from, what it does in the body, the conditions the VA already links to it, and what to ask your
            clinician. This is documentation for your record, not medical advice or a treatment plan.
          </p>
          <nav aria-label="On this page" className="mt-4 flex flex-wrap gap-2">
            {GROUPS.map((g) => (
              <a key={g.id} href={`#${g.id}`} className="btn btn-secondary btn-sm">{g.title}</a>
            ))}
            <a href="#guides" className="btn btn-secondary btn-sm">Guides</a>
          </nav>
        </div>

        {GROUPS.map((g) => <Group key={g.id} {...g} />)}

        <section id="guides" className="scroll-mt-20">
          <h2 className="text-lg font-semibold tracking-tight text-ink">Guides</h2>
          <div className="card mt-3 overflow-hidden">
            {GUIDES.map((g) => (
              <Link key={g.href} href={g.href} className="row group">
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.9375rem] font-semibold leading-snug">{g.name}</span>
                  <span className="mt-0.5 block text-sm leading-snug text-muted">{g.short}</span>
                </span>
                <Chevron className="text-faint transition-colors group-hover:text-ink" />
              </Link>
            ))}
          </div>
        </section>

        <p className="border-t border-line pt-5 text-sm leading-relaxed text-muted">{LIBRARY_NOTE} Veterans Crisis Line: dial 988, then press 1.</p>
      </div>
    </AppShell>
  );
}
