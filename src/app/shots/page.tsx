import Link from "next/link";
import AppShell from "@/components/AppShell";
import ShotsListCard from "@/components/ShotsListCard";
import {
  INTERRUPT_SPINE, INTERRUPT_SYMPTOM_LINE, INTERRUPT_SAFETY_VALVE, INTERRUPT_FREE_DOORS,
} from "@/lib/shotsCopy";

// The custody facts — the GAO findings, the FDA's own words about why the rules
// changed — do NOT go here. This page is a working tool. The argument lives at
// /shots/history. A man who reads "the system lied to you and is still lying"
// at the top and never scrolls is a man who stops going to VA, and that is the
// likeliest harm in this whole feature.
export default function ShotsPage() {
  return (
    <AppShell title="Your shot record">
      <p className="mb-4 text-sm text-muted">The dates nobody wrote down. Build your own.</p>

      <div className="space-y-4">
        <Link
          href="/shots/record"
          className="block rounded-xl border border-brand/30 bg-brand/5 p-5 transition hover:border-brand/50"
        >
          <div className="text-sm font-semibold text-ink">Where your record actually is →</div>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            milConnect won&apos;t get you your shot record. Two questions tell you which office holds it.
          </p>
        </Link>

        <ShotsListCard />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link href="/shots/library" className="rounded-lg border border-line bg-surface p-4 text-sm font-medium text-ink hover:bg-canvas">
            What these shots were — the library →
          </Link>
          <Link href="/shots/history" className="rounded-lg border border-line bg-surface p-4 text-sm font-medium text-ink hover:bg-canvas">
            What the rules said, and when →
          </Link>
        </div>

        {/* "What would warrant getting looked at" — never "What you can do about
            it." Nothing is established to have been caused by a vaccine, so
            nothing is established to reverse. This is the honest thing that goes
            in that slot instead: the warning that's been public since 2007 and
            nobody read to them, and four free doors they're already owed. */}
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="text-sm font-semibold text-ink">What would warrant getting looked at</div>
          <p className="mt-3 text-sm leading-relaxed text-ink">{INTERRUPT_SPINE}</p>
          <p className="mt-3 text-sm leading-relaxed text-ink">{INTERRUPT_SYMPTOM_LINE}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">{INTERRUPT_SAFETY_VALVE}</p>
          <div className="mt-4 space-y-2 border-t border-line pt-4">
            {INTERRUPT_FREE_DOORS.map((d) => (
              <div key={d.name} className="text-sm">
                <span className="font-medium text-ink">{d.name}.</span> <span className="text-muted">{d.detail}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="px-1 text-xs leading-relaxed text-faint">
          This section documents. It does not diagnose, does not advise you, does not file for you, and is not
          your representative (38 CFR 14.629). If you or someone you know is struggling, the Veterans Crisis Line
          is here 24/7 — dial 988, then press 1. Text 838255.
        </p>
      </div>
    </AppShell>
  );
}
