"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { KeptNotice, useDraft, useUndo } from "./Keep";
import { listMemberIncidents, deleteIncident, PROVENANCE_LABEL, type IncidentRecord } from "@/lib/incidents";
import { listIncidentNotes, createIncidentNote, deleteIncidentNote, type IncidentNote } from "@/lib/incidentNotes";
import { listIncidentWitnesses, createIncidentWitness, deleteIncidentWitness, type IncidentWitness } from "@/lib/incidentWitnesses";
import { INCIDENT_LABEL, type IncidentClass } from "@/lib/education";
import { evidentiaryNoteFor, isMarkersBased } from "@/lib/incidentCopy";
import WheelPicker from "./WheelPicker";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function yr(d: string | null): number | null {
  return d ? new Date(d).getUTCFullYear() : null;
}

function dateLabel(r: IncidentRecord): string {
  const sy = yr(r.dateStart);
  const ey = yr(r.dateEnd);
  if (r.repeated) return sy && ey && ey !== sy ? `${sy}–${ey} (repeated)` : sy ? `${sy} (repeated)` : "Repeated, no date";
  if (!sy) return "No date";
  if (r.dateStartPrecision === "approximate") return `circa ${sy}`;
  if (r.dateStartPrecision === "day" && r.dateStart) {
    const d = new Date(r.dateStart);
    return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${sy}`;
  }
  if (r.dateStartPrecision === "month" && r.dateStart) {
    const d = new Date(r.dateStart);
    return `${MONTHS[d.getUTCMonth()]} ${sy}`;
  }
  return String(sy);
}

// Every delete in this card is held behind the Undo bar, so a shaky tap never
// loses an entry: the row hides at once and is only removed when the bar
// closes.
function RemoveControl({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button type="button" onClick={onRemove} aria-label={label} className="btn btn-ghost flex-none text-muted">
      Remove
    </button>
  );
}

const short = (s: string) => (s.length > 40 ? `${s.slice(0, 40)}…` : s);

function NoteYearPicker({ year, minYear, onChange }: { year: number | null; minYear: number; onChange: (y: number | null) => void }) {
  // Can't notice a symptom before the event happened — start the wheel at
  // the incident's own year, not a fixed 1940 that makes finding your own
  // entry take fifty extra spins.
  const noteYears = Array.from({ length: new Date().getUTCFullYear() - minYear + 1 }, (_, i) => String(minYear + i));
  const idx = year ? noteYears.indexOf(String(year)) : noteYears.length - 1;
  return (
    <WheelPicker
      options={["Not sure", ...noteYears]}
      index={year && idx >= 0 ? idx + 1 : 0}
      onChange={(i) => onChange(i === 0 ? null : parseInt(noteYears[i - 1], 10))}
      ariaLabel="Year you noticed this"
    />
  );
}

function NotesSection({ incidentId, incidentYear }: { incidentId: string; incidentYear: number | null }) {
  const { supabase } = useAuth();
  const [notes, setNotes] = useState<IncidentNote[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [noticedYear, setNoticedYear] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [hidden, setHidden] = useState<string[]>([]);
  const { offer } = useUndo();

  // The note being written is a new row, so it keeps a copy on this device
  // (by incident) until Save, rather than saving half a sentence.
  const draft = useDraft<{ text: string; noticedYear: number | null }>(`incident-note-${incidentId}`);
  const restored = useRef(false);
  const [kept, setKept] = useState(false);
  useEffect(() => {
    if (restored.current || !draft.ready) return;
    restored.current = true;
    const d = draft.read();
    // Applied from the device copy (an outside store), just after this effect.
    if (d && d.text) queueMicrotask(() => { setText(d.text); setNoticedYear(d.noticedYear); setAdding(true); setKept(true); });
  }, [draft]);
  useEffect(() => {
    if (!restored.current) return;
    if (text) draft.write({ text, noticedYear });
    else draft.clear();
  }, [text, noticedYear, draft]);

  const load = useCallback(async () => {
    const res = await listIncidentNotes(supabase, incidentId);
    setNotes("notes" in res ? res.notes : []);
  }, [supabase, incidentId]);

  useEffect(() => { void (async () => { await load(); })(); }, [load]);

  async function save() {
    setErr("");
    setBusy(true);
    const res = await createIncidentNote(supabase, { incidentId, noticedYear, noticedMonth: null, note: text });
    setBusy(false);
    if (res.status === "error") { setErr(res.message); return; }
    setText("");
    setNoticedYear(null);
    draft.clear();
    setKept(false);
    setAdding(false);
    await load();
  }

  function remove(n: IncidentNote) {
    setHidden((h) => [...h, n.id]);
    offer({
      message: `Removed: ${short(n.note)}`,
      commit: async () => { await deleteIncidentNote(supabase, n.id); await load(); setHidden((h) => h.filter((x) => x !== n.id)); },
      undo: () => setHidden((h) => h.filter((x) => x !== n.id)),
    });
  }

  if (notes === null) return null;
  const shownNotes = notes.filter((n) => !hidden.includes(n.id));

  return (
    <div className="mt-4 border-t border-line pt-4">
      <h3 className="text-[0.9375rem] font-semibold text-ink">What you&apos;ve noticed since</h3>
      <p className="mt-0.5 text-sm leading-relaxed text-muted">
        Dated, in your own words. This is what a claims examiner looks at to judge whether symptoms have been
        consistent since the event. Add to it any time.
      </p>
      {shownNotes.length > 0 && (
        <ul className="mt-3 space-y-2">
          {shownNotes.map((n) => (
            <li key={n.id} className="rounded-xl border border-line bg-surface p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <span className="min-w-0 flex-1 pt-2.5 text-sm font-semibold text-muted">
                  {n.noticed_year ? `Noticed around ${n.noticed_year}` : "No date given"}
                </span>
                <RemoveControl label="Remove this note" onRemove={() => remove(n)} />
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
        <div className="mt-3 space-y-3 rounded-xl border border-brand/30 bg-brand/5 p-4">
          <KeptNotice show={kept} />
          <div>
            <div className="field-label">About when did you notice this?</div>
            <div className="w-28">
              <NoteYearPicker year={noticedYear} minYear={incidentYear ?? 1940} onChange={setNoticedYear} />
            </div>
          </div>
          <div>
            <label htmlFor={`note-${incidentId}`} className="field-label">What you&apos;ve noticed</label>
            <textarea
              id={`note-${incidentId}`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder="In your own words. No AI help, nobody else's wording."
              className="field"
            />
          </div>
          {err && <p role="alert" className="text-[0.9375rem] text-scarlet">{err}</p>}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={save} disabled={busy || !text.trim()} className="btn btn-primary btn-lg">
              {busy ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => setAdding(false)} className="btn btn-secondary btn-lg">Close for now</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="btn btn-secondary mt-3 w-full sm:w-auto">
          {text ? "Finish what you were writing" : <>Add what you&apos;ve noticed</>}
        </button>
      )}
    </div>
  );
}

// WHO ELSE WAS THERE — private capture, never auto-sent. Gated off entirely
// for MST/assault-classified incidents (isMarkersBased): "who else was
// there?" on an assault entry risks reading as "name your assailant," the
// exact MST-adjacent risk the injuries council flagged when it deferred
// this feature. For every other incident type, this is a plain, useful
// place to jot a name down before it's forgotten — the actual ask-for-a-
// statement flow stays a separate, deliberate step through Battle buddies.
function WitnessesSection({ incidentId, incidentClass }: { incidentId: string; incidentClass: IncidentClass }) {
  const { supabase } = useAuth();
  const [witnesses, setWitnesses] = useState<IncidentWitness[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [hidden, setHidden] = useState<string[]>([]);
  const { offer } = useUndo();

  // The witness form keeps a copy on this device (by incident) until Save.
  const draft = useDraft<{ name: string; relationship: string; contact: string }>(`incident-witness-${incidentId}`);
  const restored = useRef(false);
  const [kept, setKept] = useState(false);
  useEffect(() => {
    if (restored.current || !draft.ready) return;
    restored.current = true;
    const d = draft.read();
    if (d && (d.name || d.relationship || d.contact)) {
      queueMicrotask(() => { setName(d.name); setRelationship(d.relationship); setContact(d.contact); setAdding(true); setKept(true); });
    }
  }, [draft]);
  useEffect(() => {
    if (!restored.current) return;
    if (name || relationship || contact) draft.write({ name, relationship, contact });
    else draft.clear();
  }, [name, relationship, contact, draft]);

  const load = useCallback(async () => {
    const res = await listIncidentWitnesses(supabase, incidentId);
    setWitnesses("witnesses" in res ? res.witnesses : []);
  }, [supabase, incidentId]);

  useEffect(() => { void (async () => { await load(); })(); }, [load]);

  async function save() {
    setErr("");
    setBusy(true);
    const res = await createIncidentWitness(supabase, { incidentId, name, relationship, contact });
    setBusy(false);
    if (res.status === "error") { setErr(res.message); return; }
    setName(""); setRelationship(""); setContact("");
    draft.clear();
    setKept(false);
    setAdding(false);
    await load();
  }

  function remove(w: IncidentWitness) {
    setHidden((h) => [...h, w.id]);
    offer({
      message: `Removed: ${short(w.name)}.`,
      commit: async () => { await deleteIncidentWitness(supabase, w.id); await load(); setHidden((h) => h.filter((x) => x !== w.id)); },
      undo: () => setHidden((h) => h.filter((x) => x !== w.id)),
    });
  }

  if (isMarkersBased(incidentClass)) return null;
  if (witnesses === null) return null;
  const shownWitnesses = witnesses.filter((w) => !hidden.includes(w.id));

  return (
    <div className="mt-4 border-t border-line pt-4">
      <h3 className="text-[0.9375rem] font-semibold text-ink">Who else was there? (optional)</h3>
      <p className="mt-0.5 text-sm leading-relaxed text-muted">
        Private. This stays on your record and isn&apos;t sent to anyone. To ask someone for a statement, go to{" "}
        <Link href="/buddies" className="font-semibold text-brand underline">Battle buddies</Link> and choose
        Ask them directly.
      </p>
      {shownWitnesses.length > 0 && (
        <ul className="mt-3 space-y-2">
          {shownWitnesses.map((w) => (
            <li key={w.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface p-3">
              <span className="min-w-0 flex-1 text-[0.9375rem] text-ink">
                {w.name}
                {w.relationship && <span className="text-muted">, {w.relationship}</span>}
                {w.contact && <span className="text-muted">, {w.contact}</span>}
              </span>
              <RemoveControl label={`Remove ${w.name}`} onRemove={() => remove(w)} />
            </li>
          ))}
        </ul>
      )}
      {adding ? (
        <div className="mt-3 space-y-3 rounded-xl border border-brand/30 bg-brand/5 p-4">
          <KeptNotice show={kept} />
          <div>
            <label htmlFor={`w-name-${incidentId}`} className="field-label">Their name</label>
            <input id={`w-name-${incidentId}`} value={name} onChange={(e) => setName(e.target.value)} className="field" autoComplete="off" />
          </div>
          <div>
            <label htmlFor={`w-rel-${incidentId}`} className="field-label">How you know them (optional)</label>
            <input id={`w-rel-${incidentId}`} value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="e.g. squad leader" className="field" autoComplete="off" />
          </div>
          <div>
            <label htmlFor={`w-contact-${incidentId}`} className="field-label">Phone or email, if you have it (optional)</label>
            <input id={`w-contact-${incidentId}`} value={contact} onChange={(e) => setContact(e.target.value)} className="field" autoComplete="off" />
          </div>
          {err && <p role="alert" className="text-[0.9375rem] text-scarlet">{err}</p>}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={save} disabled={busy || !name.trim()} className="btn btn-primary btn-lg">
              {busy ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => setAdding(false)} className="btn btn-secondary btn-lg">Close for now</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="btn btn-secondary mt-3 w-full sm:w-auto">
          Add someone who was there
        </button>
      )}
    </div>
  );
}

export default function InjuriesListCard() {
  const { user, supabase } = useAuth();
  const [ready, setReady] = useState(false);
  const [notSetUp, setNotSetUp] = useState(false);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);
  const { offer } = useUndo();

  const load = useCallback(async () => {
    const res = await listMemberIncidents(supabase);
    if ("error" in res) { setNotSetUp(true); return; }
    setIncidents(res.incidents);
  }, [supabase]);

  useEffect(() => {
    if (!user) return;
    (async () => { await load(); setReady(true); })();
  }, [user, load]);

  function remove(r: IncidentRecord, label: string) {
    setHidden((h) => [...h, r.id]);
    if (openId === r.id) setOpenId(null);
    offer({
      message: `Removed: ${short(label)}.`,
      commit: async () => { await deleteIncident(supabase, r.id, r.checkInId); await load(); setHidden((h) => h.filter((x) => x !== r.id)); },
      undo: () => setHidden((h) => h.filter((x) => x !== r.id)),
    });
  }
  const shown = incidents.filter((r) => !hidden.includes(r.id));

  if (!ready) return null;

  if (notSetUp) {
    return (
      <div className="card p-5">
        <h2 className="text-lg font-semibold tracking-tight text-ink">Your entries</h2>
        <p className="mt-2 text-[0.9375rem] text-muted">This feature is on its way. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h2 className="text-lg font-semibold tracking-tight text-ink">Your entries</h2>
      <Link href="/injuries/add" className="btn btn-primary btn-lg mt-4 w-full sm:w-auto">Log one</Link>
      {!shown.length ? (
        <p className="mt-4 text-[0.9375rem] text-muted">Nothing logged yet. Start with whatever you remember. Your own account is real evidence.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {shown.map((r) => {
            const open = openId === r.id;
            const note = evidentiaryNoteFor(r.incidentClass);
            const label = INCIDENT_LABEL[r.incidentClass] ?? r.incidentClass;
            return (
              <li key={r.id} className="overflow-hidden rounded-xl border border-line">
                <div className="flex flex-wrap items-center justify-between gap-2 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="text-[0.9375rem] font-semibold text-ink">{label}</div>
                    <div className="mt-0.5 text-sm text-muted">
                      {dateLabel(r)}
                      {r.placeName ? `, ${r.placeName}` : ""}
                      {r.provenance && <>, {PROVENANCE_LABEL[r.provenance]}</>}
                    </div>
                  </div>
                  <div className="flex flex-none flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : r.id)}
                      aria-expanded={open}
                      className="btn btn-secondary"
                    >
                      {open ? "Hide" : "Open"}
                    </button>
                    <RemoveControl label={`Remove ${label}`} onRemove={() => remove(r, label)} />
                  </div>
                </div>
                {open && (
                  <div className="border-t border-line bg-canvas p-4">
                    {r.detail && <p className="text-[0.9375rem] italic leading-relaxed text-ink/85">&ldquo;{r.detail}&rdquo;</p>}
                    <p className="mt-1 text-sm leading-relaxed text-muted">{note.headline}</p>
                    <NotesSection incidentId={r.id} incidentYear={yr(r.dateStart)} />
                    <WitnessesSection incidentId={r.id} incidentClass={r.incidentClass} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
