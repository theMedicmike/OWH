import Link from "next/link";
import InfoPage from "@/components/InfoPage";
import PrintButton from "@/components/PrintButton";

const card = "rounded-xl border border-line bg-surface p-5";

export const metadata = { title: "For your clinician" };

// A one-page primer to hand a TREATING clinician — public, no-login, since
// the whole point is a veteran can print or link this to someone who's
// never opened this app. Not the VSO/clinician beta-feedback sheet at
// /reviewer (that one asks reviewers to critique the tool; this one orients
// a real clinician who's never heard of a DBQ before a veteran hands them a
// packet). Educational only: no per-veteran data lives on this page, so
// it's safe to print once and keep in a wallet.
export default function ClinicianPage() {
  return (
    <InfoPage
      title="For your clinician"
      intro="A one-page primer to hand your doctor, therapist, or any clinician you're asking for a medical opinion — most have never been asked to fill out VA paperwork before, and a fast orientation goes a long way."
    >
      <div className="mb-2">
        <PrintButton label="Print this page" />
      </div>

      <section className={card}>
        <h2 className="text-sm font-semibold text-ink">What&apos;s being asked of you</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink">
          Your patient is filing a VA disability claim. VA needs a medical opinion on whether a condition is{" "}
          <strong>at least as likely as not</strong> (50% or greater probability) connected to their military
          service — this is called a <strong>nexus opinion</strong>. You don&apos;t need special VA training to
          give one; you need your own clinical judgment, stated at that specific standard.
        </p>
      </section>

      <section className={card}>
        <h2 className="text-sm font-semibold text-ink">What a DBQ is</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink">
          A <strong>Disability Benefits Questionnaire (DBQ)</strong> is VA&apos;s own structured form for a
          specific condition — there&apos;s one for TBI, one for hearing, one for mental health, and dozens more.
          VA publishes them publicly; your patient or their VSO can provide the exact one that applies. Completing
          one carries the same weight as a signed nexus letter, in VA&apos;s preferred format.
        </p>
      </section>

      <section className={card}>
        <h2 className="text-sm font-semibold text-ink">What your patient&apos;s packet gives you</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink">
          The claim packet from Connecting the Dots of Service — a free tool built by a veteran-founded nonprofit
          — has a section titled <strong>&ldquo;For the reviewing clinician&rdquo;</strong> that lists the specific
          condition(s), the documented in-service exposure or event behind each one, and the exact question being
          asked. It states facts your patient logged and the government&apos;s own documented sources — never a
          diagnosis, and never a substitute for your own exam.
        </p>
      </section>

      <section className={card}>
        <h2 className="text-sm font-semibold text-ink">Two different questions, depending on the claim</h2>
        <ul className="mt-2 space-y-2 text-sm leading-relaxed text-ink">
          <li>
            <strong>Exposure-linked:</strong> is it at least as likely as not (50% or greater) related to the
            documented in-service exposure or event described in the packet?
          </li>
          <li>
            <strong>Secondary to another condition:</strong> is it at least as likely as not proximately due to,{" "}
            <strong>or aggravated by</strong>, a condition already service-connected? (38 CFR §3.310 —
            aggravation counts, and clinicians unfamiliar with VA claims often miss that it&apos;s a valid basis on
            its own.)
          </li>
        </ul>
      </section>

      <section className={card}>
        <h2 className="text-sm font-semibold text-ink">What this app is asking you to sign</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink">
          Nothing, until you&apos;re satisfied it&apos;s accurate. The packet has a signature line for your own
          opinion, in your own words — it&apos;s a hand-off, not a form to rubber-stamp. If the evidence
          doesn&apos;t support a connection, saying so is the right answer.
        </p>
      </section>

      <p className="px-1 text-xs leading-relaxed text-faint">
        This page is educational only — it carries no patient-specific data. Connecting the Dots of Service is not
        medical or legal advice, is not a diagnosis, and is not a determination of service connection.
      </p>

      <Link href="/" className="block rounded-xl border border-brand/30 bg-brand/5 p-5 text-center transition hover:border-brand/50">
        <div className="text-sm font-semibold text-ink">Learn more about Connecting the Dots of Service →</div>
      </Link>
    </InfoPage>
  );
}
