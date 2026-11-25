"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import MonthYearWheel from "./MonthYearWheel";
import ShotAddToRecord from "./ShotAddToRecord";
import { SHOTS, SHOT_BY_SLUG, GROUP_LABEL, type Shot, type ShotGroup } from "@/lib/shotlibrary";
import { createServiceEvent, INFORMED_CONSENT_OPTIONS, type Provenance, type InformedConsent, type DatePrecision, type ServiceEventKind } from "@/lib/serviceEvents";

const GROUPS: ShotGroup[] = ["basic", "posted", "yearly", "other"];
const PROVENANCE_OPTIONS: { value: Provenance; label: string }[] = [
  { value: "recalled", label: "I remember it" },
  { value: "in_record", label: "It's in my record" },
  { value: "document_held", label: "I have the document" },
];

type Picked = { label: string; refSlug: string | null; kind: ServiceEventKind };

const pickedFor = (s: Shot): Picked => ({ label: s.name, refSlug: s.slug, kind: s.group === "other" ? "medication" : "vaccination" });

// `initialSlug` comes from /shots/add?shot=<slug>, the "add it with the date"
// link on a shot's library page, so the veteran lands on that shot's form
// instead of searching for it again.
export default function ShotCaptureFlow({ initialSlug }: { initialSlug?: string } = {}) {
  const [query, setQuery] = useState("");
  const [openGroup, setOpenGroup] = useState<ShotGroup | null>(null);
  const [picked, setPicked] = useState<Picked | null>(() => {
    const s = initialSlug ? SHOT_BY_SLUG[initialSlug] : undefined;
    return s ? pickedFor(s) : null;
  });
  const [freeText, setFreeText] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return SHOTS.filter((s) => s.name.toLowerCase().includes(q) || s.hook.toLowerCase().includes(q));
  }, [query]);

  function pickShot(s: Shot) {
    setPicked(pickedFor(s));
  }
  function pickFreeText() {
    const label = freeText.trim();
    if (!label) return;
    setPicked({ label, refSlug: null, kind: "other" });
  }

  if (picked) return <CaptureSheet picked={picked} onCancel={() => setPicked(null)} />;

  // Tap a shot and the three "how do you know" answers open right under it:
  // one more tap saves it, without leaving the list. The full form with the
  // date is one link away inside that same panel.
  const renderRow = (s: Shot) => {
    const open = expanded === s.slug;
    return (
      <div key={s.slug}>
        <button
          type="button"
          onClick={() => setExpanded(open ? null : s.slug)}
          aria-expanded={open}
          className="row w-full text-left"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[0.9375rem] font-semibold leading-snug">{s.name}</span>
            <span className="mt-0.5 block text-sm leading-snug text-muted">{s.hook}</span>
          </span>
          <span className={`flex-none text-[0.9375rem] font-semibold ${open ? "text-muted" : "text-brand"}`}>{open ? "Close" : "Add"}</span>
        </button>
        {open && (
          <div className="border-t border-line bg-canvas px-4 pb-4 pt-3">
            <ShotAddToRecord
              inline
              slug={s.slug}
              name={s.name}
              kind={pickedFor(s).kind}
              onAddWithDate={() => pickShot(s)}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-[0.8125rem] font-medium text-muted">Search by name or how it was given</label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. anthrax, the yellow card, two pills"
          className="field"
        />
      </div>

      <div className="rounded-xl border border-dashed border-line p-4">
        <label className="mb-1 block text-[0.8125rem] font-medium text-muted">Don&apos;t see it, or don&apos;t know the name?</label>
        <div className="flex gap-2">
          <input
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="Type it in your own words"
            className="field flex-1"
          />
          <button onClick={pickFreeText} disabled={!freeText.trim()} className="btn btn-primary flex-none">
            Add it
          </button>
        </div>
      </div>

      {filtered ? (
        <div className="card">
          {filtered.length === 0 ? (
            <p className="p-4 text-sm text-muted">Nothing matches. Type it in your own words above instead.</p>
          ) : (
            <div className="divide-y divide-line overflow-hidden rounded-2xl">{filtered.map(renderRow)}</div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {GROUPS.map((g) => {
            const items = SHOTS.filter((s) => s.group === g).sort((a, b) => a.name.localeCompare(b.name));
            const open = openGroup === g;
            return (
              <div key={g} className="card">
                <button
                  onClick={() => setOpenGroup(open ? null : g)}
                  aria-expanded={open}
                  className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left text-[0.9375rem] font-semibold text-ink"
                >
                  {GROUP_LABEL[g]}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 flex-none text-muted transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {open && <div className="divide-y divide-line overflow-hidden rounded-b-2xl border-t border-line">{items.map(renderRow)}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CaptureSheet({ picked, onCancel }: { picked: Picked; onCancel: () => void }) {
  const { supabase } = useAuth();
  const [year, setYear] = useState(new Date().getUTCFullYear());
  const [month, setMonth] = useState(0); // 0 = not sure, 1-12
  const [day, setDay] = useState(0); // 0 = not set
  const [unsure, setUnsure] = useState(false);
  const [provenance, setProvenance] = useState<Provenance | null>(null);
  const [informedConsent, setInformedConsent] = useState<InformedConsent | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);

  const canSave = provenance !== null && informedConsent !== null;

  async function save() {
    if (!canSave || !provenance || !informedConsent) return;
    setBusy(true);
    setErr("");
    const datePrecision: DatePrecision = unsure ? "unsure" : day ? "day" : month ? "month" : "year";
    const res = await createServiceEvent(supabase, {
      kind: picked.kind,
      refSlug: picked.refSlug,
      label: picked.label,
      eventYear: unsure ? null : year,
      eventMonth: unsure || !month ? null : month,
      eventDay: unsure || !day ? null : day,
      datePrecision,
      provenance,
      informedConsent,
      note,
    });
    setBusy(false);
    if (res.status === "error") { setErr(res.message === "not-set-up" ? "This feature isn't switched on yet. Nothing was saved." : res.message); return; }
    setSaved(true);
  }

  if (saved) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-canvas p-5">
        <div className="card w-full max-w-sm p-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-success" aria-hidden="true">
              <path d="m5 13 4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold tracking-tight text-ink">Saved.</h3>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{picked.label} is on your shot record now.</p>
          <Link href="/shots" className="btn btn-primary btn-lg mt-5 w-full">
            See your shot record
          </Link>
          <button type="button" onClick={onCancel} className="btn btn-secondary btn-lg mt-2.5 w-full">
            Add another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-canvas">
      <div className="mx-auto w-full max-w-lg flex-1 p-5">
        <button type="button" onClick={onCancel} className="btn btn-ghost -ml-2 mb-3">Back</button>
        <h2 className="text-xl font-semibold tracking-tight text-ink">{picked.label}</h2>

        <fieldset className="mt-6">
          <legend className="field-label">When?</legend>
          {unsure ? (
            <div className="rounded-xl border border-line bg-white px-3 py-3 text-center text-[0.9375rem] text-muted">Not sure</div>
          ) : (
            <MonthYearWheel month={month} year={year} day={day} onMonthChange={setMonth} onYearChange={setYear} onDayChange={setDay} minYear={1940} />
          )}
          <label className="mt-2 flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-line bg-white px-4 text-[0.9375rem] text-ink">
            <input
              type="checkbox"
              className="h-6 w-6 flex-none accent-brand"
              checked={unsure}
              onChange={(e) => { setUnsure(e.target.checked); if (e.target.checked) { setMonth(0); setDay(0); } }}
            />
            I&apos;m not sure of the year
          </label>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="field-label">How do you know?</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {PROVENANCE_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                aria-pressed={provenance === o.value}
                onClick={() => setProvenance(o.value)}
                className={`btn min-h-12 ${provenance === o.value ? "btn-primary" : "btn-secondary"}`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Remembered isn&apos;t worse than documented. It&apos;s just different, and whoever reads this later needs to know which is which.
          </p>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="field-label">Were you told what it was, beforehand?</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {INFORMED_CONSENT_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                aria-pressed={informedConsent === o.value}
                onClick={() => setInformedConsent(o.value)}
                className={`btn min-h-12 ${informedConsent === o.value ? "btn-primary" : "btn-secondary"}`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            This is about what you were told, not what was actually in it. The label for that is on this shot&apos;s library page. Most of the military is mandatory either way; what varies is whether anyone explained it.
          </p>
        </fieldset>

        <div className="mt-6">
          <label htmlFor="shot-note" className="field-label">Anything you want to note about that time</label>
          <textarea
            id="shot-note"
            value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={500}
            className="field"
          />
        </div>

        {err && <p role="alert" className="mt-3 text-[0.9375rem] text-scarlet">{err}</p>}

        <button
          type="button"
          onClick={save}
          disabled={!canSave || busy}
          className="btn btn-primary btn-lg mt-6 w-full"
        >
          {busy ? "Saving…" : "Save"}
        </button>
        {!canSave && (
          <p className="mt-2 text-center text-sm text-muted">Answer the two questions above to save.</p>
        )}
      </div>
    </div>
  );
}
