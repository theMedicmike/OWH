"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import { KeptNotice, useDraft, useUndo } from "./Keep";
import { listConditionNotes, createConditionNote, deleteConditionNote, type ConditionNote } from "@/lib/conditionNotes";
import WheelPicker from "./WheelPicker";

// THE DATED IMPACT JOURNAL — same shape and reasoning as the incident-side
// "what you've noticed since" log (InjuriesListCard's NotesSection), applied
// to a condition instead of an event. A rater and a C&P examiner are both
// trained to look for two things this app had no place to capture: whether
// symptoms have been consistent over time (38 CFR 3.303(b)), and how the
// condition actually affects ordinary activities (38 CFR 4.10) — not just
// that it exists. Dated, in the veteran's own words, never AI-touched.

function JournalYearPicker({ year, minYear, onChange }: { year: number | null; minYear: number; onChange: (y: number | null) => void }) {
  const years = Array.from({ length: new Date().getUTCFullYear() - minYear + 1 }, (_, i) => String(minYear + i));
  const idx = year ? years.indexOf(String(year)) : years.length - 1;
  return (
    <WheelPicker
      options={["Not sure", ...years]}
      index={year && idx >= 0 ? idx + 1 : 0}
      onChange={(i) => onChange(i === 0 ? null : parseInt(years[i - 1], 10))}
      ariaLabel="Year you're describing"
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// THE TIMELINE — a passive picture of an existing record, nothing more.
//
// Council ruling 2026-08-14 drew the line here precisely, and it is a narrow
// one. What continuity of symptomatology actually turns on is whether a record
// is unbroken by unexplained silences — NOT how densely it is sampled. Walker
// v. Shinseki (Fed. Cir. 2013) also limits 38 CFR 3.303(b) continuity to the
// chronic diseases listed at 3.309(a); for everything else these entries are
// ordinary lay evidence. Either way, no authority rewards daily entries over
// consistent periodic ones.
//
// So this is a VISUALIZATION, never an engagement mechanic:
//   • Dots for years that have entries. That is the whole picture.
//   • A neutral "last logged" line — a fact, stated once.
//   • NO streak, NO counter framed as progress, NO severity score, NO trend
//     line, NO AI summary of "what your entries suggest", NO push notification,
//     and no copy anywhere that encourages logging to "build a stronger case."
// The council's physician was explicit that nudging a veteran toward padding
// entries produces a record that reads manufactured rather than lived — which
// is worse for them than a sparser honest one.
function JournalTimeline({ notes, onsetYear }: { notes: ConditionNote[]; onsetYear: number | null }) {
  // Read the clock once, when the timeline first shows, not on every render.
  const [now] = useState(() => Date.now());
  const nowYear = new Date().getUTCFullYear();
  const entryYears = new Set(
    notes.map((n) => n.noticed_year ?? new Date(n.created_at).getUTCFullYear()),
  );
  if (entryYears.size === 0) return null;

  const first = Math.min(...entryYears, onsetYear ?? nowYear);
  const years: number[] = [];
  for (let y = first; y <= nowYear; y++) years.push(y);

  const lastLogged = notes.reduce<number>(
    (max, n) => Math.max(max, new Date(n.created_at).getTime()),
    0,
  );
  const daysSince = lastLogged ? Math.floor((now - lastLogged) / 86_400_000) : null;

  return (
    <div className="mt-3 rounded-xl border border-line bg-canvas p-3">
      <div className="flex items-end gap-[2px]" aria-hidden="true">
        {years.map((y) => (
          <div key={y} className="flex flex-1 flex-col items-center gap-1">
            <span
              className={
                entryYears.has(y)
                  ? "h-2 w-2 rounded-full bg-brand"
                  : "h-2 w-2 rounded-full border border-line bg-transparent"
              }
            />
            <span className="h-1 w-full rounded-full bg-line/60" />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-sm tabular-nums text-muted">
        <span>{first}</span>
        <span>{nowYear}</span>
      </div>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        {/* Deliberately a plain fact, not a prompt. Never "log today to…". */}
        {entryYears.size === 1
          ? `Entries in ${[...entryYears][0]}.`
          : `Entries spanning ${first}–${Math.max(...entryYears)}.`}
        {daysSince !== null && (
          <span>
            {" "}
            Last logged {daysSince === 0 ? "today" : daysSince === 1 ? "yesterday" : `${daysSince} days ago`}.
          </span>
        )}
      </p>
    </div>
  );
}

export default function ConditionImpactJournal({ conditionId, onsetYear }: { conditionId: string; onsetYear: number | null }) {
  const { supabase } = useAuth();
  const [notes, setNotes] = useState<ConditionNote[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [year, setYear] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [hidden, setHidden] = useState<string[]>([]);
  const { offer } = useUndo();

  // The entry being written keeps a copy on this device (by condition) until
  // Save, so a refresh or Close never loses it.
  const draft = useDraft<{ text: string; year: number | null }>(`condition-impact-${conditionId}`);
  const restored = useRef(false);
  const [kept, setKept] = useState(false);
  useEffect(() => {
    if (restored.current || !draft.ready) return;
    restored.current = true;
    const d = draft.read();
    // Applied from the device copy (an outside store), just after this effect.
    if (d && d.text) queueMicrotask(() => { setText(d.text); setYear(d.year); setAdding(true); setKept(true); });
  }, [draft]);
  useEffect(() => {
    if (!restored.current) return;
    if (text) draft.write({ text, year });
    else draft.clear();
  }, [text, year, draft]);

  const load = useCallback(async () => {
    const res = await listConditionNotes(supabase, conditionId);
    setNotes("notes" in res ? res.notes : []);
  }, [supabase, conditionId]);

  useEffect(() => { void (async () => { await load(); })(); }, [load]);

  async function save() {
    setErr("");
    setBusy(true);
    const res = await createConditionNote(supabase, { conditionId, noticedYear: year, noticedMonth: null, note: text });
    setBusy(false);
    if (res.status === "error") { setErr(res.message); return; }
    setText("");
    setYear(null);
    draft.clear();
    setKept(false);
    setAdding(false);
    await load();
  }

  // Remove is held behind the Undo bar and carried out when the bar closes.
  function remove(n: ConditionNote) {
    setHidden((h) => [...h, n.id]);
    offer({
      message: `Removed: ${n.note.length > 40 ? `${n.note.slice(0, 40)}…` : n.note}`,
      commit: async () => { await deleteConditionNote(supabase, n.id); await load(); setHidden((h) => h.filter((x) => x !== n.id)); },
      undo: () => setHidden((h) => h.filter((x) => x !== n.id)),
    });
  }

  if (notes === null) return null;
  const shown = notes.filter((n) => !hidden.includes(n.id));

  return (
    <div className="border-t border-line pt-4">
      <h3 className="text-[0.9375rem] font-semibold text-ink">How this has affected you, by date</h3>
      <p className="mt-0.5 text-sm leading-relaxed text-muted">
        A C&amp;P examiner is trained to ask how a condition affects your day-to-day, not just that you have it.
        Dated entries in your own words are what shows this has been consistent over time, not a one-time
        complaint. Add to it any time.
      </p>
      <JournalTimeline notes={shown} onsetYear={onsetYear} />
      {shown.length > 0 && (
        <ul className="mt-3 space-y-2">
          {shown.map((n) => (
            <li key={n.id} className="rounded-xl border border-line bg-canvas p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-muted">
                  {n.noticed_year ? `Around ${n.noticed_year}` : "No date given"}
                </span>
                <button type="button" onClick={() => remove(n)} className="btn btn-ghost text-muted">Remove</button>
              </div>
              <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink">{n.note}</p>
              <span className="mt-1 block text-sm text-muted">
                Logged {new Date(n.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
              </span>
            </li>
          ))}
        </ul>
      )}
      {adding ? (
        <div className="mt-3 rounded-xl border border-brand/30 bg-brand/5 p-4">
          {kept && <div className="mb-3"><KeptNotice show /></div>}
          <span className="field-label">About when?</span>
          <div className="w-36">
            <JournalYearPicker year={year} minYear={onsetYear ?? 1940} onChange={setYear} />
          </div>
          <label htmlFor={`impact-${conditionId}`} className="field-label mt-4">In your own words</label>
          <textarea
            id={`impact-${conditionId}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="What this has kept you from doing, or made harder. No AI help, nobody else's wording."
            className="field"
          />
          {err && <p role="alert" className="mt-2 text-[0.9375rem] font-medium text-scarlet">{err}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={save} disabled={busy || !text.trim()} className="btn btn-primary">
              {busy ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => setAdding(false)} className="btn btn-secondary">Close for now</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="btn btn-secondary mt-3">
          {text ? "Finish what you were writing" : "Add how this has affected you"}
        </button>
      )}
    </div>
  );
}
