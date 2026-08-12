import Link from "next/link";
import AppShell from "@/components/AppShell";

const card = "rounded-xl border border-line bg-surface p-5";

// A dedicated door for a specific moment: a veteran who just got a C&P exam
// letter and doesn't know what it is. Descriptive, never prescriptive — same
// posture as /denied and /bdd. Nothing here schedules, reschedules, or
// predicts an outcome; VA.gov and the exam contractor's own letter are
// authoritative for both.
export default function CpExamPage() {
  return (
    <AppShell title="Your C&P exam, demystified">
      <div className="mx-auto max-w-2xl space-y-5">
        <p className="text-sm leading-relaxed text-muted">
          If a letter showed up mentioning a &ldquo;C&amp;P exam&rdquo; and nobody explained what that means, here&apos;s
          the plain version.
        </p>

        <section className={card}>
          <h2 className="text-sm font-semibold text-ink">What it is</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            C&amp;P stands for <strong>Compensation &amp; Pension</strong>. It&apos;s an exam VA orders after you file a
            disability claim, to get current medical evidence on the conditions you&apos;re claiming — this app
            can document your service and your exposures, but it can&apos;t examine you, and VA needs an
            examiner&apos;s findings before a rater can decide your claim.
          </p>
        </section>

        <section className={card}>
          <h2 className="text-sm font-semibold text-ink">Who actually examines you</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            Usually not your own doctor. VA schedules these through a contracted network of examiners — companies
            like QTC, LHI, or VES show up most often on the scheduling letter — or sometimes directly through a VA
            medical center. That&apos;s normal, not a sign something&apos;s wrong. The exam can be in person or by
            video (telehealth), depending on what VA scheduled.
          </p>
        </section>

        <section className={card}>
          <h2 className="text-sm font-semibold text-ink">What the exam actually is</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            The examiner works through a <strong>Disability Benefits Questionnaire (DBQ)</strong> — a structured
            form specific to your condition (there are DBQs for TBI, hearing, mental health, joints, and dozens
            more). They ask about your symptoms, review what&apos;s in your file, and often do a physical or
            psychological exam. Their job is to answer VA&apos;s specific medical questions — not to decide your
            rating. That decision is made later, by a rater, using the DBQ along with everything else in your
            file.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            The clinician hand-off sheet in your <Link href="/report" className="font-semibold text-brand hover:underline">claim packet</Link> asks
            almost the same kind of question a DBQ does — that&apos;s deliberate.
          </p>
        </section>

        <section className={card}>
          <h2 className="text-sm font-semibold text-ink">How to prepare</h2>
          <ul className="mt-2 space-y-2 text-sm leading-relaxed text-ink">
            <li>• Bring or reference your <Link href="/report" className="font-semibold text-brand hover:underline">claim packet</Link> — it lays out what you&apos;re claiming and why, in one place.</li>
            <li>• Describe your worst days, not your best ones. A lot of veterans undersell themselves trying to be tough or polite — this exam is not the place for that.</li>
            <li>• Be specific about what the condition actually stops you from doing, not just that it hurts. &ldquo;I can&apos;t kneel to work on my truck anymore&rdquo; says more than &ldquo;my knee hurts.&rdquo;</li>
            <li>• Answer only what&apos;s asked, honestly. Guessing, minimizing, or exaggerating both cut against you the same way.</li>
            <li>• If it&apos;s a video exam, treat it like the real thing — good lighting, a quiet room, and enough time set aside.</li>
          </ul>
        </section>

        <section className={card}>
          <h2 className="text-sm font-semibold text-ink">If you can&apos;t make it</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            Reschedule through VA — call the number on your letter or use VA.gov — as early as you can, and keep
            a record that you asked. Missing a scheduled exam without a good reason can result in your claim
            being decided on the evidence already in your file, or denied outright (38 CFR §3.326, §3.655). This
            app can&apos;t schedule or reschedule anything for you.
          </p>
        </section>

        <section className={card}>
          <h2 className="text-sm font-semibold text-ink">After the exam</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            The examiner&apos;s findings go into your file. You typically don&apos;t see the report itself right
            away, and the examiner doesn&apos;t tell you the outcome at the appointment — a rater decides later,
            using the DBQ along with your service record and everything else you&apos;ve submitted. If your claim
            is later denied, <Link href="/denied" className="font-semibold text-brand hover:underline">this app has a page for what to do next →</Link>.
          </p>
        </section>

        <a
          href="https://www.va.gov/disability/va-claim-exam/"
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl border border-brand/30 bg-brand/5 p-5 text-center transition hover:border-brand/50"
        >
          <div className="text-sm font-semibold text-ink">VA&apos;s own page on claim exams →</div>
          <div className="mt-1 text-xs text-muted">va.gov — scheduling, what to expect, and how to reschedule</div>
        </a>

        <p className="px-1 text-xs leading-relaxed text-faint">
          This page documents and explains. It doesn&apos;t schedule your exam, doesn&apos;t predict its outcome, and
          isn&apos;t medical or legal advice. An accredited VSO can answer questions specific to your claim, free.
        </p>

        <Link href="/dashboard" className="block text-center text-xs font-medium text-brand hover:underline">← Back to your record</Link>
      </div>
    </AppShell>
  );
}
