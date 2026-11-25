"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { MEDICATION_SEED, searchSeed, type SeedMedication } from "@/lib/medicationSeed";
import { createMedication, listMedications, setMedicationTakenFor } from "@/lib/medications";

// Tap a medicine, it is on your list. That is the whole interaction.
//
// The medications table needs nothing but a name, so a one-tap add stores the
// name (and the generic and first brand, when it came from the list) and
// nothing else: no years, no reason, nothing guessed. The one follow-up is
// optional and typed by the veteran: what he takes it for. Logging what you
// take is the veteran's own fact; nothing here touches a claim.
const ALL = [...MEDICATION_SEED].sort((a, b) => a.generic.localeCompare(b.generic));

type Added = { id: string; name: string };

export default function MedicationQuickAdd() {
  const { user, supabase } = useAuth();
  const [query, setQuery] = useState("");
  const [onList, setOnList] = useState<Set<string>>(new Set());
  const [busyName, setBusyName] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<Added | null>(null);
  const [takenFor, setTakenFor] = useState("");
  const [forSaved, setForSaved] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!user) return;
    let alive = true;
    listMedications(supabase).then((res) => {
      if (!alive || !("medications" in res)) return;
      setOnList(new Set(res.medications.map((m) => m.name.toLowerCase())));
    });
    return () => { alive = false; };
  }, [user, supabase]);

  const q = query.trim();
  const rows: SeedMedication[] = useMemo(() => (q ? searchSeed(q, 30) : ALL), [q]);
  const exact = rows.some((m) => [m.generic, ...m.brands].some((n) => n.toLowerCase() === q.toLowerCase()));

  async function add(name: string, seed: SeedMedication | null) {
    setBusyName(name);
    setErr("");
    const res = await createMedication(supabase, {
      name,
      genericName: seed ? seed.generic : null,
      brandName: seed && seed.brands.length ? seed.brands[0] : null,
      takenFor: "",
      stillTaking: null,
      startedYear: null,
      stoppedYear: null,
      note: "",
    });
    setBusyName(null);
    if (res.status === "error") { setErr(res.message); return; }
    setOnList((prev) => new Set(prev).add(name.toLowerCase()));
    setJustAdded({ id: res.id, name });
    setTakenFor("");
    setForSaved(false);
  }

  async function saveFor() {
    if (!justAdded || !takenFor.trim()) return;
    const res = await setMedicationTakenFor(supabase, justAdded.id, takenFor);
    if (res.status === "error") { setErr("That did not save. Try again in a moment."); return; }
    setForSaved(true);
  }

  // The follow-up panel shown under whichever row was just added.
  const followUp = (name: string) =>
    justAdded && justAdded.name === name ? (
      <div className="border-t border-line bg-canvas px-4 pb-4 pt-3" aria-live="polite">
        <p className="text-[0.9375rem] font-semibold text-success">{name} is on your medications.</p>
        {forSaved ? (
          <p className="mt-1 text-[0.9375rem] text-muted">Saved: you take it for {takenFor.trim()}.</p>
        ) : (
          <>
            <label htmlFor="taken-for" className="field-label mt-3">What do you take it for? (optional)</label>
            <div className="flex gap-2">
              <input
                id="taken-for"
                value={takenFor}
                onChange={(e) => setTakenFor(e.target.value)}
                placeholder="e.g. my back, sleep, blood pressure"
                className="field flex-1"
              />
              <button type="button" onClick={saveFor} disabled={!takenFor.trim()} className="btn btn-primary flex-none">Save</button>
            </div>
            <p className="mt-1.5 text-sm text-muted">This is the part a VSO looks at most. Skip it if you like.</p>
          </>
        )}
      </div>
    ) : null;

  const addButton = (name: string, seed: SeedMedication | null) => {
    const has = onList.has(name.toLowerCase());
    if (has) {
      return (
        <span className="flex min-h-11 flex-none items-center gap-1.5 px-2 text-[0.9375rem] font-semibold text-success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
            <path d="m5 12 4 4L19 7" />
          </svg>
          Added
        </span>
      );
    }
    return (
      <button
        type="button"
        onClick={() => add(name, seed)}
        disabled={busyName !== null}
        aria-label={`Add ${name} to your medications`}
        className="btn btn-secondary min-w-[5.5rem] flex-none"
      >
        {busyName === name ? "Adding…" : "Add"}
      </button>
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="display text-[1.75rem] text-ink sm:text-[2rem]">Tap a medicine to add it.</h2>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
          One tap puts it on your list. Search by generic or brand name, or scroll. Nothing is sent anywhere, and
          nothing you write is touched by AI.
        </p>
      </div>

      <div className="sticky top-16 z-10 -mx-1 bg-canvas/95 px-1 py-1 backdrop-blur">
        <label htmlFor="med-search" className="sr-only">Search medications</label>
        <input
          id="med-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search, e.g. ibuprofen, Motrin, sertraline"
          className="field"
          autoComplete="off"
        />
      </div>

      {err && <p role="alert" className="text-[0.9375rem] font-medium text-scarlet">{err}</p>}

      <div className="card overflow-hidden">
        {/* Typed a name that is not on the list: add it exactly as typed. The
            list is an on-ramp, not a limit. */}
        {q.length > 1 && !exact && (
          <div>
            <div className="row">
              <span className="min-w-0 flex-1">
                <span className="block text-[0.9375rem] font-semibold leading-snug">&ldquo;{q}&rdquo;</span>
                <span className="mt-0.5 block text-sm leading-snug text-muted">Add it exactly as you typed it</span>
              </span>
              {addButton(q, null)}
            </div>
            {followUp(q)}
          </div>
        )}
        {rows.map((m) => (
          <div key={m.generic} className="border-t border-line first:border-t-0">
            <div className="row">
              <span className="min-w-0 flex-1">
                <span className="block text-[0.9375rem] font-semibold leading-snug">
                  {m.generic}
                  {m.brands.length > 0 && <span className="font-normal text-muted"> ({m.brands.join(", ")})</span>}
                </span>
                <span className="mt-0.5 block text-sm leading-snug text-muted">{m.klass}</span>
              </span>
              {addButton(m.generic, m)}
            </div>
            {followUp(m.generic)}
          </div>
        ))}
        {rows.length === 0 && q.length <= 1 && (
          <p className="p-4 text-[0.9375rem] text-muted">Type at least two letters.</p>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/medications" className="btn btn-primary">See your medications</Link>
        <Link href="/medications/add?full=1" className="text-[0.9375rem] font-semibold text-brand hover:underline">
          Add one with start and stop years instead
        </Link>
      </div>
    </div>
  );
}
