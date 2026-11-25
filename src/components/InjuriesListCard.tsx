"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
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

// Remove, then a second tap to confirm. Every delete in this card goes through
// this so a shaky tap never loses an entry.
function RemoveControl({ label, armed, onArm, onCancel, onConfirm }: {
  label: string;
  armed: boolean;
  onArm: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (armed) {
    return (
      <div className="flex flex-none flex-wrap gap-2">
        <button type="button" onClick={onCancel} className="btn btn-secondary">Keep it</button>
        <button type="button" onClick={onConfirm} className="btn btn-danger">Remove</button>
      </div>
    );
  }
  return (
    <button type="button" onClick={onArm} aria-label={label} className="btn btn-ghost flex-none text-muted">
      Remove
    </button>
  );
}

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
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await listIncidentNotes(supabase, incidentId);
    setNotes("notes" in res ? res.notes : []);
  }, [supabase, incidentId]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    setErr("");
    setBusy(true);
    const res = await createIncidentNote(supabase, { incidentId, noticedYear, noticedMonth: null, note: text });
    setBusy(false);
    if (res.status === "error") { setErr(res.message); return; }
    setText("");
    setNoticedYear(null);
    setAdding(false);
    await load();
  }

  async function remove(id: string) {
    await deleteIncidentNote(supabase, id);
    setConfirmDel(null);
    await load();
  }

  if (notes === null) return null;

  return (
    <div className="mt-4 border-t border-line pt-4">
      <h3 className="text-[0.9375rem] font-semibold text-ink">What you&apos;ve noticed since</h3>
      <p className="mt-0.5 text-sm leading-relaxed text-muted">
        Dated, in your own words. This is what a claims examiner looks at to judge whether symptoms have been
        consistent since the event. Add to it any time.
      </p>
      {notes.length > 0 && (
        <ul className="mt-3 space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="rounded-xl border border-line bg-surface p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <span className="min-w-0 flex-1 pt-2.5 text-sm font-semibold text-muted">
                  {n.noticed_year ? `Noticed around ${n.noticed_year}` : "No date given"}
                </span>
                <RemoveControl
                  label="Remove this note"
                  armed={confirmDel === n.id}
                  onArm={() => setConfirmDel(n.id)}
                  onCancel={() => setConfirmDel(null)}
                  onConfirm={() => remove(n.id)}
                />
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
            <button type="button" onClick={() => setAdding(false)} className="btn btn-secondary btn-lg">Cancel</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="btn btn-secondary mt-3 w-full sm:w-auto">
          Add what you&apos;ve noticed
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
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await listIncidentWitnesses(supabase, incidentId);
    setWitnesses("witnesses" in res ? res.witnesses : []);
  }, [supabase, incidentId]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    setErr("");
    setBusy(true);
    const res = await createIncidentWitness(supabase, { incidentId, name, relationship, contact });
    setBusy(false);
    if (res.status === "error") { setErr(res.message); return; }
    setName(""); setRelationship(""); setContact("");
    setAdding(false);
    await load();
  }

  async function remove(id: string) {
    await deleteIncidentWitness(supabase, id);
    setConfirmDel(null);
    await load();
  }

  if (isMarkersBased(incidentClass)) return null;
  if (witnesses === null) return null;

  return (
    <div className="mt-4 border-t border-line pt-4">
      <h3 className="text-[0.9375rem] font-semibold text-ink">Who else was there? (optional)</h3>
      <p className="mt-0.5 text-sm leading-relaxed text-muted">
        Private. This stays on your record and isn&apos;t sent to anyone. To ask someone for a statement, go to{" "}
        <Link href="/buddies" className="font-semibold text-brand underline">Battle buddies</Link> and choose
        Ask them directly.
      </p>
      {witnesses.length > 0 && (
        <ul className="mt-3 space-y-2">
          {witnesses.map((w) => (
            <li key={w.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface p-3">
              <span className="min-w-0 flex-1 text-[0.9375rem] text-ink">
                {w.name}
                {w.relationship && <span className="text-muted">, {w.relationship}</span>}
                {w.contact && <span className="text-muted">, {w.contact}</span>}
              </span>
              <RemoveControl
                label={`Remove ${w.name}`}
                armed={confirmDel === w.id}
                onArm={() => setConfirmDel(w.id)}
                onCancel={() => setConfirmDel(null)}
                onConfirm={() => remove(w.id)}
              />
            </li>
          ))}
        </ul>
      )}
      {adding ? (
        <div className="mt-3 space-y-3 rounded-xl border border-brand/30 bg-brand/5 p-4">
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
            <button type="button" onClick={() => setAdding(false)} className="btn btn-secondary btn-lg">Cancel</button>
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
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await listMemberIncidents(supabase);
    if ("error" in res) { setNotSetUp(true); return; }
    setIncidents(res.incidents);
  }, [supabase]);

  useEffect(() => {
    if (!user) return;
    (async () => { await load(); setReady(true); })();
  }, [user, load]);

  async function remove(r: IncidentRecord) {
    await deleteIncident(supabase, r.id, r.checkInId);
    setConfirmDel(null);
    await load();
  }

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
      {!incidents.length ? (
        <p className="mt-4 text-[0.9375rem] text-muted">Nothing logged yet. Start with whatever you remember. Your own account is real evidence.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {incidents.map((r) => {
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
                    <RemoveControl
                      label={`Remove ${label}`}
                      armed={confirmDel === r.id}
                      onArm={() => setConfirmDel(r.id)}
                      onCancel={() => setConfirmDel(null)}
                      onConfirm={() => remove(r)}
                    />
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
