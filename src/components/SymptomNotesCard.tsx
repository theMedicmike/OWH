"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
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
    load();
  }, [user, load]);

  async function save() {
    setErr("");
    setBusy(true);
    const res = await createSymptomNote(supabase, { note: text, noticedOn: when });
    setBusy(false);
    if (res.status === "error") { setErr(res.message); return; }
    setText("");
    setWhen(todayISO());
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

  async function remove(id: string) {
    await deleteSymptomNote(supabase, id);
    await load();
  }

  if (notes === null) return null;

  if (notSetUp) {
    return (
      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="text-sm font-semibold text-ink">Something going on?</div>
        <p className="mt-2 text-sm text-muted">This isn&apos;t switched on yet — check back soon.</p>
      </div>
    );
  }

  return (
    <div className="surface-rest rounded-xl border border-line bg-surface p-5">
      <div className="text-sm font-semibold text-ink">Something going on? Write it down.</div>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        You don&apos;t have to know what it is or which condition it belongs to. Get it down while it&apos;s
        fresh, in your own words — you can file it against a condition later, or ask your VSO to help you
        work out where it goes.
      </p>

      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setSaved(false); }}
        rows={3}
        placeholder="e.g. Couldn't sleep again, chest tight until about 4am."
        className="mt-3 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-brand focus:outline-none"
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-muted">
          When
          <input
            type="date"
            value={when}
            max={todayISO()}
            onChange={(e) => setWhen(e.target.value)}
            className="rounded-md border border-line bg-white px-2 py-1.5 text-xs text-ink focus:border-brand focus:outline-none"
          />
        </label>
        <button
          onClick={save}
          disabled={busy || !text.trim()}
          className="press rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-600 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save it"}
        </button>
        {saved && <span className="text-xs font-medium text-success">Saved. It&apos;s on your record.</span>}
      </div>
      {err && <p className="mt-2 text-xs text-scarlet">{err}</p>}

      {notes.length > 0 && (
        <div className="mt-5 border-t border-line pt-4">
          <div className="text-xs font-semibold text-ink">Not filed yet</div>
          <p className="mt-0.5 text-[11px] leading-relaxed text-faint">
            These are saved and dated. Filing one puts it in that condition&apos;s history, keeping the date you
            wrote it. Nothing here is lost if you leave it unfiled.
          </p>
          <ul className="mt-3 space-y-2">
            {notes.map((n) => (
              <li key={n.id} className="rounded-lg border border-line bg-canvas p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-semibold text-muted">{pretty(n.noticed_on)}</span>
                  <button onClick={() => remove(n.id)} className="text-[11px] text-faint hover:text-red-600">
                    Remove
                  </button>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-ink">{n.note}</p>

                {conditions.length > 0 ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <label className="text-[11px] text-muted">File under</label>
                    <select
                      defaultValue=""
                      disabled={filing === n.id}
                      onChange={(e) => { if (e.target.value) file(n, e.target.value); }}
                      className="rounded-md border border-line bg-white px-2 py-1 text-xs text-ink focus:border-brand focus:outline-none"
                    >
                      <option value="">{filing === n.id ? "Filing…" : "Choose a condition…"}</option>
                      {conditions.map((c) => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] leading-relaxed text-faint">
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
