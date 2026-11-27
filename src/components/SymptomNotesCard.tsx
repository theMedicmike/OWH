"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import { KeptNotice, useDraft, useUndo } from "./Keep";
import {
  listSymptomNotes,
  createSymptomNote,
  deleteSymptomNote,
  fileSymptomNote,
  type SymptomNote,
} from "@/lib/symptomNotes";

// ─────────────────────────────────────────────────────────────────────────────
// "SOMETHING'S GOING ON" — capture first, classify later.
//
// The gap this closes: until now the only way to record a symptom was to first
// pick the condition it belongs to. A veteran at 2am who doesn't know whether
// what he's feeling is the PTSD, the heart, or neither had nowhere to put it,
// so he closed the app and the fact was lost.
//
// WHAT IS DELIBERATELY NOT HERE, and it is not an oversight:
//   • No severity slider, no 0–10, no mood face. A number invites invention
//     and a sentence does not, and severity scales are the single thing most
//     likely to make a record read padded.
//   • No streak, no chain, no "you've logged N days running."
//   • No notification, and no copy suggesting that logging more often makes a
//     claim stronger. It does not — continuity is about a record being
//     unbroken by unexplained silences, not about how densely it's sampled.
// Council ruling 2026-08-14: nudged density produces a record that reads
// manufactured rather than lived, which is worse for the veteran than a
// sparser honest one. This is a guidance feature, not a retention mechanic.
// ─────────────────────────────────────────────────────────────────────────────

type ConditionOpt = { id: string; label: string };

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function pretty(d: string): string {
  const dt = new Date(d + "T00:00:00Z");
  return dt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

export default function SymptomNotesCard({ conditions = [] }: { conditions?: ConditionOpt[] }) {
  const { user, supabase } = useAuth();
  const [notes, setNotes] = useState<SymptomNote[] | null>(null);
  const [notSetUp, setNotSetUp] = useState(false);
  const [text, setText] = useState("");
  const [when, setWhen] = useState(todayISO());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [filing, setFiling] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [hidden, setHidden] = useState<string[]>([]);
  const { offer } = useUndo();

  // The note being written keeps a copy on this device until Save.
  const draft = useDraft<{ text: string; when: string }>("symptom-note-add");
  const restored = useRef(false);
  const [kept, setKept] = useState(false);
  useEffect(() => {
    if (restored.current || !draft.ready) return;
    restored.current = true;
    const d = draft.read();
    // Applied from the device copy (an outside store), just after this effect.
    if (d && d.text) queueMicrotask(() => { setText(d.text); if (d.when) setWhen(d.when); setKept(true); });
  }, [draft]);
  useEffect(() => {
    if (!restored.current) return;
    if (text) draft.write({ text, when });
    else draft.clear();
  }, [text, when, draft]);

  const load = useCallback(async () => {
    const res = await listSymptomNotes(supabase);
    if ("error" in res) {
      setNotSetUp(res.error === "not-set-up");
      setNotes([]);
      return;
    }
    setNotes(res.notes);
  }, [supabase]);

  useEffect(() => {
    if (!user) return;
    void (async () => { await load(); })();
  }, [user, load]);

  async function save() {
    setErr("");
    setBusy(true);
    const res = await createSymptomNote(supabase, { note: text, noticedOn: when });
    setBusy(false);
    if (res.status === "error") { setErr(res.message); return; }
    setText("");
    setWhen(todayISO());
    draft.clear();
    setKept(false);
    // A persistent line, not a toast that vanishes before it can be read.
    setSaved(true);
    await load();
  }

  async function file(n: SymptomNote, conditionId: string) {
    setErr("");
    setFiling(n.id);
    const res = await fileSymptomNote(supabase, { id: n.id, note: n, conditionId });
    setFiling(null);
    if (res.status === "error") { setErr(res.message); return; }
    await load();
  }

  // Remove is held behind the Undo bar and carried out when the bar closes.
  function remove(n: SymptomNote) {
    setHidden((h) => [...h, n.id]);
    offer({
      message: `Removed: ${n.note.length > 40 ? `${n.note.slice(0, 40)}…` : n.note}`,
      commit: async () => { await deleteSymptomNote(supabase, n.id); await load(); setHidden((h) => h.filter((x) => x !== n.id)); },
      undo: () => setHidden((h) => h.filter((x) => x !== n.id)),
    });
  }

  if (notes === null) return null;
  const shown = notes.filter((n) => !hidden.includes(n.id));

  if (notSetUp) {
    return (
      <div className="card p-5">
        <h2 className="text-lg font-semibold tracking-tight text-ink">Something going on?</h2>
        <p className="mt-2 text-[0.9375rem] text-muted">This isn&apos;t switched on yet. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h2 className="text-lg font-semibold tracking-tight text-ink">Something going on? Write it down.</h2>
      <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted">
        You don&apos;t have to know what it is or which condition it belongs to. Get it down while it&apos;s
        fresh, in your own words. You can file it against a condition later, or ask your VSO to help you
        work out where it goes.
      </p>

      {kept && <div className="mt-4"><KeptNotice show /></div>}
      <label htmlFor="symptom-note" className="field-label mt-4">What&apos;s going on</label>
      <textarea
        id="symptom-note"
        value={text}
        onChange={(e) => { setText(e.target.value); setSaved(false); }}
        rows={3}
        placeholder="e.g. Couldn't sleep again, chest tight until about 4am."
        className="field"
      />
      <div className="mt-3 grid gap-3 sm:grid-cols-[12rem_auto] sm:items-end">
        <div>
          <label htmlFor="symptom-when" className="field-label">When</label>
          <input
            id="symptom-when"
            type="date"
            value={when}
            max={todayISO()}
            onChange={(e) => setWhen(e.target.value)}
            className="field"
          />
        </div>
        <button
          type="button"
          onClick={save}
          disabled={busy || !text.trim()}
          className="btn btn-primary btn-lg"
        >
          {busy ? "Saving…" : "Save it"}
        </button>
      </div>
      {saved && <p className="mt-3 text-[0.9375rem] font-semibold text-success" aria-live="polite">Saved. It&apos;s on your record.</p>}
      {err && <p role="alert" className="mt-3 text-[0.9375rem] font-medium text-scarlet">{err}</p>}

      {shown.length > 0 && (
        <div className="mt-6 border-t border-line pt-4">
          <h3 className="text-[0.9375rem] font-semibold text-ink">Not filed yet</h3>
          <p className="mt-0.5 text-sm leading-relaxed text-muted">
            These are saved and dated. Filing one puts it in that condition&apos;s history, keeping the date you
            wrote it. Nothing here is lost if you leave it unfiled.
          </p>
          <ul className="mt-3 space-y-3">
            {shown.map((n) => (
              <li key={n.id} className="rounded-xl border border-line bg-canvas p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-muted">{pretty(n.noticed_on)}</span>
                  <button type="button" onClick={() => remove(n)} className="btn btn-ghost text-muted">
                    Remove
                  </button>
                </div>
                <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink">{n.note}</p>

                {conditions.length > 0 ? (
                  <div className="mt-3">
                    <label htmlFor={`file-${n.id}`} className="field-label">File under</label>
                    <select
                      id={`file-${n.id}`}
                      defaultValue=""
                      disabled={filing === n.id}
                      onChange={(e) => { if (e.target.value) file(n, e.target.value); }}
                      className="field"
                    >
                      <option value="">{filing === n.id ? "Filing…" : "Choose a condition"}</option>
                      {conditions.map((c) => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    Once you&apos;ve added a condition above, you&apos;ll be able to file this under it.
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
