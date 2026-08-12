"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { listMemberIncidents, deleteIncident, PROVENANCE_LABEL, type IncidentRecord } from "@/lib/incidents";
import { listIncidentNotes, createIncidentNote, deleteIncidentNote, type IncidentNote } from "@/lib/incidentNotes";
import { INCIDENT_LABEL } from "@/lib/education";
import { evidentiaryNoteFor } from "@/lib/incidentCopy";
import WheelPicker from "./WheelPicker";

const card = "rounded-xl border border-line bg-surface p-5";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const NOTE_YEARS = Array.from({ length: new Date().getUTCFullYear() - 1940 + 1 }, (_, i) => String(1940 + i));

function yr(d: string | null): number | null {
  return d ? new Date(d).getUTCFullYear() : null;
}

function dateLabel(r: IncidentRecord): string {
  const sy = yr(r.dateStart);
  const ey = yr(r.dateEnd);
  if (r.repeated) return sy && ey && ey !== sy ? `${sy}–${ey} (repeated)` : sy ? `${sy} (repeated)` : "Repeated — no date";
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

function NoteYearPicker({ year, onChange }: { year: number | null; onChange: (y: number | null) => void }) {
  const idx = year ? NOTE_YEARS.indexOf(String(year)) : NOTE_YEARS.length - 1;
  return (
    <WheelPicker
      options={["Not sure", ...NOTE_YEARS]}
      index={year ? idx + 1 : 0}
      onChange={(i) => onChange(i === 0 ? null : parseInt(NOTE_YEARS[i - 1], 10))}
      ariaLabel="Year you noticed this"
    />
  );
}

function NotesSection({ incidentId }: { incidentId: string }) {
  const { supabase } = useAuth();
  const [notes, setNotes] = useState<IncidentNote[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [noticedYear, setNoticedYear] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

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
    await load();
  }

  if (notes === null) return null;

  return (
    <div className="mt-3 border-t border-line pt-3">
      <div className="text-xs font-semibold text-ink">What you&apos;ve noticed since</div>
      <p className="mt-0.5 text-[11px] leading-relaxed text-faint">
        Dated, in your own words — this is what a claims examiner actually looks at to judge whether symptoms
        have been consistent since the event. Add to it any time.
      </p>
      {notes.length > 0 && (
        <ul className="mt-2 space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="rounded-lg border border-line bg-canvas p-2.5">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-semibold text-muted">
                  {n.noticed_year ? `Noticed around ${n.noticed_year}` : "No date given"}
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
          <div className="text-[11px] font-medium text-muted">About when did you notice this?</div>
          <div className="mt-1 w-24">
            <NoteYearPicker year={noticedYear} onChange={setNoticedYear} />
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="What you've noticed since — in your own words, no AI help, nobody else's wording."
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
          + Add what you&apos;ve noticed
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
      <div className={card}>
        <div className="text-sm font-semibold text-ink">Your entries</div>
        <p className="mt-2 text-sm text-muted">This feature is on its way — check back soon.</p>
      </div>
    );
  }

  return (
    <div className={card}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-ink">Your entries</div>
        <Link href="/injuries/add" className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground hover:bg-brand-600">＋ Log one</Link>
      </div>
      {!incidents.length ? (
        <p className="mt-3 text-sm text-muted">Nothing logged yet. Start with whatever you remember — your own account is real evidence.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {incidents.map((r) => {
            const open = openId === r.id;
            const note = evidentiaryNoteFor(r.incidentClass);
            return (
              <li key={r.id} className="overflow-hidden rounded-lg border border-line">
                <div className="flex items-center justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink">{INCIDENT_LABEL[r.incidentClass] ?? r.incidentClass}</div>
                    <div className="text-xs text-muted">
                      {dateLabel(r)}
                      {r.placeName ? ` · ${r.placeName}` : ""}
                      {r.provenance && <span className="text-faint"> · {PROVENANCE_LABEL[r.provenance]}</span>}
                    </div>
                  </div>
                  <div className="flex flex-none items-center gap-2">
                    <button onClick={() => setOpenId(open ? null : r.id)} className="text-xs font-semibold text-brand hover:underline">
                      {open ? "Hide" : "Open"}
                    </button>
                    {confirmDel === r.id ? (
                      <button onClick={() => remove(r)} className="text-xs font-semibold text-scarlet hover:underline">Confirm remove</button>
                    ) : (
                      <button onClick={() => setConfirmDel(r.id)} className="text-xs text-faint hover:text-red-600">Remove</button>
                    )}
                  </div>
                </div>
                {open && (
                  <div className="border-t border-line bg-canvas p-3">
                    {r.detail && <p className="text-[13px] italic leading-relaxed text-ink/85">&ldquo;{r.detail}&rdquo;</p>}
                    <p className="mt-1 text-[11px] leading-relaxed text-faint">{note.headline}</p>
                    <NotesSection incidentId={r.id} />
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
