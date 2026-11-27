"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import { KeptNotice, useDraft, useUndo } from "./Keep";
import { listVessels, createVessel, deleteVessel, vesselWhen, vesselTitle, type Vessel } from "@/lib/vessels";

type VesselDraft = { name: string; hull: string; fromYear: string; fromMonth: string; toYear: string; toMonth: string; role: string; note: string };

const MONTH_OPTS = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Years, newest first, for the "aboard from / until" pickers. A long list, so
// it stays a <select>; nothing is pre-chosen and nothing is guessed.
const THIS_YEAR = new Date().getFullYear();
const YEAR_OPTS = Array.from({ length: THIS_YEAR - 1940 + 1 }, (_, i) => String(THIS_YEAR - i));

function num(s: string): number | null {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

export default function VesselsListCard() {
  const { user, supabase } = useAuth();
  const [ready, setReady] = useState(false);
  const [notSetUp, setNotSetUp] = useState(false);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);
  const { offer } = useUndo();

  const [name, setName] = useState("");
  const [hull, setHull] = useState("");
  const [fromYear, setFromYear] = useState("");
  const [fromMonth, setFromMonth] = useState("");
  const [toYear, setToYear] = useState("");
  const [toMonth, setToMonth] = useState("");
  const [role, setRole] = useState("");
  const [note, setNote] = useState("");

  // The add form keeps a copy on this device until the ship is saved, so a
  // refresh or Cancel never throws typed words away.
  const draft = useDraft<VesselDraft>("vessel-add");
  const restored = useRef(false);
  const [kept, setKept] = useState(false);
  useEffect(() => {
    if (restored.current || !draft.ready) return;
    restored.current = true;
    const d = draft.read();
    if (d && Object.values(d).some((x) => x)) {
      // Applied from the device copy (an outside store), just after this effect.
      queueMicrotask(() => {
        setName(d.name); setHull(d.hull); setFromYear(d.fromYear); setFromMonth(d.fromMonth);
        setToYear(d.toYear); setToMonth(d.toMonth); setRole(d.role); setNote(d.note);
        setOpen(true); setKept(true);
      });
    }
  }, [draft]);
  useEffect(() => {
    if (!restored.current) return;
    const d: VesselDraft = { name, hull, fromYear, fromMonth, toYear, toMonth, role, note };
    if (Object.values(d).some((x) => x)) draft.write(d);
    else draft.clear();
  }, [name, hull, fromYear, fromMonth, toYear, toMonth, role, note, draft]);

  const load = useCallback(async () => {
    const res = await listVessels(supabase);
    if ("error" in res) { setNotSetUp(true); return; }
    setVessels(res.vessels);
  }, [supabase]);

  useEffect(() => {
    if (!user) return;
    (async () => { await load(); setReady(true); })();
  }, [user, load]);

  function reset() {
    setName(""); setHull(""); setFromYear(""); setFromMonth("");
    setToYear(""); setToMonth(""); setRole(""); setNote(""); setErr(null);
  }

  async function save() {
    setBusy(true);
    setErr(null);
    const res = await createVessel(supabase, {
      name,
      hull,
      fromYear: num(fromYear),
      fromMonth: MONTH_OPTS.indexOf(fromMonth) > 0 ? MONTH_OPTS.indexOf(fromMonth) : null,
      toYear: num(toYear),
      toMonth: MONTH_OPTS.indexOf(toMonth) > 0 ? MONTH_OPTS.indexOf(toMonth) : null,
      role,
      note,
    });
    setBusy(false);
    if (res.status === "error") { setErr(res.message); return; }
    reset();
    draft.clear();
    setKept(false);
    setOpen(false);
    await load();
  }

  // Remove is held behind the Undo bar and carried out when the bar closes.
  function remove(v: Vessel) {
    setHidden((h) => [...h, v.id]);
    offer({
      message: `Removed: ${vesselTitle(v)}.`,
      commit: async () => { await deleteVessel(supabase, v.id); await load(); setHidden((h) => h.filter((x) => x !== v.id)); },
      undo: () => setHidden((h) => h.filter((x) => x !== v.id)),
    });
  }
  const shown = vessels.filter((v) => !hidden.includes(v.id));

  if (!ready) return null;

  if (notSetUp) {
    return (
      <div className="card p-5">
        <h2 className="text-lg font-semibold tracking-tight text-ink">Ships you served aboard</h2>
        <p className="mt-2 text-[0.9375rem] text-muted">This feature is on its way. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h2 className="text-lg font-semibold tracking-tight text-ink">Ships you served aboard</h2>

      {!open && (
        <button
          type="button"
          onClick={() => { setOpen(true); setErr(null); }}
          className="btn btn-primary btn-lg mt-4 w-full sm:w-auto"
        >
          Add a ship
        </button>
      )}

      {open && (
        <div className="mt-4 space-y-5 rounded-xl border border-line bg-canvas p-4">
          <KeptNotice show={kept} />
          <div>
            <label htmlFor="vessel-name" className="field-label">Ship&apos;s name</label>
            {/* The only required field, on purpose. A man who remembers the ship
                and nothing else still has something worth handing a VSO. */}
            <input id="vessel-name" className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. USS Kitty Hawk" autoComplete="off" />
            <p className="mt-1.5 text-sm text-muted">The name is all you need to save it.</p>
          </div>
          <div>
            <label htmlFor="vessel-hull" className="field-label">Hull number (if you know it)</label>
            <input id="vessel-hull" className="field" value={hull} onChange={(e) => setHull(e.target.value)} placeholder="e.g. CV-63" autoComplete="off" />
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Leave it blank if you don&apos;t know it. We will not guess one for you. A made-up hull number does
              more harm in front of a rater than an empty one.
            </p>
          </div>

          <fieldset>
            <legend className="field-label">Aboard from</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <select aria-label="Month aboard from" className="field" value={fromMonth} onChange={(e) => setFromMonth(e.target.value)}>
                {MONTH_OPTS.map((m) => <option key={m || "none"} value={m}>{m || "Month (optional)"}</option>)}
              </select>
              <select aria-label="Year aboard from" className="field tnum" value={fromYear} onChange={(e) => setFromYear(e.target.value)}>
                <option value="">Year (optional)</option>
                {YEAR_OPTS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </fieldset>
          <fieldset>
            <legend className="field-label">Until</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <select aria-label="Month aboard until" className="field" value={toMonth} onChange={(e) => setToMonth(e.target.value)}>
                {MONTH_OPTS.map((m) => <option key={m || "none"} value={m}>{m || "Month (optional)"}</option>)}
              </select>
              <select aria-label="Year aboard until" className="field tnum" value={toYear} onChange={(e) => setToYear(e.target.value)}>
                <option value="">Year (optional)</option>
                {YEAR_OPTS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Rough is fine. A year on its own is a good answer.
            </p>
          </fieldset>

          <div>
            <label htmlFor="vessel-role" className="field-label">What you did aboard (optional)</label>
            <input id="vessel-role" className="field" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. BT2, fireroom, or Deck division" />
          </div>
          <div>
            <label htmlFor="vessel-note" className="field-label">In your own words (optional)</label>
            <textarea
              id="vessel-note"
              className="field min-h-[6rem]"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Where she operated, what you remember: the gunline, the yards, a port, a fire."
            />
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Nothing you write here is touched by AI. Where the ship operated, and when, is often the part a VSO
              works from.
            </p>
          </div>

          {err && <p role="alert" className="text-[0.9375rem] font-medium text-scarlet">{err}</p>}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={save}
              disabled={busy || !name.trim()}
              className="btn btn-primary btn-lg"
            >
              {busy ? "Saving…" : name.trim() ? "Save this ship" : "Add the ship's name"}
            </button>
            {/* Closing keeps what was typed; it is here when the form opens again. */}
            <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary btn-lg">
              Close for now
            </button>
          </div>
        </div>
      )}

      {!shown.length ? (
        <p className="mt-4 text-[0.9375rem] text-muted">
          Nothing added yet. Start with the one you were on longest. The name alone is enough to begin.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {shown.map((v) => {
            const when = vesselWhen(v);
            return (
              <li key={v.id} className="rounded-xl border border-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[0.9375rem] font-semibold text-ink">{vesselTitle(v)}</div>
                    <div className="mt-0.5 text-sm text-muted">
                      {[when || "dates not noted yet", v.role].filter(Boolean).join(", ")}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(v)}
                    aria-label={`Remove ${vesselTitle(v)}`}
                    className="btn btn-ghost flex-none text-muted"
                  >
                    Remove
                  </button>
                </div>
                {v.note && <p className="mt-2 whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-ink">{v.note}</p>}
              </li>
            );
          })}
        </ul>
      )}

      {shown.length > 0 && (
        <p className="mt-4 border-t border-line pt-3 text-sm leading-relaxed text-muted">
          These print in your claim packet, under your service details. Ask your VSO to request the deck logs for
          the dates above. That is the document that shows where the ship actually was.
        </p>
      )}
    </div>
  );
}
