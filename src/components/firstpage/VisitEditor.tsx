"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "../AuthProvider";
import { createVisit, deleteVisit, listRecordings, listVisits, updateVisit, type FpRecording, type FpVisit } from "@/lib/firstPage";
import { KeptNotice, SavedMark, useAutosave, useDraft, useUndo } from "../Keep";
import { BackToHub, CardTitle, Input, Notice, PrimaryButton, QuietButton, Stance, TextField } from "./Controls";
import { StepNav, useStep } from "./Steps";

// One visit at a time: who, when, what is open today, the two questions, since
// last visit, and the three "Read this first" lines picked from the veteran's
// own recorded words. The veteran chooses the lines; nobody else does.
//
// One task per screen (the cognitive pass): five short steps, each saving
// itself as he types, with a copy kept on this device. Removing a visit is held
// behind an Undo bar; nothing asks "are you sure".

type D = { specialist: string; visit_date: string; open_today: string; question1: string; question2: string; since_last_visit: string; read_first: string[] };
const STEPS = ["Who you are seeing, and when", "Read this first: three lines", "Open today", "Your two questions", "Since last visit"];

function splitSentences(t: string): string[] {
  return t.replace(/\s+/g, " ").split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 8);
}
const fromVisit = (v: FpVisit): D => ({ specialist: v.specialist ?? "", visit_date: v.visit_date ?? "", open_today: v.open_today ?? "", question1: v.question1 ?? "", question2: v.question2 ?? "", since_last_visit: v.since_last_visit ?? "", read_first: [v.read_first[0] ?? "", v.read_first[1] ?? "", v.read_first[2] ?? ""] });

function VisitSteps({ visit, sentences, hasRecording, onDone }: { visit: FpVisit; sentences: string[]; hasRecording: boolean; onDone: () => void }) {
  const { supabase } = useAuth();
  const [d, setD] = useState<D>(() => fromVisit(visit));
  const [error, setError] = useState("");
  const [kept, setKept] = useState(false);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useStep(STEPS.length);
  const draft = useDraft<D>(`fp-visit-${visit.id}`);
  const restored = useRef(false);

  useEffect(() => {
    if (restored.current || !draft.ready) return;
    restored.current = true;
    const local = draft.read();
    queueMicrotask(() => {
      setReady(true);
      if (local && JSON.stringify(local) !== JSON.stringify(d)) { setD(local); setKept(true); }
    });
  }, [draft, d]);

  const { status } = useAutosave(
    d,
    async (v) => {
      const nul = (x: string) => (x.trim() ? x.trim() : null);
      const r = await updateVisit(supabase, visit.id, { specialist: nul(v.specialist), visit_date: nul(v.visit_date), open_today: nul(v.open_today), question1: nul(v.question1), question2: nul(v.question2), since_last_visit: nul(v.since_last_visit), read_first: v.read_first.map((l) => l.trim()).filter(Boolean) });
      if (!r.ok) { setError(r.error); return false; }
      setError("");
      draft.clear();
      return true;
    },
    { enabled: ready },
  );

  const put = (patch: Partial<D>) => setD((x) => { const next = { ...x, ...patch }; draft.write(next); return next; });
  const setLine = (i: number, v: string) => put({ read_first: d.read_first.map((l, j) => (j === i ? v : l)) });
  function pickLine(s: string) {
    const i = d.read_first.findIndex((l) => !l.trim());
    if (i >= 0) setLine(i, s);
  }
  const linesFull = d.read_first.every((l) => l.trim());

  const body = [
    <>
      <CardTitle>Who you are seeing, and when</CardTitle>
      <Input label="Who you are seeing" value={d.specialist} onChange={(v) => put({ specialist: v })} placeholder="e.g. neurology, Dr. [name]" />
      <Input label="Date" value={d.visit_date} onChange={(v) => put({ visit_date: v })} placeholder="e.g. 2026-12-03" type="date" />
    </>,
    <>
      <CardTitle lede="The doctor reads these in the first thirty seconds. You choose them. Unpolished is fine, even &quot;I don't know where to start.&quot; Pick from your recording, or say them now with the microphone.">
        Read this first: three lines in your own words
      </CardTitle>
      <div className="space-y-4">
        {d.read_first.map((l, i) => <Input key={i} id={`read-first-${i + 1}`} label={`Line ${i + 1}`} value={l} onChange={(v) => setLine(i, v)} voice />)}
      </div>
      {sentences.length > 0 && (
        <div>
          <p className="field-label">From your recording, tap a sentence to use it</p>
          {linesFull && <p className="mb-2 text-sm text-muted">All three lines are filled. Clear one to swap in a sentence.</p>}
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {sentences.map((s, i) => (
              <button key={i} type="button" onClick={() => pickLine(s)} disabled={linesFull || d.read_first.includes(s)} className="btn btn-secondary h-auto min-h-12 w-full justify-start text-left font-normal leading-snug">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      {!hasRecording && (
        <p className="text-[0.9375rem] text-muted">
          No recording yet. <Link href="/first-page/record" className="font-semibold text-brand hover:underline">Record your story</Link> and your sentences appear here.
        </p>
      )}
    </>,
    <>
      <CardTitle lede="What is going on right now, in plain facts with dates. No causes, no guesses.">Open today</CardTitle>
      <TextField label="Open today" value={d.open_today} onChange={(v) => put({ open_today: v })} rows={4} placeholder="e.g. Headaches up from 2 to 4 a week since March. Sleep broken even on the machine. No new head injury." />
    </>,
    <>
      <CardTitle lede="Two, so both get answered.">Your two questions</CardTitle>
      <Input label="My first question" value={d.question1} onChange={(v) => put({ question1: v })} voice placeholder="e.g. Is anything on my pill list making the headaches worse?" />
      <Input label="My second question" value={d.question2} onChange={(v) => put({ question2: v })} voice placeholder="e.g. Should the sleep study be repeated?" />
    </>,
    <>
      <CardTitle lede="What changed since you last saw this doctor.">Since last visit</CardTitle>
      <TextField label="Since last visit" value={d.since_last_visit} onChange={(v) => put({ since_last_visit: v })} rows={3} placeholder="e.g. Headaches up to 4 a week since March. Stopped evening coffee in May. No new medicines." />
    </>,
  ];

  return (
    <section className="card space-y-5 p-5 sm:p-6">
      <Notice error={error} />
      <KeptNotice show={kept} />
      <StepNav steps={STEPS} step={step} status={<SavedMark status={status} />} />
      {body[step]}
      <StepNav.Buttons
        step={step}
        total={STEPS.length}
        onBack={() => setStep(step - 1)}
        onNext={() => setStep(step + 1)}
        done={<button type="button" onClick={onDone} className="btn btn-primary btn-lg max-sm:w-full">Done with this visit</button>}
      />
    </section>
  );
}

export default function VisitEditor() {
  const { supabase, user } = useAuth();
  const { offer } = useUndo();
  const [visits, setVisits] = useState<FpVisit[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [recordings, setRecordings] = useState<FpRecording[]>([]);
  const [editing, setEditing] = useState<FpVisit | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const [v, r] = await Promise.all([listVisits(supabase), listRecordings(supabase)]);
    if (!v.ok) { setError(v.error); return; }
    setVisits(v.data);
    if (r.ok) setRecordings(r.data);
  }, [supabase]);
  useEffect(() => {
    if (!user) return;
    (async () => { await refresh(); })();
  }, [user, refresh]);

  // A new visit is made at once, empty, so every step can save itself.
  async function startNew() {
    setBusy(true); setError("");
    const r = await createVisit(supabase, { read_first: [] });
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    setEditing(r.data);
  }

  function remove(v: FpVisit) {
    setHidden((h) => [...h, v.id]);
    offer({
      message: `Removed the visit${v.specialist ? ` with ${v.specialist}` : ""}.`,
      commit: async () => { await deleteVisit(supabase, v.id); setHidden((h) => h.filter((x) => x !== v.id)); refresh(); },
      undo: () => setHidden((h) => h.filter((x) => x !== v.id)),
    });
  }

  if (!user) return <Notice>Sign in to build your First Page.</Notice>;
  const sentences = recordings.flatMap((r) => splitSentences(r.transcript ?? ""));
  const list = visits.filter((v) => !hidden.includes(v.id));

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <BackToHub />
      <Stance />
      <Notice error={error} />

      {editing ? (
        <VisitSteps key={editing.id} visit={editing} sentences={sentences} hasRecording={recordings.length > 0} onDone={() => { setEditing(null); refresh(); }} />
      ) : (
        <section className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Your visits</CardTitle>
            <PrimaryButton onClick={startNew} disabled={busy}>{busy ? "Setting up…" : "Set up a visit"}</PrimaryButton>
          </div>
          {list.length === 0 ? (
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">None yet. Each visit gets its own page: what is open that day, your two questions, since last time.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {list.map((v) => {
                const ready = v.read_first.length === 3 && v.question1 && v.question2;
                return (
                  <li key={v.id} className="space-y-3 py-4">
                    <div>
                      <p className="text-[0.9375rem] font-semibold leading-snug text-ink">
                        {v.specialist || "Visit"}{v.visit_date ? <span className="tnum font-normal text-muted">, {v.visit_date}</span> : null}
                      </p>
                      <p className={`mt-0.5 text-sm font-semibold ${ready ? "text-success" : "text-muted"}`}>{ready ? "Ready" : "Not finished"}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/first-page/print?visit=${v.id}`} className="btn btn-primary">Preview and print</Link>
                      <QuietButton onClick={() => setEditing(v)}>Edit</QuietButton>
                      <QuietButton danger onClick={() => remove(v)}>Remove</QuietButton>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
