import InfoPage from "@/components/InfoPage";
import PrintButton from "@/components/PrintButton";

export const metadata = { title: "For the reviewing VSO or clinician" };

const QUESTIONS = [
  {
    q: "Would this packet help or hurt this veteran's claim if it were submitted as-is?",
    hint: "The single most important question. We would rather hear it's not ready than mislead a veteran.",
  },
  {
    q: "Is anything here inaccurate, overstated, or likely to undermine credibility with a VA rater?",
    hint: "Flag anything that reads as a guess, a stretch, or a causal conclusion we shouldn't be making.",
  },
  {
    q: "Are the exposure-to-condition citations (PACT Act, 38 CFR, Camp Lejeune, ATSDR) used correctly?",
    hint: "Right authority, right condition, right caveats about dates and eligibility?",
  },
  {
    q: "Is the clinician hand-off / nexus sheet structured so a clinician could actually use and sign it?",
    hint: "What would a C&P-savvy clinician need added or changed to give a real medical opinion?",
  },
  {
    q: "What is the single most valuable thing we could add or change to make this genuinely useful?",
    hint: "For you as a representative, and for the veteran walking into your office.",
  },
];

function Lines() {
  return (
    <div className="mt-2 space-y-3" aria-hidden="true">
      <div className="h-5 border-b border-line" />
      <div className="h-5 border-b border-line" />
    </div>
  );
}

export default function ReviewerPage() {
  return (
    <InfoPage
      title="For the reviewing VSO or clinician"
      intro="A veteran is bringing you a claim-support packet built with Connecting the Dots of Service — a free tool from Operation Whole Health, a Patriot-founded 501(c)(3). Before they rely on it, we want your honest, expert read. It takes about five minutes, and it shapes the tool for every veteran who uses it next."
    >
      <div className="mb-2">
        <PrintButton label="Print this cover sheet" />
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="text-[11px] font-bold uppercase tracking-wide text-accent">What you&apos;re looking at</div>
        <p className="mt-1.5 text-sm leading-relaxed text-ink">
          The attached packet is a <strong>veteran-entered record</strong> — where they served, the
          documented exposures tied to those places and years, the conditions they live with, supporting
          citations, and a clinician hand-off sheet. It states facts and documented sources. It is{" "}
          <strong>not</strong> a diagnosis, <strong>not</strong> legal representation, and{" "}
          <strong>not</strong> a determination of service connection — it is meant to help this veteran
          walk into your office prepared, with you in the driver&apos;s seat.
        </p>
      </div>

      <div className="pt-2 text-[11px] font-bold uppercase tracking-widest text-accent">Five questions</div>

      {QUESTIONS.map((item, i) => (
        <div key={i} className="rounded-xl border border-line bg-surface p-4">
          <div className="flex gap-3">
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-brand text-xs font-bold text-brand-foreground">{i + 1}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">{item.q}</p>
              <p className="mt-0.5 text-xs text-muted">{item.hint}</p>
              <Lines />
            </div>
          </div>
        </div>
      ))}

      <div className="rounded-xl border-2 border-brand bg-brand/5 p-4">
        <p className="text-sm leading-relaxed text-ink">
          Thank you for your time and your expertise. Please send any notes to{" "}
          <a href="mailto:michael@operationwholehealth.org?subject=Reviewer%20feedback%20%E2%80%94%20Connecting%20the%20Dots" className="font-semibold text-brand hover:underline">michael@operationwholehealth.org</a>,
          or hand this sheet back to the veteran. Your honest read — even &ldquo;this isn&apos;t ready
          yet&rdquo; — is exactly what we need.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6 pt-2 text-sm">
        <div>
          <div className="h-6 border-b border-ink" />
          <div className="mt-1 text-xs text-muted">Reviewer name &amp; role (VSO / clinician)</div>
        </div>
        <div>
          <div className="h-6 border-b border-ink" />
          <div className="mt-1 text-xs text-muted">Date</div>
        </div>
      </div>
    </InfoPage>
  );
}
