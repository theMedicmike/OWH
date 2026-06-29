import AppShell from "@/components/AppShell";
import { ServiceRibbon } from "@/components/Patriotic";

const MVP = [
  {
    label: "Mission",
    text: "To help every veteran connect their service to their health — and get the recognition, the care, and the healing they earned.",
  },
  {
    label: "Vision",
    text: "A world where no veteran has to prove alone that their service made them sick — where exposure is documented from the first day of service, root causes are addressed instead of just symptoms, and no one is lost to a system that failed to see them.",
  },
  {
    label: "Purpose",
    text: "This is the heart of Operation Whole Health: whole-person, root-cause healing. Not masking the problem — finding the cause, connecting the dots, and restoring the veteran.",
  },
];

export default function AboutPage() {
  return (
    <AppShell title="Why we built this">
      <div className="mx-auto max-w-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/owh-logo.png" alt="Operation Whole Health" className="h-16 w-auto object-contain" />
        <ServiceRibbon className="mb-5 mt-4 w-40 rounded-full opacity-90" />
        <div className="mb-6 border-b border-line pb-5">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">
            Operation Whole Health &nbsp;·&nbsp; Connecting the Dots of Service
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">Why I Built This</h2>
          <p className="mt-1 text-sm text-muted">A letter from the founder</p>
        </div>

        <p className="text-base leading-relaxed text-ink">
          My name is Michael Jones, and I&apos;m the founder of Operation Whole Health. I built{" "}
          <strong>Connecting the Dots of Service</strong> for one simple reason: I got tired of
          watching veterans get sick from their service and be told it wasn&apos;t connected.
        </p>

        <h3 className="mt-7 text-base font-bold text-ink">The problem I couldn&apos;t walk away from</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Hundreds of thousands of veterans are living with chronic illness — respiratory disease,
          cancers, neurological and autoimmune conditions — that trace straight back to where they
          served and what they were exposed to. Burn pits. Heavy metals. Contaminated water.
          Herbicides. Radiation. The exposures were daily, and nobody was tracking them at the time.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          So years later, when a veteran finally gets sick, they&apos;re asked to prove a connection
          to evidence they were never given the chance to collect. Claims get denied. Conditions go
          untreated. And too many of our veterans are left to fight that battle alone, sick and
          unheard. We are losing veterans every single day — and part of that loss is a system that
          makes them prove they&apos;re worth believing.
        </p>

        <h3 className="mt-7 text-base font-bold text-ink">It started with a Marine named Dave</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          This didn&apos;t start as an app. It started at my friend Dave Eckerson&apos;s kitchen
          table. Dave is a Gunnery Sergeant in the Marine Corps who served in more places around the
          world than most people could name — across the better part of 30 years.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          While I was writing my book, <em>What Happened to Our Veterans</em>, I was talking it
          through with Edgar Rodriguez — a fellow Marine and a business coach — about Dave&apos;s
          story, and how hard it was to connect his health to his service. That conversation is
          where it clicked: &ldquo;connecting the dots of service&rdquo; wasn&apos;t just going to be
          a chapter in the book. It was the whole problem.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          So I went over to Dave and Lisa&apos;s house, again and again, and we sat down to actually
          try to do it — to retrace three decades of service and find where his root-cause health
          issues might have started. We hit a wall almost immediately. Dave had served in so many
          locations that going back 30 years was nearly impossible. Nobody keeps track of this while
          they&apos;re in. And by the time a service member gets out, they&apos;re chasing their
          health so hard that piecing it all back together feels out of reach.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          That wall is exactly what this app tears down. Dave and Lisa have lived this struggle
          firsthand — and instead of letting it beat them, they were determined to help. They walked
          me through their own experience, the real and ongoing battles they&apos;ve faced since
          Dave&apos;s retirement, and pushed me to build something that actually addresses them —
          not in theory, but in real time. Connecting the Dots of Service exists because of their
          grit and their generosity. This one&apos;s for them, and for every veteran who should
          never have to reverse-engineer their own life just to be believed.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Dave and Lisa don&apos;t just carry this fight — they carry it for others. Alongside a
          remarkable service dog named Caine, they help run <strong>JTF Canines</strong> (Joint Task
          Force Canines), a faith-based 501(c)(3) that pairs active-duty service members and combat
          veterans with service dogs. That heart for fellow warriors is the very spirit this app was
          built in — and it&apos;s a big part of how we found each other.
        </p>

        <h3 className="mt-7 text-base font-bold text-ink">What I set out to build</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          I built Connecting the Dots of Service so that{" "}
          <strong className="text-ink">every veteran can finally connect the dots</strong> — map
          where they served, document what they were exposed to, and turn it into proof the VA can
          actually recognize. Not opinions. Documented facts, tied to the law. For the first time, a
          veteran can build their own evidence, on their own terms, and walk into a VSO or a
          doctor&apos;s office with a packet that speaks the VA&apos;s language.
        </p>

        <h3 className="mt-7 text-base font-bold text-ink">What it does</h3>
        <ul className="mt-2 space-y-2 text-sm text-muted">
          {[
            "Maps a veteran's entire service history, place by place, year by year.",
            "Tells them what they were likely exposed to — so they don't have to be a chemist to figure it out.",
            "Connects those exposures to their health conditions and flags PACT Act presumptives, with the actual citations.",
            "Lets the people they served with corroborate each other — privately and on their own terms.",
            "Generates a claim-ready packet, plus a hand-off sheet a doctor can sign.",
            "Reconnects veterans with the brothers and sisters they served beside.",
          ].map((item, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-brand/10 text-[10px] font-bold text-brand">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>

        <h3 className="mt-7 text-base font-bold text-ink">Why it matters — today, and for the future</h3>
        <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted">
          <p>
            <strong className="text-ink">For veterans now:</strong> faster, stronger,
            better-documented claims, and the care they already earned — with the dignity of not
            having to beg to be believed.
          </p>
          <p>
            <strong className="text-ink">For active and future military:</strong> the real fix is to
            log exposures from day one of service, in real time, so the next generation never has to
            reverse-engineer their own health 20 years too late. We solve this at the source.
          </p>
          <p>
            <strong className="text-ink">For all of us:</strong> as veterans document their service
            together, patterns emerge — clusters by base, by year, by exposure. That is exactly how
            new presumptive conditions get recognized. Burn pits, Agent Orange, Camp Lejeune — they
            all started as clusters someone finally counted. This becomes a body of evidence that can
            change policy and help veterans who never even opened the app.
          </p>
        </div>

        <h3 className="mt-7 text-base font-bold text-ink">Mission. Vision. Purpose.</h3>
        <div className="mt-3 space-y-3">
          {MVP.map(({ label, text }) => (
            <div
              key={label}
              className="rounded-xl border border-line border-l-4 border-l-brand bg-surface px-4 py-3"
            >
              <div className="text-[11px] font-bold uppercase tracking-wider text-brand">{label}</div>
              <div className="mt-1 text-sm text-muted">{text}</div>
            </div>
          ))}
        </div>

        <h3 className="mt-7 text-base font-bold text-ink">This is bigger than an app</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          It&apos;s a promise that what happened to our veterans will never have to be
          reverse-engineered again. If you&apos;re a veteran, this is for you. If you&apos;re a VSO,
          a clinician, a researcher, or someone who simply wants to help — there is a place for you
          in this work. Let&apos;s connect the dots together, and bring our veterans all the way
          home.
        </p>

        <div className="mt-8 border-t border-line pt-6">
          <div className="font-bold text-ink">Michael Andrew Feller Jones</div>
          <div className="text-sm text-muted">Founder, Operation Whole Health</div>
          <div className="text-sm text-muted">michael@operationwholehealth.org</div>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-faint">
          Operation Whole Health is a Patriot-founded 501(c)(3) nonprofit. Connecting the Dots of
          Service assembles a veteran&apos;s own information with documented sources to assist an
          accredited VSO and a clinician. It is an estimate and a record — not a diagnosis or a
          determination of service connection.
        </p>
      </div>
    </AppShell>
  );
}
