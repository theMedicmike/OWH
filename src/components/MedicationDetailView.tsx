import Link from "next/link";
import type { Medication } from "@/lib/medications";
import type { DrugLabelResult } from "@/lib/medicationLabels";
import { formatEffectiveTime } from "@/lib/medicationLabels";

// THE MEDICATION DETAIL PAGE — the whole feature's payoff, and the screen the
// council spec constrains most tightly. What renders here:
//
//   • the FDA's own label text, quoted verbatim and sourced
//   • the REAL VA diagnostic code (number + name + CFR) for conditions that
//     label actually names
//   • 38 CFR 3.310 stated once, as the doctrine that makes any of it relevant
//   • a handoff to a VSO or clinician
//
// What must never render here, per the 2026-08-12 council and enforced by
// scripts/coi-firewall.cjs rule 12:
//
//   • a percentage, a rating tier table, or a dollar figure
//   • a count header ("8 disabilities you may be able to claim") — that number
//     primes exactly the way a percentage does
//   • any button that writes a side effect into a claim, a disability list, or
//     a symptom timeline
//   • an app-written causal sentence. The label's own words, or nothing.

function SourceLine({ result }: { result: Extract<DrugLabelResult, { status: "ok" }> }) {
  const when = formatEffectiveTime(result.label.effectiveTime);
  const bits = [
    result.label.manufacturer,
    result.label.productType,
    when ? `label version ${when}` : null,
  ].filter(Boolean);
  return (
    <p className="mt-3 text-[11px] leading-relaxed text-faint">
      Source: openFDA drug label{bits.length ? ` — ${bits.join(" · ")}` : ""}. Quoted word for word from the
      manufacturer&apos;s FDA-approved labeling. We don&apos;t rewrite it, summarize it, or interpret it.{" "}
      <a href="https://open.fda.gov/apis/drug/label/" target="_blank" rel="noreferrer" className="text-brand hover:underline">
        About this data →
      </a>
    </p>
  );
}

export default function MedicationDetailView({
  medication,
  result,
}: {
  medication: Medication;
  result: DrugLabelResult;
}) {
  const when =
    medication.started_year && medication.stopped_year
      ? `${medication.started_year}–${medication.stopped_year}`
      : medication.started_year && medication.still_taking
      ? `since ${medication.started_year}`
      : medication.started_year
      ? `from ${medication.started_year}`
      : medication.still_taking
      ? "still taking"
      : null;

  return (
    <article className="mx-auto max-w-2xl space-y-5">
      <Link href="/medications" className="text-xs font-medium text-brand hover:underline">
        ← Your medications
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{medication.name}</h1>
        <p className="mt-1 text-sm text-muted">
          {medication.taken_for ? `You take this for ${medication.taken_for}.` : "No reason noted yet."}
          {when ? ` ${when.charAt(0).toUpperCase()}${when.slice(1)}.` : ""}
        </p>
        {medication.note && (
          <p className="mt-2 rounded-lg border border-line bg-canvas px-3 py-2 text-[13px] italic leading-relaxed text-ink/85">
            &ldquo;{medication.note}&rdquo;
          </p>
        )}
      </div>

      {/* The doctrine, stated once, before anything else — it is the reason
          this page exists at all, and the competitor product never explains it. */}
      <section className="rounded-xl border border-brand/30 bg-brand/5 p-5">
        <h2 className="text-sm font-semibold text-ink">Why this can matter to a claim</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink">
          Under <strong>38 CFR §3.310</strong>, a condition that was <em>caused or made worse by treatment</em> for
          a disability already connected to your service can sometimes be claimed as secondary.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          That route needs three things, and this page can only help with one of them: a{" "}
          <strong>current diagnosis</strong> in your medical records, <strong>documentation</strong> of what you
          took and for how long, and a <strong>medical opinion</strong> connecting the two. Nothing below says you
          have any condition, or that this medication caused anything for you — only what the FDA&apos;s label
          reports and how VA codes those conditions when they are diagnosed and connected by someone qualified.
        </p>
      </section>

      {result.status === "not-found" && (
        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold text-ink">No FDA label found for this name</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Your entry is saved either way — this only means the FDA&apos;s label database didn&apos;t match that
            spelling. Try the generic name rather than the brand (or the other way round), or check the spelling on
            the bottle. Combination medications sometimes need both parts, like
            &ldquo;hydrocodone acetaminophen.&rdquo;
          </p>
        </section>
      )}

      {result.status === "unavailable" && (
        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold text-ink">Couldn&apos;t reach the FDA&apos;s label database</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {result.message} Your entry is saved — nothing is lost. Try again in a little while.
          </p>
        </section>
      )}

      {result.status === "ok" && (
        <>
          {result.effects.length > 0 && (
            <section className="rounded-xl border border-line bg-surface p-5">
              <h2 className="text-sm font-semibold text-ink">
                Conditions this label names, and how VA codes them
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-faint">
                These appear in this drug&apos;s own FDA label. Appearing here does <strong>not</strong> mean you
                have them, that this medication caused them, or that you can claim them — it means that if a
                clinician has diagnosed one and connects it to your treatment, this is the code VA rates it under.
              </p>
              <ul className="mt-3 space-y-3">
                {result.effects.map((e) => (
                  <li key={e.key} className="rounded-lg border border-line bg-canvas p-3">
                    <div className="text-sm font-semibold text-ink">{e.label}</div>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{e.plain}</p>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-ink/80">{e.why}</p>
                    <div className="mt-2 border-t border-line pt-2">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                        How VA codes this
                      </div>
                      <ul className="mt-1 space-y-0.5">
                        {e.diagnosticCodes.map((dc) => (
                          <li key={dc.code} className="text-[12px] leading-relaxed text-ink">
                            <span className="font-mono font-semibold">DC {dc.code}</span> — {dc.name}{" "}
                            <span className="text-faint">({dc.cfr})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {/* The honesty layer. Where VA has no code that actually
                        fits, this says so out loud instead of quietly pointing
                        at a near-miss code and letting a veteran assume. */}
                    {e.limitation && (
                      <p className="mt-2 rounded-md border border-warn/30 bg-warn-soft px-2.5 py-2 text-[12px] leading-relaxed text-ink">
                        <span className="font-semibold">Worth knowing: </span>
                        {e.limitation}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                Ask your VSO or clinician whether any of this applies to your case. That call is theirs, not this
                app&apos;s.
              </p>
            </section>
          )}

          <section className="rounded-xl border border-line bg-surface p-5">
            <h2 className="text-sm font-semibold text-ink">The FDA label, word for word</h2>
            <p className="mt-1 text-xs leading-relaxed text-faint">
              This is the manufacturer&apos;s FDA-approved labeling as published by the FDA. It describes what has
              been reported for this medication generally — never a statement about you.
            </p>
            <div className="mt-3 space-y-4">
              {result.label.sections.map((s) => (
                <div key={s.key}>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-accent">{s.title}</div>
                  <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-ink">{s.text}</p>
                </div>
              ))}
            </div>
            <SourceLine result={result} />
          </section>
        </>
      )}

      <div className="rounded-xl border border-scarlet/30 bg-scarlet/5 px-4 py-3">
        <p className="text-[13px] leading-relaxed text-ink">
          <strong>Never stop or change a prescription because of anything on this page.</strong> Some of these
          medications are dangerous to stop suddenly. That conversation belongs with the clinician who prescribed
          it.
        </p>
      </div>

      <p className="px-1 text-xs leading-relaxed text-faint">
        This page documents. It does not diagnose, does not advise you, does not file for you, and is not your
        representative (38 CFR 14.629). If you or someone you know is struggling, the Veterans Crisis Line is here
        24/7 — dial 988, then press 1.
      </p>

      <Link href="/medications" className="block text-center text-xs font-medium text-brand hover:underline">
        ← Your medications
      </Link>
    </article>
  );
}
