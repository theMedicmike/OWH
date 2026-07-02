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

function Toggle({ on, disabled, onClick, label }: { on: boolean; disabled?: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`relative inline-flex h-6 w-11 flex-none items-center rounded-full transition ${
        on ? "bg-brand" : "bg-line"
      } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${on ? "translate-x-6" : "translate-x-1"}`} />
    </button>
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
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="h-1 bg-accent" />
      <div className="p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-brand/10 text-brand">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          <div>
            <div className="text-sm font-semibold text-ink">Help prove what happened to all of us</div>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              On its own, your record helps your claim. Combined — anonymously, and only if you choose — records
              like yours become the largest veteran-built map of toxic exposure outside the VA: the kind of
              evidence that moves legislation and research. This is <strong>off unless you turn it on</strong>, and
              you can turn it back off anytime.
            </p>
          </div>
        </div>

        {/* Master opt-in */}
        <div className="mt-4 flex items-start justify-between gap-4 rounded-lg border border-line bg-canvas px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-ink">Contribute my anonymized record</div>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">
              Your name, email, exact locations, exact dates, notes, and uploaded documents are <strong>never</strong>{" "}
              included — only coarse patterns (exposure type, general place, year, condition). Never sold.
            </p>
          </div>
          <Toggle on={contribute} onClick={toggleContribute} label="Contribute my anonymized record" />
        </div>

        {/* Sub-options */}
        <div className={`mt-2 space-y-2 transition ${contribute ? "" : "pointer-events-none opacity-50"}`}>
          <div className="flex items-start justify-between gap-4 rounded-lg border border-line px-4 py-3">
            <div>
              <div className="text-sm font-medium text-ink">Show my data in the public exposure map</div>
              <p className="mt-0.5 text-xs leading-relaxed text-muted">
                Adds to public counts like &quot;1,240 veterans documented burn pits at this base.&quot; Only shown once
                enough people are included that no one can be identified.
              </p>
            </div>
            <Toggle on={publicMap} disabled={!contribute} onClick={togglePublic} label="Show my data in the public exposure map" />
          </div>
          <div className="flex items-start justify-between gap-4 rounded-lg border border-line px-4 py-3">
            <div>
              <div className="text-sm font-medium text-ink">Include me in de-identified research</div>
              <p className="mt-0.5 text-xs leading-relaxed text-muted">
                Lets vetted researchers and advocates use the anonymized pattern data — under a signed data-use
                agreement — for studies and legislation like the Breaking the Cascade Act.
              </p>
            </div>
            <Toggle on={research} disabled={!contribute} onClick={toggleResearch} label="Include me in de-identified research" />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <span className="text-xs text-muted">
            {busy ? "Saving…" : saved ? "Saved. Thank you." : contribute ? "You're contributing anonymously." : "Not contributing."}
          </span>
          <Link href="/privacy" className="text-xs font-medium text-brand hover:underline">How your data is protected →</Link>
        </div>
      </div>
    </div>
  );
}
