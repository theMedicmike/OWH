import AppShell from "@/components/AppShell";
import VesselsListCard from "@/components/VesselsListCard";

export default function VesselsPage() {
  return (
    <AppShell title="Ships you served aboard">
      <p className="mb-1 text-sm text-muted">
        A ship does not sit in one place on a map. It gets its own page.
      </p>
      <p className="mb-4 text-xs leading-relaxed text-faint">
        Nothing here is submitted automatically, and nothing you write is touched by AI. This documents where you
        served; it never tells you what you qualify for.
      </p>

      <div className="space-y-4">
        <VesselsListCard />

        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="text-sm font-semibold text-ink">Why the name and the dates are the whole thing</div>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            For a sailor, the ship <em>is</em> the location, and a records request is written against three facts:
            the vessel, the hull number, and the dates you were aboard. With those, an accredited VSO can request
            the <strong>deck logs</strong> — the ship&apos;s own daily record of where she was — from the National
            Archives. That document is what establishes where you were standing, and no app can substitute for it.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            The same three facts also drive an asbestos claim, which for anyone who served aboard before the
            mid-1980s is the commonest shipboard route of all: berthing and engineering spaces were insulated with
            it, and a yard period is when most of it came loose.
          </p>
        </div>

        {/* 🔴 THE RULING THIS PAGE IS BUILT ON, said out loud to the veteran
            rather than hidden in a migration comment. We ship no copy of VA's
            ship list and we run no match. Blue Water Navy turns on where the
            vessel actually was — 12 nautical miles, or the inland waterways —
            which a rater establishes from deck logs. An app answering that off
            a hull number typed from memory is making a determination on
            evidence it has never seen. Telling him WHY he is being sent to
            VA's own list, instead of just sending him, is the difference
            between a limit and a brush-off. */}
        <div className="rounded-xl border-2 border-brand bg-brand/5 p-5">
          <div className="text-sm font-semibold text-brand">
            Vietnam-era: the answer comes from the deck logs, not from us
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            VA publishes a list of Navy and Coast Guard ships associated with service in Vietnam and exposure to
            herbicides. Whether a herbicide presumption reaches a particular sailor depends on where his ship
            actually was — inside the inland waterways, or within twelve nautical miles of the demarcation line —
            and that is established from the deck logs for those dates, by the person deciding the claim.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            We could print you a green tick off the hull number you just typed. We are not going to, because it
            would be this app answering a question it has never seen the evidence for, and a veteran who walks into
            a VSO office holding our tick and gets corrected has been failed twice.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink">
            <a
              href="https://www.publichealth.va.gov/exposures/agentorange/shiplist/index.asp"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand underline"
            >
              Check VA&apos;s own ship list →
            </a>{" "}
            then take the answer, and this record, to an accredited VSO. Their help is free.
          </p>
        </div>

        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="text-sm font-semibold text-ink">Still worth pinning on the map</div>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Your <strong>homeport</strong> and the <strong>shipyard</strong> where your ship was overhauled are real
            places with documented exposures behind them — asbestos, solvents and fuels, and refueling radiological
            work. Those belong on the map in step 3, alongside this page rather than instead of it. So does any
            water you can name: the Persian Gulf, the Gulf of Tonkin, Yankee Station.
          </p>
        </div>

        <p className="px-1 text-xs leading-relaxed text-faint">
          This section documents. It does not diagnose, does not advise you, does not file for you, and is not your
          representative (38 CFR 14.629). If you or someone you know is struggling, the Veterans Crisis Line is here
          24/7 — dial 988, then press 1. Text 838255.
        </p>
      </div>
    </AppShell>
  );
}
