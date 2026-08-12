"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
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

export default function ConditionImpactJournal({ conditionId, onsetYear }: { conditionId: string; onsetYear: number | null }) {
  const { supabase } = useAuth();
  const [notes, setNotes] = useState<ConditionNote[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [year, setYear] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const res = await listConditionNotes(supabase, conditionId);
    setNotes("notes" in res ? res.notes : []);
  }, [supabase, conditionId]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    setErr("");
    setBusy(true);
    const res = await createConditionNote(supabase, { conditionId, noticedYear: year, noticedMonth: null, note: text });
    setBusy(false);
    if (res.status === "error") { setErr(res.message); return; }
    setText("");
    setYear(null);
    setAdding(false);
    await load();
  }

  async function remove(id: string) {
    await deleteConditionNote(supabase, id);
    await load();
  }

  if (notes === null) return null;

  return (
    <div className="border-t border-line pt-3">
      <div className="text-xs font-semibold text-ink">How this has affected you — dated</div>
      <p className="mt-0.5 text-[11px] leading-relaxed text-faint">
        A C&amp;P examiner is trained to ask how a condition affects your day-to-day, not just that you have it.
        Dated entries in your own words are what shows this has been consistent over time, not a one-time
        complaint. Add to it any time.
      </p>
      {notes.length > 0 && (
        <ul className="mt-2 space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="rounded-lg border border-line bg-canvas p-2.5">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-semibold text-muted">
                  {n.noticed_year ? `Around ${n.noticed_year}` : "No date given"}
                </span>
                <button onClick={() => remove(n.id)} className="text-[11px] text-faint hover:text-red-600">Remove</button>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-ink">{n.note}</p>
              <span className="mt-1 block text-[10px] text-faint">
                Logged {new Date(n.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
              </span>
            </li>
          ))}
        </ul>
      )}
      {adding ? (
        <div className="mt-2 rounded-lg border border-brand/30 bg-brand/5 p-3">
          <div className="text-[11px] font-medium text-muted">About when?</div>
          <div className="mt-1 w-24">
            <JournalYearPicker year={year} minYear={onsetYear ?? 1940} onChange={setYear} />
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="What this has kept you from doing, or made harder — in your own words. No AI help, nobody else's wording."
            className="mt-2 w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-sm text-ink placeholder:text-faint focus:border-brand focus:outline-none"
          />
          {err && <p className="mt-1 text-[11px] text-scarlet">{err}</p>}
          <div className="mt-2 flex gap-2">
            <button onClick={save} disabled={busy || !text.trim()} className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground hover:bg-brand-600 disabled:opacity-50">
              {busy ? "Saving…" : "Save"}
            </button>
            <button onClick={() => setAdding(false)} className="rounded-md border border-line px-3 py-1.5 text-xs text-muted hover:bg-canvas">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="mt-2 text-xs font-semibold text-brand hover:underline">
          + Add how this has affected you
        </button>
      )}
    </div>
  );
}
