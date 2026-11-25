"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../AuthProvider";
import { createVisit, deleteVisit, listRecordings, listVisits, updateVisit, type FpRecording, type FpVisit } from "@/lib/firstPage";
import { BackToHub, CardTitle, Input, Notice, PrimaryButton, QuietButton, Stance, TextField } from "./Controls";

// One visit at a time: who, when, what is open today, the two questions, since
// last visit, and the three "Read this first" lines picked from the veteran's
// own recorded words. The veteran chooses the lines; nobody else does.

const BLANK = { specialist: "", visit_date: "", open_today: "", question1: "", question2: "", since_last_visit: "", read_first: ["", "", ""] };

function splitSentences(t: string): string[] {
  return t.replace(/\s+/g, " ").split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 8);
}

export default function VisitEditor() {
  const { supabase, user } = useAuth();
  const [visits, setVisits] = useState<FpVisit[]>([]);
  const [recordings, setRecordings] = useState<FpRecording[]>([]);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [d, setD] = useState(BLANK);
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

  function startNew() { setD(BLANK); setEditing("new"); }
  function startEdit(v: FpVisit) {
    setD({ specialist: v.specialist ?? "", visit_date: v.visit_date ?? "", open_today: v.open_today ?? "", question1: v.question1 ?? "", question2: v.question2 ?? "", since_last_visit: v.since_last_visit ?? "", read_first: [v.read_first[0] ?? "", v.read_first[1] ?? "", v.read_first[2] ?? ""] });
    setEditing(v.id);
  }
  const setLine = (i: number, v: string) => setD((x) => ({ ...x, read_first: x.read_first.map((l, j) => (j === i ? v : l)) }));
  function pickLine(s: string) {
    const i = d.read_first.findIndex((l) => !l.trim());
    if (i >= 0) setLine(i, s);
  }

  async function save() {
    setBusy(true); setError("");
    const nul = (v: string) => (v.trim() ? v.trim() : null);
    const payload = { specialist: nul(d.specialist), visit_date: nul(d.visit_date), open_today: nul(d.open_today), question1: nul(d.question1), question2: nul(d.question2), since_last_visit: nul(d.since_last_visit), read_first: d.read_first.map((l) => l.trim()).filter(Boolean) };
    const r = editing === "new" ? await createVisit(supabase, payload) : await updateVisit(supabase, editing as string, payload);
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    setEditing(null);
    refresh();
  }

  if (!user) return <Notice>Sign in to build your First Page.</Notice>;
  const sentences = recordings.flatMap((r) => splitSentences(r.transcript ?? ""));
  const linesFull = d.read_first.every((l) => l.trim());

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <BackToHub />
      <Stance />
      <Notice error={error} />

      {editing === null ? (
        <section className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Your visits</CardTitle>
            <PrimaryButton onClick={startNew}>Set up a visit</PrimaryButton>
          </div>
          {visits.length === 0 ? (
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">None yet. Each visit gets its own page: what is open that day, your two questions, since last time.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {visits.map((v) => {
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
                      <QuietButton onClick={() => startEdit(v)}>Edit</QuietButton>
                      <QuietButton danger onClick={async () => { await deleteVisit(supabase, v.id); refresh(); }}>Remove</QuietButton>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : (
        <section className="card space-y-5 p-5 sm:p-6">
          <CardTitle>{editing === "new" ? "A new visit" : "Edit this visit"}</CardTitle>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Who you are seeing" value={d.specialist} onChange={(v) => setD({ ...d, specialist: v })} placeholder="e.g. neurology, Dr. [name]" />
            <Input label="Date" value={d.visit_date} onChange={(v) => setD({ ...d, visit_date: v })} placeholder="e.g. 2026-12-03" type="date" />
          </div>

          <div className="rounded-xl border border-brand/30 bg-brand/5 p-4 sm:p-5">
            <h3 className="text-lg font-semibold tracking-tight text-ink">Read this first: three lines in your own words</h3>
            <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted">
              The doctor reads these in the first thirty seconds. You choose them. Unpolished is fine, even &quot;I don&apos;t know
              where to start.&quot; Pick from your recording, or say them now with the microphone.
            </p>
            <div className="mt-4 space-y-4">
              {d.read_first.map((l, i) => <Input key={i} id={`read-first-${i + 1}`} label={`Line ${i + 1}`} value={l} onChange={(v) => setLine(i, v)} voice />)}
            </div>
            {sentences.length > 0 && (
              <div className="mt-5">
                <p className="field-label">From your recording, tap a sentence to use it</p>
                {linesFull && <p className="mb-2 text-sm text-muted">All three lines are filled. Clear one to swap in a sentence.</p>}
                <div className="max-h-80 space-y-2 overflow-y-auto">
                  {sentences.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => pickLine(s)}
                      disabled={linesFull || d.read_first.includes(s)}
                      className="btn btn-secondary h-auto min-h-12 w-full justify-start text-left font-normal leading-snug"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {recordings.length === 0 && (
              <p className="mt-3 text-[0.9375rem] text-muted">
                No recording yet. <Link href="/first-page/record" className="font-semibold text-brand hover:underline">Record your story</Link> and your sentences appear here.
              </p>
            )}
          </div>

          <TextField label="Open today" help="What is going on right now, in plain facts with dates. No causes, no guesses." value={d.open_today} onChange={(v) => setD({ ...d, open_today: v })} rows={3} placeholder="e.g. Headaches up from 2 to 4 a week since March. Sleep broken even on the machine. No new head injury. No new medicine since 2023." />
          <Input label="My first question" value={d.question1} onChange={(v) => setD({ ...d, question1: v })} voice placeholder="e.g. Are the headaches and the broken sleep connected to the 2010 blast, or to each other?" />
          <Input label="My second question" value={d.question2} onChange={(v) => setD({ ...d, question2: v })} voice placeholder="e.g. Is anything on my pill list making either one worse?" />
          <TextField label="Since last visit" value={d.since_last_visit} onChange={(v) => setD({ ...d, since_last_visit: v })} rows={2} placeholder="e.g. Headaches up to 4 a week since March. Stopped evening coffee in May. No new medicines." />

          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton large onClick={save} disabled={busy}>{busy ? "Saving…" : "Save this visit"}</PrimaryButton>
            <QuietButton onClick={() => setEditing(null)}>Cancel</QuietButton>
          </div>
        </section>
      )}
    </div>
  );
}
