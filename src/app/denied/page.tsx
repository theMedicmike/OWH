import Link from "next/link";
import AppShell from "@/components/AppShell";
import { VA_FORMS } from "@/lib/nextaction";

const card = "rounded-xl border border-line bg-surface p-5";

// A dedicated door for a veteran arriving at a specific, hard moment — not a
// new capability, a reframing of what already exists (VA_FORMS, the witness-
// statement flow, Connect the Dots) for someone who already has a denial in
// hand. Descriptive, never prescriptive: three lanes explained, no "you
// should file X" — that call stays with the VSO, same as everywhere else in
// this app.
export default function DeniedPage() {
  return (
    <AppShell title="A denial isn't the end">
      <div className="mx-auto max-w-2xl space-y-5">
        <p className="text-sm leading-relaxed text-muted">
          Most denials come down to evidence, not merit. The next step is understanding what was missing and
          building it — not guessing.
        </p>

        <section className={card}>
          <h2 className="text-sm font-semibold text-ink">Why claims usually get denied</h2>
          <ul className="mt-3 space-y-3 text-sm">
            <li>
              <span className="font-semibold text-ink">No documented connection to service.</span>{" "}
              <span className="text-muted">The most common reason. Connect the Dots shows you which of your
              conditions have a documented link to something you logged — and which don&apos;t yet.</span>
            </li>
            <li>
              <span className="font-semibold text-ink">Not enough evidence.</span>{" "}
              <span className="text-muted">A statement from someone who was there — a battle buddy, or someone
              off this app entirely — can be exactly what a supplemental claim needs.</span>
            </li>
            <li>
              <span className="font-semibold text-ink">No current diagnosis on file.</span>{" "}
              <span className="text-muted">If the condition isn&apos;t formally diagnosed yet, that&apos;s a
              conversation with your clinician before it&apos;s a conversation with the VA.</span>
            </li>
          </ul>
        </section>

        <section className={card}>
          <h2 className="text-sm font-semibold text-ink">Your three lanes</h2>
          <div className="mt-3 space-y-4">
            {[VA_FORMS.supplemental, VA_FORMS.hlr, VA_FORMS.board].map((f) => (
              <div key={f.number} className="border-l-2 border-brand/30 pl-3">
                <div className="text-sm font-semibold text-ink">{f.name} <span className="font-normal text-muted">({f.number})</span></div>
                <p className="mt-1 text-sm leading-relaxed text-muted">{f.blurb}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-faint">
            This app documents. It doesn&apos;t tell you which lane to pick — that&apos;s exactly the call an
            accredited VSO is there to help you make.
          </p>
        </section>

        <section className={card}>
          <h2 className="text-sm font-semibold text-ink">Build a stronger case</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link href="/journey" className="rounded-lg border border-line bg-canvas p-3 text-sm font-medium text-ink hover:border-brand">
              Check your documented links →
            </Link>
            <Link href="/buddies" className="rounded-lg border border-line bg-canvas p-3 text-sm font-medium text-ink hover:border-brand">
              Ask someone to corroborate →
            </Link>
            <Link href="/health" className="rounded-lg border border-line bg-canvas p-3 text-sm font-medium text-ink hover:border-brand">
              Review your conditions →
            </Link>
            <Link href="/report" className="rounded-lg border border-line bg-canvas p-3 text-sm font-medium text-ink hover:border-brand">
              Rebuild your packet →
            </Link>
          </div>
        </section>

        <Link href="/vso" className="block rounded-xl border border-brand/30 bg-brand/5 p-5 text-center transition hover:border-brand/50">
          <div className="text-sm font-semibold text-ink">Find a VSO to review your next filing →</div>
          <div className="mt-1 text-xs text-muted">Free, every time, no matter which VSO you pick.</div>
        </Link>

        <Link href="/dashboard" className="block text-center text-xs font-medium text-brand hover:underline">← Back to your record</Link>
      </div>
    </AppShell>
  );
}
