import AppShell from "@/components/AppShell";
import Link from "next/link";

const card = "rounded-xl border border-line bg-surface p-5";

// Pure records literacy — no health content, no exposure/condition claims.
// Promoted from a one-line "Start this week" bullet into its own page because
// this is consistently one of the highest-value things a veteran can do for a
// claim, and most have never heard of these specific documents by name.
export default function ExposureTimelinePage() {
  return (
    <AppShell title="Building your exposure timeline" publicPage>
      <div className="mx-auto max-w-2xl space-y-5">
        <p className="text-sm leading-relaxed text-muted">
          Becoming your own historian is one of the highest-value things you can do for a claim — and most
          veterans have never heard of these specific records by name. This app builds the timeline for you
          as you log your service, but here&apos;s what backs it up on paper.
        </p>

        <section className={card}>
          <h2 className="text-sm font-semibold text-ink">Your service treatment record</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            The single most important document. It&apos;s held by different offices depending on your branch
            and when you separated — check the National Archives&apos; published routing for veterans&apos;
            service records to find yours.
          </p>
        </section>

        <section className={card}>
          <h2 className="text-sm font-semibold text-ink">Deck logs and unit deployment history</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            For Navy and Marine Corps service, deck logs from your ship can establish exactly where you were
            on a given date. For any branch, your unit&apos;s deployment history and command chronology can
            place you at a specific installation or operation even when your own memory of the exact dates
            has faded. Request these through the National Archives and Records Administration (NARA) or your
            branch&apos;s official history office.
          </p>
        </section>

        <section className={card}>
          <h2 className="text-sm font-semibold text-ink">The Airborne Hazards and Open Burn Pit Registry</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            Since a 1 August 2024 redesign, there is no separate questionnaire to fill out — VA and DoD now
            auto-include eligible veterans based on service records. Ask your VA Environmental Health
            Coordinator whether a registry evaluation is available to you, rather than looking for a form to
            fill in yourself.
          </p>
        </section>

        <section className={card}>
          <h2 className="text-sm font-semibold text-ink">Your own logged record</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            List where and when you served and what you were exposed to, beside your symptoms in the order
            they arrived. Bring that one page to every appointment — this app builds it for you as you go,
            and your own words on each check-in are often the strongest evidence you have.
          </p>
          <Link href="/map" className="mt-2 inline-block text-xs font-semibold text-brand hover:underline">Log where you served →</Link>
        </section>

        <p className="px-1 text-xs leading-relaxed text-faint">
          This page documents where records live — it doesn&apos;t file anything or determine what applies to
          you. Bring what you gather to an accredited VSO.
        </p>

        <Link href="/learn" className="block text-center text-xs font-medium text-brand hover:underline">← Exposure library</Link>
      </div>
    </AppShell>
  );
}
