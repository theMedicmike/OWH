"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";

// Phase 0 of the Cohort Evidence Engine: collect explicit, granular, revocable
// opt-in consent. Nothing aggregates yet — this just captures permission (and an
// audit trail) so there's a consented pool the day the rest clears legal review.
//
// State lives in members.consent.cohort (JSONB, already used for the OPSEC ack).
// Every change is also appended to consent_log (migration 0011) for defensibility;
// that insert fails harmlessly if the migration hasn't been applied yet.

const CONSENT_VERSION = "2026-07-01";

type Cohort = { contribute: boolean; public_map: boolean; research: boolean; version?: string; at?: string };

// A consent choice as one large tap row: a big checkbox, the choice in plain
// words, and what it means underneath. The whole row is the target.
function ConsentRow({
  id,
  on,
  disabled,
  onToggle,
  title,
  children,
}: {
  id: string;
  on: boolean;
  disabled?: boolean;
  onToggle: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex min-h-12 items-start gap-3 rounded-xl border border-line bg-white px-3.5 py-3 ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-canvas"
      }`}
    >
      <input
        id={id}
        type="checkbox"
        checked={on}
        disabled={disabled}
        onChange={onToggle}
        className="mt-0.5 h-6 w-6 flex-none accent-brand"
      />
      <span>
        <span className="block text-[0.9375rem] font-semibold text-ink">{title}</span>
        <span className="mt-0.5 block text-sm leading-relaxed text-muted">{children}</span>
      </span>
    </label>
  );
}

export default function CohortConsentCard() {
  const { user, supabase } = useAuth();
  const [consent, setConsent] = useState<Record<string, unknown>>({});
  const [contribute, setContribute] = useState(false);
  const [publicMap, setPublicMap] = useState(false);
  const [research, setResearch] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("members")
      .select("consent")
      .eq("auth_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const c = (data?.consent as Record<string, unknown>) ?? {};
        setConsent(c);
        const cohort = (c.cohort as Cohort) ?? { contribute: false, public_map: false, research: false };
        setContribute(!!cohort.contribute);
        setPublicMap(!!cohort.public_map);
        setResearch(!!cohort.research);
        setLoaded(true);
      });
  }, [user, supabase]);

  async function persist(next: { contribute: boolean; public_map: boolean; research: boolean }) {
    if (!user) return;
    setBusy(true);
    setSaved(false);
    const cohort: Cohort = { ...next, version: CONSENT_VERSION, at: new Date().toISOString() };
    const merged = { ...consent, cohort };
    await supabase.from("members").update({ consent: merged }).eq("auth_id", user.id);
    setConsent(merged);
    // Append-only audit trail; harmless no-op until migration 0011 is applied.
    await supabase.from("consent_log").insert({ kind: "cohort", detail: cohort });
    setBusy(false);
    setSaved(true);
  }

  function toggleContribute() {
    const v = !contribute;
    setContribute(v);
    if (!v) {
      setPublicMap(false);
      setResearch(false);
      persist({ contribute: false, public_map: false, research: false });
    } else {
      persist({ contribute: true, public_map: publicMap, research });
    }
  }
  function togglePublic() {
    if (!contribute) return;
    const v = !publicMap;
    setPublicMap(v);
    persist({ contribute, public_map: v, research });
  }
  function toggleResearch() {
    if (!contribute) return;
    const v = !research;
    setResearch(v);
    persist({ contribute, public_map: publicMap, research: v });
  }

  if (!loaded) return null;

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-canvas text-brand">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-ink">Help prove what happened to all of us</h2>
          <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted">
            On its own, your record helps your claim. Combined, anonymously, and only if you choose, records
            like yours become the largest veteran-built map of toxic exposure outside the VA: the kind of
            evidence that moves legislation and research. This is <strong>off unless you turn it on</strong>, and
            you can turn it back off anytime.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {/* Master opt-in */}
        <ConsentRow id="cohort-contribute" on={contribute} onToggle={toggleContribute} title="Contribute my anonymized record">
          Your name, email, exact locations, exact dates, notes, and uploaded documents are <strong>never</strong>{" "}
          included. Only coarse patterns (exposure type, general place, year, condition). Never sold.
        </ConsentRow>

        {/* Sub-options: only open once the master opt-in is on */}
        <div className="space-y-2 sm:pl-6">
          <ConsentRow id="cohort-public" on={publicMap} disabled={!contribute} onToggle={togglePublic} title="Show my data in the public exposure map">
            Adds to public counts like &quot;1,240 veterans documented burn pits at this base.&quot; Only shown once
            enough people are included that no one can be identified.
          </ConsentRow>
          <ConsentRow id="cohort-research" on={research} disabled={!contribute} onToggle={toggleResearch} title="Include me in de-identified research">
            Lets vetted researchers and advocates use the anonymized pattern data, under a signed data-use
            agreement, for studies and legislation like the Breaking the Cascade Act.
          </ConsentRow>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span role="status" className="text-[0.9375rem] text-muted">
          {busy ? "Saving…" : saved ? "Saved. Thank you." : contribute ? "You're contributing anonymously." : "Not contributing."}
        </span>
        <Link href="/privacy" className="btn btn-ghost min-h-11">How your data is protected</Link>
      </div>
    </section>
  );
}
