"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { listVessels, createVessel, deleteVessel, vesselWhen, vesselTitle, type Vessel } from "@/lib/vessels";

const card = "rounded-xl border border-line bg-surface p-5";
const field =
  "w-full rounded-md border border-line bg-canvas px-2.5 py-1.5 text-sm text-ink placeholder:text-faint focus:border-brand focus:bg-white focus:outline-none";

const MONTH_OPTS = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

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
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [hull, setHull] = useState("");
  const [fromYear, setFromYear] = useState("");
  const [fromMonth, setFromMonth] = useState("");
  const [toYear, setToYear] = useState("");
  const [toMonth, setToMonth] = useState("");
  const [role, setRole] = useState("");
  const [note, setNote] = useState("");

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
    setOpen(false);
    await load();
  }

  async function remove(id: string) {
    await deleteVessel(supabase, id);
    setConfirmDel(null);
    await load();
  }

  if (!ready) return null;

  if (notSetUp) {
    return (
      <div className={card}>
        <div className="text-sm font-semibold text-ink">Ships you served aboard</div>
        <p className="mt-2 text-sm text-muted">This feature is on its way — check back soon.</p>
      </div>
    );
  }

  return (
    <div className={card}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-ink">Ships you served aboard</div>
        <button
          type="button"
          onClick={() => { setOpen((v) => !v); setErr(null); }}
          className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground hover:bg-brand-600"
        >
          {open ? "Close" : "＋ Add a ship"}
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-3 rounded-lg border border-line p-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Ship&apos;s name</label>
            {/* The only required field, on purpose. A man who remembers the ship
                and nothing else still has something worth handing a VSO. */}
            <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. USS Kitty Hawk" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Hull number (if you know it)</label>
            <input className={field} value={hull} onChange={(e) => setHull(e.target.value)} placeholder="e.g. CV-63" />
            <p className="mt-1 text-[11px] leading-relaxed text-faint">
              Leave it blank if you don&apos;t. We will not guess one for you — a hull number an app invented is
              worse in front of a rater than one you left empty.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Aboard from</label>
            <div className="flex gap-2">
              <select className={field} value={fromMonth} onChange={(e) => setFromMonth(e.target.value)}>
                {MONTH_OPTS.map((m) => <option key={m || "none"} value={m}>{m || "Month (optional)"}</option>)}
              </select>
              <input className={field} inputMode="numeric" value={fromYear} onChange={(e) => setFromYear(e.target.value)} placeholder="Year" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Until</label>
            <div className="flex gap-2">
              <select className={field} value={toMonth} onChange={(e) => setToMonth(e.target.value)}>
                {MONTH_OPTS.map((m) => <option key={m || "none"} value={m}>{m || "Month (optional)"}</option>)}
              </select>
              <input className={field} inputMode="numeric" value={toYear} onChange={(e) => setToYear(e.target.value)} placeholder="Year" />
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-faint">
              Rough is fine, the same as everywhere else here. A year on its own is a perfectly good answer.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">What you did aboard (optional)</label>
            <input className={field} value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. BT2, fireroom — or Deck division" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">In your own words (optional)</label>
            <textarea
              className={`${field} min-h-[72px]`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Where she operated, what you remember — the gunline, the yards, a port, a fire."
            />
            <p className="mt-1 text-[11px] leading-relaxed text-faint">
              Nothing you write here is touched by AI. Where the ship operated and when is often the part a VSO
              works from.
            </p>
          </div>

          {err && <p className="text-xs font-medium text-red-600">{err}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={busy || !name.trim()}
              className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition disabled:cursor-not-allowed disabled:bg-line disabled:text-faint"
            >
              {busy ? "Saving…" : name.trim() ? "Save this ship" : "Add the ship's name"}
            </button>
            <button type="button" onClick={() => { reset(); setOpen(false); }} className="rounded-md px-3 py-2 text-sm text-muted hover:text-ink">
              Cancel
            </button>
          </div>
        </div>
      )}

      {!vessels.length ? (
        <p className="mt-3 text-sm text-muted">
          Nothing added yet. Start with the one you were on longest — the name alone is enough to begin.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {vessels.map((v) => {
            const when = vesselWhen(v);
            return (
              <li key={v.id} className="rounded-lg border border-line p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink">{vesselTitle(v)}</div>
                    <div className="text-xs text-muted">
                      {[when || "dates not noted yet", v.role].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  {confirmDel === v.id ? (
                    <div className="flex flex-none gap-2">
                      <button onClick={() => setConfirmDel(null)} className="text-xs font-semibold text-brand">Keep it</button>
                      <button onClick={() => remove(v.id)} className="text-xs font-semibold text-red-600">Delete</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDel(v.id)} className="flex-none text-xs text-faint hover:text-red-600">remove</button>
                  )}
                </div>
                {v.note && <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-ink">{v.note}</p>}
              </li>
            );
          })}
        </ul>
      )}

      {vessels.length > 0 && (
        <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-faint">
          These print in your claim packet, under your service details. Ask your VSO to request the deck logs for
          the dates above — that is the document that shows where the ship actually was.
        </p>
      )}
    </div>
  );
}
