import Link from "next/link";
import AppShell from "@/components/AppShell";
import {
  ERA_TIMELINE, CONFIRM_GAP_HEADING, CONFIRM_GAP_TEXT, CUSTODY_OPENING, CONSENT_WAIVER_FACT,
  CAUSATION_ANSWER, INJURY_TABLE_DISCLAIMER, VACCINE_INJURY_TABLE_STAMP, COUNTERMEASURES_TABLE_STAMP,
} from "@/lib/shotsCopy";

const card = "rounded-xl border border-line bg-surface p-5";

// Never filtered by anyone's service dates — that is the one rule this whole
// page exists to enforce. The app may make third-person, dated, sourced
// statements about what the government did. It may never make a second-person
// statement about what a veteran received. See scripts/coi-firewall.cjs for
// the enforced grammar and no-write-control rules.
export default function ShotsHistoryPage() {
  return (
    <AppShell title="What the rules said, and when">
      <div className="mx-auto max-w-2xl space-y-5">
        <section className={card}>
          <h2 className="text-sm font-semibold text-ink">The programme timeline</h2>
          <ol className="mt-3 space-y-3 border-l border-line pl-4">
            {ERA_TIMELINE.map((e, i) => (
              <li key={i}>
                <div className="text-xs font-semibold text-brand">{e.year}</div>
                <p className="mt-0.5 text-sm leading-relaxed text-ink">{e.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={`${card} border-dashed`}>
          <h2 className="text-sm font-semibold text-ink">{CONFIRM_GAP_HEADING}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{CONFIRM_GAP_TEXT}</p>
        </section>

        <section className={card}>
          <h2 className="text-sm font-semibold text-ink">The two federal injury-table programs</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink">{INJURY_TABLE_DISCLAIMER}</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <a href="https://www.ecfr.gov/current/title-42/chapter-I/subchapter-L/part-100" target="_blank" rel="noreferrer" className="rounded-lg border border-line bg-canvas p-4 hover:border-brand">
              <div className="text-sm font-semibold text-ink">Vaccine Injury Table</div>
              <div className="mt-1 text-xs text-muted">42 CFR 100.3 — the National Vaccine Injury Compensation Program&apos;s table.</div>
              <div className="mt-2 text-[11px] text-faint">{VACCINE_INJURY_TABLE_STAMP}</div>
            </a>
            <a href="https://www.ecfr.gov/current/title-42/chapter-I/subchapter-L/part-110" target="_blank" rel="noreferrer" className="rounded-lg border border-line bg-canvas p-4 hover:border-brand">
              <div className="text-sm font-semibold text-ink">Countermeasures Injury Tables</div>
              <div className="mt-1 text-xs text-muted">42 CFR Part 110 — a separate program covering public-health countermeasures, including one smallpox table.</div>
              <div className="mt-2 text-[11px] text-faint">{COUNTERMEASURES_TABLE_STAMP}</div>
            </a>
          </div>
        </section>

        <section className={card}>
          <h2 className="text-sm font-semibold text-ink">Custody of the record</h2>
          <div className="mt-2 space-y-3">
            {CUSTODY_OPENING.map((p, i) => <p key={i} className="text-sm leading-relaxed text-ink">{p}</p>)}
          </div>
          <p className="mt-3 border-t border-line pt-3 text-sm leading-relaxed text-muted">{CONSENT_WAIVER_FACT}</p>
        </section>

        <section className={`${card} border-brand/30 bg-brand/5`}>
          <h2 className="text-base font-bold text-ink">{CAUSATION_ANSWER[0]}</h2>
          <div className="mt-3 space-y-3">
            {CAUSATION_ANSWER.slice(1).map((p, i) => <p key={i} className="text-sm leading-relaxed text-ink">{p}</p>)}
          </div>
        </section>

        <p className="px-1 text-xs leading-relaxed text-faint">
          If you or someone you know is struggling, the Veterans Crisis Line is here 24/7 — dial 988, then press 1.
        </p>

        <Link href="/shots" className="block text-center text-xs font-medium text-brand hover:underline">← Your shot record</Link>
      </div>
    </AppShell>
  );
}
