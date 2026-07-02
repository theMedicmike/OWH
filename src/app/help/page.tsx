import AppShell from "@/components/AppShell";
import { ServiceRibbon } from "@/components/Patriotic";

const STEPS = [
  {
    title: "Open the app",
    body: "On your phone or computer, go to owh-three.vercel.app. Add it to your home screen so it opens like an app, with the OWH coin as its icon.",
    tip: "Want bigger text? Tap your initials in the top-right and pick a larger size — it sticks.",
  },
  {
    title: "Create your account",
    body: 'Tap "Create account," enter your email and a password, and you\'re in. Next time, just tap "Sign in."',
    tip: "Helping a veteran? Under Account, set \"Who is this account for?\" to family or caregiver — you can build the record on their behalf.",
  },
  {
    title: "Confirm your service",
    body: 'On your Dashboard, tap "Verify your service" and affirm you\'re a veteran or service member.',
    tip: "You can upload your DD-214 later to earn a verified badge.",
  },
  {
    title: "Map where you served",
    body: 'Tap "Where you served." Tap the map where you were stationed or deployed and set the year. If it\'s a known exposure site, the app turns the documented exposures green and marks them "Confirmed" — you just review them. Add anything else under "Other," then save. Repeat for every place you served.',
    tip: "Not sure what you were exposed to? That's okay — the app tells you. You just confirm.",
  },
  {
    title: "Or just talk it through",
    body: 'Prefer talking to tapping? Tap "Voice guided intake" and answer the questions in plain language. It builds your timeline and saves each spot for you.',
    tip: null,
  },
  {
    title: "Add your health",
    body: 'Tap "Conditions & links" and check off what you live with. The app shows which conditions connect to your exposures and which are PACT Act presumptive.',
    tip: null,
  },
  {
    title: "See how it all connects",
    body: 'Tap "Connect the dots" near the top of the sidebar. It draws a line from each of your exposures to every health condition the VA already links it to — your whole service-to-illness picture on one screen. Tap any dot to see the connection and its legal citation, mark where each claim stands (filed, granted, denied), and tap "Print / Save as PDF" to hand the whole map to your VSO or doctor.',
    tip: "This is the page that makes your case at a glance — and it's yours to share.",
  },
  {
    title: "Upload your DD-214 & records",
    body: 'Tap Account → Upload a file. A clear photo or scan of your DD-214 works — it becomes part of your packet.',
    tip: null,
  },
  {
    title: "Tap your numbers to go deeper",
    body: 'On your Dashboard, the boxes at the top — Locations, Exposures, Conditions — are buttons. Tap any one to open its own page: Locations gives you the history of each base (and a way to remove a spot you added by mistake), and Exposures and Conditions explain in plain language what each one is and how they connect.',
    tip: "This is where the app teaches you — no chemistry degree required.",
  },
  {
    title: "Look anything up in the Exposure Library",
    body: 'Tap "Exposure library" in the sidebar for a plain-English encyclopedia of every metal and chemical — where it comes from, what it does in the body, where it stores, and the conditions the government already links to it. Tap a nutrient to learn the foods that restore it, or an organ to learn what happens there. It all clicks together like a web.',
    tip: null,
  },
  {
    title: "Explore Whole health",
    body: 'Tap "Whole health" in the sidebar (or on your Dashboard). It pulls together your exposures and conditions and shows root-cause, whole-person ways to support your body and start healing — plus simple things you can begin this week. It\'s education to bring to your own doctor, never a prescription.',
    tip: "Operation Whole Health is about the root cause — not just masking symptoms.",
  },
  {
    title: "Read the book — it's free",
    body: 'In the sidebar under "The mission," tap "Read the book" to read What Happened to Our Veterans — the science and the story behind this whole app — free, at your own pace.',
    tip: null,
  },
  {
    title: "Find your battle buddies (optional)",
    body: 'Tap "Battle buddies" and turn on "open to reconnecting." If someone served where you did, you can confirm each other\'s exposures and ask to reconnect. Names are shared only if you both say yes. There\'s no public chat.',
    tip: null,
  },
  {
    title: "Get your Claim Packet",
    body: 'Tap "Claim packet." The app assembles everything — your timeline, your exposures with their legal citations, your conditions, and a sheet for your doctor to sign. Tap "Download PDF" to save it as a file you can print or email.',
    tip: "Bring this to your VSO (DAV, VFW, American Legion). There's also a 5-question cover sheet you can print to clip on top for them.",
  },
  {
    title: "Your private health insights",
    body: 'Under "Your health → Exposure insights" is a personal estimate of what your service may have exposed you to. This is just for you and your own doctor — it is never part of your VA claim.',
    tip: null,
  },
];

export default function HelpPage() {
  return (
    <AppShell title="How to use this">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">User guide</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
            Connecting the Dots of Service
          </h2>
          <ServiceRibbon className="mt-3 w-40 rounded-full opacity-90" />
          <p className="mt-1 text-sm text-muted">
            A simple, step-by-step guide. No tech experience needed.
          </p>
        </div>

        <div className="mb-6 rounded-xl border border-line bg-surface px-5 py-4 text-sm text-ink">
          <span className="font-semibold">What this does:</span> It helps you map where you served,
          document what you were exposed to, see how it all connects on one screen, look anything up in
          the exposure library, find root-cause ways to start healing, read the book, and build a
          one-stop claim packet that connects it all — so the VA can finally see it. Work at your own
          pace; everything saves automatically and stays private to you.
        </div>

        <ol className="space-y-3">
          {STEPS.map((step, i) => (
            <li
              key={i}
              className="relative flex gap-4 rounded-xl border border-line bg-surface px-5 py-4"
            >
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand text-xs font-bold text-brand-foreground">
                {i + 1}
              </span>
              <div>
                <div className="font-semibold text-ink">{step.title}</div>
                <div className="mt-1 text-sm text-muted">{step.body}</div>
                {step.tip && (
                  <div className="mt-1.5 text-xs italic text-brand">{step.tip}</div>
                )}
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-6 rounded-xl border-2 border-brand bg-brand/5 px-5 py-4">
          <div className="font-semibold text-brand">If you&apos;re struggling, you are not alone.</div>
          <div className="mt-1 text-sm text-ink">
            Veterans Crisis Line — dial <strong>988</strong>, then press <strong>1</strong>. Free,
            confidential, and there 24/7. You&apos;ll also find a{" "}
            <strong>"Need support?"</strong> button on every screen of the app.
          </div>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-faint">
          Operation Whole Health is a Patriot-founded 501(c)(3) nonprofit. This app assembles your
          own information with documented sources to assist an accredited VSO and a clinician. It is
          an estimate and a record — not a diagnosis or a determination of service connection.
        </p>
      </div>
    </AppShell>
  );
}
