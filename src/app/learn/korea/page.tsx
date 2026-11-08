import AppShell from "@/components/AppShell";
import Link from "next/link";
import { BOOK_SITE } from "@/lib/bookVisibility";

const card = "rounded-xl border border-line bg-surface p-5";
const h2 = "text-sm font-semibold text-ink";
const body = "mt-2 text-sm leading-relaxed text-ink";
const list = "mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink";
const cta = "mt-3 inline-block text-xs font-semibold text-brand hover:underline";

export const metadata = {
  title: "Korea: the cold and the DMZ",
  description:
    "For Korean War and DMZ veterans and their families: cold injury residuals, the Korean DMZ herbicide presumption from September 1, 1967 to August 31, 1971, the records to request, and the benefits survivors and children can claim.",
  alternates: { canonical: "/learn/korea" },
};

// Written to match the book chapter "Korea: The Cold That Stayed". If one
// changes, check the other. Same rule as lib/presumptive.ts: say what the law
// covers, never whether this reader is covered. Facts checked against the
// sources listed at the bottom of the page on 2026-11-08.
const SOURCES = [
  { label: "38 CFR §4.104, Diagnostic Code 7122 (cold injury residuals)", href: "https://www.ecfr.gov/current/title-38/section-4.104" },
  { label: "38 CFR §3.309(c) and §3.307(a)(5) (former prisoners of war)", href: "https://www.ecfr.gov/current/title-38/section-3.309" },
  { label: "38 U.S.C. §1154(b) (combat veterans' own accounts)", href: "https://www.govinfo.gov/link/uscode/38/1154" },
  { label: "38 U.S.C. §1116B (Korean DMZ presumption)", href: "https://www.govinfo.gov/link/uscode/38/1116b" },
  { label: "38 CFR §3.307(a)(6)(iv) (the regulation that still prints April 1, 1968)", href: "https://www.ecfr.gov/current/title-38/section-3.307" },
  { label: "VA: Agent Orange exposure in the Korean DMZ", href: "https://www.publichealth.va.gov/exposures/agentorange/locations/korea.asp" },
  { label: "VA: Benefits for children with spina bifida", href: "https://www.va.gov/disability/eligibility/special-claims/birth-defects/" },
  { label: "National Archives: the 1973 records fire", href: "https://www.archives.gov/personnel-records-center/fire-1973" },
];

export default function KoreaPage() {
  return (
    <AppShell title="Korea: the cold and the DMZ" publicPage>
      <div className="mx-auto max-w-2xl space-y-5">
        <p className="text-sm leading-relaxed text-muted">
          Korea left two different records in the body. One came from the winter of 1950. The other came from
          the ground along the DMZ in the late 1960s. The rules for each are different, so start with the one
          that matches the service you are tracing, whether it was yours or a parent&apos;s.
        </p>

        <nav aria-label="On this page" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <a href="#cold" className="block rounded-xl border border-brand/30 bg-brand/5 p-4 transition hover:border-brand/50">
            <div className="text-sm font-semibold text-ink">The cold →</div>
            <div className="mt-1 text-xs text-muted">Frostbite and what it left behind, Chosin and every other winter.</div>
          </a>
          <a href="#dmz" className="block rounded-xl border border-brand/30 bg-brand/5 p-4 transition hover:border-brand/50">
            <div className="text-sm font-semibold text-ink">The DMZ →</div>
            <div className="mt-1 text-xs text-muted">Herbicide service between September 1967 and August 1971.</div>
          </a>
        </nav>

        <section id="cold" className={`${card} scroll-mt-20`}>
          <h2 className={h2}>The cold does not end when the body thaws</h2>
          <p className={body}>
            VA rates this under its own name: <strong>cold injury residuals</strong>. It reaches any part of the
            body that froze, and each hand, foot, ear or nose is evaluated separately. Ask for it by that name.
            Otherwise the same symptoms tend to get filed under old age, poor circulation or diabetes.
          </p>
          <p className={body}>Tell the examiner about every one of these that is true, in every part that froze:</p>
          <ul className={list}>
            <li>Pain, numbness or cold sensitivity</li>
            <li>Color changes, nail changes, or skin or tissue loss</li>
            <li>Places where you can no longer feel normally</li>
            <li>Sweating too much, or not at all</li>
            <li>Stiff or deformed joints, or arthritis on an X-ray</li>
          </ul>
          <p className={body}>
            VA&apos;s rule also says some complications are evaluated on their own: amputated fingers or toes,
            squamous cell skin cancer at the site of a cold injury scar, peripheral neuropathy, and
            Raynaud&apos;s. Burning feet that were blamed on diabetes are worth raising with the examiner.
          </p>
          <Link href="/injuries" className={cta}>Log the cold injury in your record →</Link>
        </section>

        <section className={card}>
          <h2 className={h2}>The hard truth about proof</h2>
          <p className={body}>
            <strong>Most Chosin veterans have no presumption.</strong> VA presumes frostbite damage is connected
            to service only for former prisoners of war, when they were held in conditions consistent with
            frostbite and the damage is at least 10 percent disabling. Everyone else has to show that the injury
            happened in service and that what they live with now traces back to it.
          </p>
          <p className={body}>
            <strong>Combat veterans get real help with the first half.</strong> If you engaged in combat with
            the enemy, VA has to accept your own account of the injury when it fits the circumstances of that
            service, even if no record of it exists. Reasonable doubt goes to the veteran. You still need a
            medical opinion tying what you have today to that winter.
          </p>
        </section>

        <section id="dmz" className={`${card} scroll-mt-20`}>
          <h2 className={h2}>The DMZ: September 1, 1967 to August 31, 1971</h2>
          <p className={body}>
            Veterans who served in or near the Korean DMZ during those dates are presumed to have been exposed
            to herbicides. They do not have to prove the exposure itself for a condition on VA&apos;s herbicide
            list, the same list Vietnam veterans use. It includes high blood pressure and MGUS, which the PACT
            Act added in 2022.
          </p>
          <p className={body}>
            <strong>Watch the date.</strong> The printed regulation still says April 1, 1968. The 2019 law says
            September 1, 1967, and VA&apos;s own pages use 1967. The law controls. If an old letter told you
            that your late 1967 or early 1968 service came too early, have a service officer check it.
          </p>
          <p className={body}>
            <strong>Two things have to be confirmed.</strong> VA and the Department of War must determine that
            your unit operated in the DMZ area and that you were physically there. Unit records, morning
            reports, your orders and a statement from someone who stood the post with you all help. A service
            officer can tell you which units are already recognized.
          </p>
          <Link href="/presumptives" className={cta}>See the herbicide list and what VA presumes →</Link>
        </section>

        <section className={card}>
          <h2 className={h2}>Where the DMZ presumption stops</h2>
          <ul className={list}>
            <li>
              <strong>Bases well south of the DMZ, including Camp Carroll.</strong> No presumption covers them.
              You can still file, but you will have to prove the exposure itself.
            </li>
            <li>
              <strong>Service after August 31, 1971.</strong> No herbicide presumption reaches it.
            </li>
            <li>
              <strong>The PACT Act burn pit lists.</strong> Korea is not on them.
            </li>
            <li>
              <strong>If you are enrolled in VA health care,</strong> you are due a toxic exposure screening at
              least once every five years. Answer every question fully, because that puts the exposure in your
              record.
            </li>
          </ul>
        </section>

        <section className={card}>
          <h2 className={h2}>What to do this week</h2>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink">
            <li>
              <strong>Write the timeline.</strong> Your unit, the months and years, where the unit was positioned,
              and your diagnoses in the order they arrived. For the cold, add how long your boots stayed on, what
              went numb and when it started to hurt again.{" "}
              <Link href="/map" className="font-semibold text-brand hover:underline">Map where you served</Link>.
            </li>
            <li>
              <strong>If the DMZ is your story, book the Agent Orange Registry health exam.</strong> It costs
              nothing, and you do not have to be enrolled in VA health care. Ask the Environmental Health
              Coordinator at your nearest VA medical center. If you are enrolled and the drive is too long,
              VET-HOME can set it up by telehealth.
            </li>
            <li>
              <strong>Find the people who were there.</strong> A statement from someone who stood next to you is
              evidence.{" "}
              <Link href="/buddies" className="font-semibold text-brand hover:underline">Ask a buddy to confirm it</Link>.
            </li>
            <li>
              <strong>If VA said no years ago, ask about reopening it.</strong> A Supplemental Claim, VA Form
              20-0995, can reopen a denial on a cold injury or on a condition that has since become presumptive.
            </li>
            <li>
              <strong>Take it to an accredited service officer.</strong> They never charge.{" "}
              <Link href="/vso" className="font-semibold text-brand hover:underline">Find a VSO</Link>.
            </li>
          </ol>
        </section>

        <section className="rounded-xl border border-brand/30 bg-brand/5 p-5">
          <h2 className={h2}>Words you can use at the appointment</h2>
          <p className="mt-2 text-sm italic leading-relaxed text-ink">
            &ldquo;I served in Korea from [month/year] to [month/year] with [unit], at [place]. That service has
            never been written into my medical record. Please document my dates and locations today, in my own
            words. I have [pain, numbness, cold sensitivity, color changes] in my [hands/feet] since that winter,
            and I want them evaluated as cold injury residuals, not as old age. I also want to schedule my Agent
            Orange Registry health exam through the Environmental Health Coordinator.&rdquo;
          </p>
          <p className="mt-2 text-xs text-muted">Say only the parts that are true for you.</p>
        </section>

        <section className={card}>
          <h2 className={h2}>If the records burned</h2>
          <p className={body}>
            On July 12, 1973, a fire at the National Personnel Records Center in St. Louis destroyed an estimated
            80 percent of the Army personnel records for soldiers discharged between November 1, 1912 and
            January 1, 1960. A veteran or next of kin can request the file online or on Standard Form 180. If it
            comes back burned or missing, ask the center to reconstruct it from other sources, such as VA claims
            files, pay records and hospital records.
          </p>
          <p className={body}>
            Records for veterans discharged less than 62 years ago are generally free to the veteran or next of
            kin. Older files, which means nearly every Korean War file, are archival and carry a copying fee, so
            ask first.
          </p>
          <Link href="/learn/timeline" className={cta}>Building your exposure timeline →</Link>
        </section>

        <section className={card}>
          <h2 className={h2}>If you are the family</h2>
          <ul className={list}>
            <li>
              <strong>Survivors.</strong> A surviving spouse or child can apply for Dependency and Indemnity
              Compensation on VA Form 21P-534EZ. The same form reaches benefits the veteran was owed but never
              received. Some of these carry deadlines, so ask a service officer what applies to you.
            </li>
            <li>
              <strong>Health coverage.</strong> Eligible surviving spouses and children may qualify for CHAMPVA,
              VA&apos;s health coverage for families.
            </li>
            <li>
              <strong>Children born with spina bifida.</strong> VA recognizes it in the biological children of
              veterans who served in or near the Korean DMZ during the covered dates. The child files on VA Form
              21-0304, with a monthly allowance, health care and vocational training attached.
            </li>
            <li>
              <strong>What you remember counts.</strong> Write down every place you heard them name at the kitchen
              table and every buddy they still sent a Christmas card to.
            </li>
          </ul>
        </section>

        <section className={card}>
          <h2 className={h2}>Numbers to keep</h2>
          <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-ink">
            <li><strong>MyVA411:</strong> <a href="tel:18006982411" className="font-semibold text-brand hover:underline">1-800-698-2411</a>, day or night, for veterans, families and survivors</li>
            <li><strong>VET-HOME:</strong> <a href="tel:18336338846" className="font-semibold text-brand hover:underline">833-633-8846</a>, the registry exam by telehealth</li>
            <li><strong>Veterans Crisis Line:</strong> dial <a href="tel:988" className="font-semibold text-brand hover:underline">988</a>, then press 1, or text <a href="sms:838255" className="font-semibold text-brand hover:underline">838255</a></li>
          </ul>
        </section>

        <a
          href={`${BOOK_SITE}/#korea-the-cold-that-stayed`}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl border border-line bg-surface p-4 text-center text-sm font-semibold text-brand transition hover:border-brand/40"
        >
          Read the full chapter: Korea, The Cold That Stayed →
        </a>

        <section className="px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Sources</h2>
          <ul className="mt-2 space-y-1 text-xs leading-relaxed">
            {SOURCES.map((s) => (
              <li key={s.href + s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">{s.label}</a>
              </li>
            ))}
          </ul>
        </section>

        <p className="px-1 text-xs leading-relaxed text-faint">
          This page explains what the law covers. It isn&apos;t medical or legal advice, and it can&apos;t tell you
          whether a benefit applies to you. Only VA decides that, and an accredited VSO can check your record
          against VA&apos;s current lists.
        </p>

        <Link href="/learn" className="block text-center text-xs font-medium text-brand hover:underline">← Exposure library</Link>
      </div>
    </AppShell>
  );
}
