import Link from "next/link";
import AppShell from "@/components/AppShell";

const card = "rounded-xl border border-line bg-surface p-5";

const TIMELINE = [
  { when: "180 days out", title: "You can start filing", detail: "The earliest day of the BDD window. Start logging where you served and what you were exposed to now, while your memory and your unit are both close." },
  { when: "150–120 days out", title: "Build your record", detail: "Log your service locations, exposures, and conditions here. Ask a battle buddy — or anyone off this app — to corroborate what they witnessed while you're all still in touch." },
  { when: "90 days out", title: "Last day to file under full BDD", detail: "Your claim must be submitted by 90 days before separation to qualify for the full BDD program." },
  { when: "Before separation", title: "Finish your medical separation exams", detail: "VA requires the Separation Health Assessment (Part A) and full completion of the VA/DoD medical separation exam process before you leave. Be available for VA exams within 45 days of filing." },
  { when: "Separation day", title: "The goal: no gap in coverage", detail: "BDD exists so a rating decision is ready close to the day you leave — not months of waiting after you're already out." },
];

// Procedural and sourced only — never a claim about what any individual
// veteran will receive or when. This is the VA's own program, described
// plainly, gated to the population it actually applies to (still serving).
export default function BddPage() {
  return (
    <AppShell title="File before you separate">
      <div className="mx-auto max-w-2xl space-y-5">
        <p className="text-sm leading-relaxed text-muted">
          Benefits Delivery at Discharge (BDD) lets you file your VA disability claim while you&apos;re still
          serving — between 180 and 90 days before your separation date — instead of waiting until you&apos;re
          already out.
        </p>

        <section className={card}>
          <h2 className="text-sm font-semibold text-ink">Your window</h2>
          <ol className="mt-3 space-y-4 border-l border-line pl-4">
            {TIMELINE.map((t) => (
              <li key={t.when}>
                <div className="text-xs font-semibold text-brand">{t.when}</div>
                <div className="mt-0.5 text-sm font-medium text-ink">{t.title}</div>
                <p className="mt-0.5 text-sm leading-relaxed text-muted">{t.detail}</p>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-[11px] leading-relaxed text-faint">
            Source: VA.gov, Benefits Delivery at Discharge. Retrieved 2026-08-09. This app documents your record —
            it does not file your claim or determine your rating.
          </p>
        </section>

        <section className={card}>
          <h2 className="text-sm font-semibold text-ink">Missed the window?</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            You can still file after separation — BDD just gives you the fastest path with the least gap. Nothing
            here is worse for having waited; it just means filing the standard way once you&apos;re out.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link href="/map" className="rounded-lg border border-line bg-surface p-4 text-sm font-medium text-ink hover:border-brand">
            Log where you served →
          </Link>
          <Link href="/buddies" className="rounded-lg border border-line bg-surface p-4 text-sm font-medium text-ink hover:border-brand">
            Ask someone to corroborate now →
          </Link>
        </div>

        <Link href="/vso" className="block rounded-xl border border-brand/30 bg-brand/5 p-5 text-center transition hover:border-brand/50">
          <div className="text-sm font-semibold text-ink">Find a VSO to review your BDD claim →</div>
          <div className="mt-1 text-xs text-muted">Free, every time — many VSOs specialize in BDD filings.</div>
        </Link>

        <Link href="/dashboard" className="block text-center text-xs font-medium text-brand hover:underline">← Back to your record</Link>
      </div>
    </AppShell>
  );
}
