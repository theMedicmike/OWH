"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { INCIDENT_LABEL, type IncidentClass } from "@/lib/education";
import { createIncidentEntry, PROVENANCE_OPTIONS, type Provenance } from "@/lib/incidents";

// Log an injury or event from its library page, in three taps and no typing:
// what happened, roughly what year, how you know. The last tap saves.
//
// Why three and not one, unlike a shot: an injury becomes a pin on the
// veteran's timeline and flows into condition matching and the claim packet.
// So the app may not guess which event it was (a library entry like blast and
// TBI covers several), may not invent a year (the timeline reads it as a
// fact), and may not grade how he knows on his behalf. Everything else (the
// place, the month, the details) is left out rather than guessed; the place
// reads "Unnamed location", the same convention the full form uses, and the
// year is flagged as approximate.
const THIS_YEAR = new Date().getUTCFullYear();
const YEARS = Array.from({ length: THIS_YEAR - 1940 + 1 }, (_, i) => THIS_YEAR - i);

export default function InjuryAddToRecord({ name, classes }: { name: string; classes: IncidentClass[] }) {
  const { user, supabase } = useAuth();
  const [what, setWhat] = useState<IncidentClass | null>(classes.length === 1 ? classes[0] : null);
  const [year, setYear] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState<string | null>(null);

  if (!user) return null;

  const ready = !!what && !!year;

  async function save(provenance: Provenance) {
    if (!what || !year) return;
    setBusy(true);
    setErr("");
    const res = await createIncidentEntry(supabase, {
      repeated: false,
      incidentClass: what,
      placeName: "Unnamed location",
      year,
      month: 0,
      day: 0,
      approximate: true,
      provenance,
      detail: "",
    });
    setBusy(false);
    if (res.status === "error") { setErr("That did not save. Try again in a moment."); return; }
    setSaved(INCIDENT_LABEL[what] ?? name);
  }

  function another() {
    setSaved(null);
    setWhat(classes.length === 1 ? classes[0] : null);
    setYear(null);
  }

  if (saved) {
    return (
      <section className="card card-raise p-5 sm:p-6" aria-live="polite">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-success-soft text-success" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="m5 12 4 4L19 7" />
            </svg>
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-ink">{saved} is on your record</h2>
            <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted">
              Logged for around {year}. It is connected to any matching conditions on Your conditions. You can pin
              the place on your map whenever you like.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href="/injuries" className="btn btn-primary">See your injuries &amp; events</Link>
          <button type="button" onClick={another} className="btn btn-ghost">Log another</button>
        </div>
      </section>
    );
  }

  return (
    <section className="card card-raise p-5 sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight text-ink">Log this on your record</h2>
      <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted">
        Three taps, no typing. Nothing is saved until the last one, and nothing is sent anywhere.
      </p>

      <fieldset className="mt-5">
        <legend className="field-label">What happened?</legend>
        <div className="flex flex-wrap gap-2">
          {classes.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={what === c}
              onClick={() => setWhat(c)}
              className={`btn btn-sm min-h-11 rounded-full ${what === c ? "btn-primary" : "btn-secondary"}`}
            >
              {INCIDENT_LABEL[c] ?? c}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-5">
        <label htmlFor="injury-year" className="field-label">About what year?</label>
        <select
          id="injury-year"
          value={year ?? ""}
          onChange={(e) => setYear(e.target.value ? parseInt(e.target.value, 10) : null)}
          className="field"
        >
          <option value="">Choose a year</option>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <p className="mt-1.5 text-sm text-muted">Your best guess is fine. It is saved as approximate.</p>
      </div>

      <fieldset className="mt-5">
        <legend className="field-label">How do you know? Tap one to save.</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PROVENANCE_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => save(o.value)}
              disabled={!ready || busy}
              className="btn btn-secondary btn-lg w-full"
            >
              {o.label}
            </button>
          ))}
        </div>
        {!ready && (
          <p className="mt-2 text-sm text-muted">
            {!what ? "Pick what happened first." : "Pick the year first."}
          </p>
        )}
      </fieldset>

      {err && <p role="alert" className="mt-3 text-[0.9375rem] font-medium text-scarlet">{err}</p>}

      <Link
        href={what ? `/injuries/add?class=${what}` : "/injuries/add"}
        className="mt-4 inline-block text-[0.9375rem] font-semibold text-brand hover:underline"
      >
        Add the place, month and details instead
      </Link>
    </section>
  );
}
