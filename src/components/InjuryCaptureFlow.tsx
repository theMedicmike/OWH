"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { KeptNotice, useDraft } from "./Keep";
import MonthYearWheel from "./MonthYearWheel";
import WheelPicker from "./WheelPicker";
import { INCIDENTS, type IncidentClass } from "@/lib/education";
import { evidentiaryNoteFor } from "@/lib/incidentCopy";
import { createIncidentEntry, PROVENANCE_OPTIONS, type Provenance } from "@/lib/incidents";

type InjuryDraft = {
  incidentClass: IncidentClass; repeated: boolean; placeName: string; year: number; month: number; day: number; approximate: boolean;
  roleOrUnit: string; rangeStart: number; rangeEnd: number; frequency: string; provenance: Provenance | null; detail: string;
};

const YEARS = Array.from({ length: new Date().getUTCFullYear() - 1940 + 1 }, (_, i) => String(1940 + i));

// Calmer register on this one page, per the trauma-informed UX research the
// council cited (Callisto pattern): a visible consent line before anything
// is asked, progressive disclosure (repeated-mode fields only appear once
// chosen), and a save-and-exit affordance that's always on screen — not
// buried at the bottom of a long form.
export default function InjuryCaptureFlow({ initialClass }: { initialClass?: string } = {}) {
  const { supabase } = useAuth();

  // Preselected when the veteran arrives from an injury library page's
  // "add the place, month and details" link. Only a known class is accepted.
  const [incidentClass, setIncidentClass] = useState<IncidentClass | null>(() =>
    initialClass && INCIDENTS.some((x) => x.value === initialClass) ? (initialClass as IncidentClass) : null,
  );
  const [repeated, setRepeated] = useState(false);

  // single-incident fields
  const [placeName, setPlaceName] = useState("");
  const [year, setYear] = useState(new Date().getUTCFullYear());
  const [month, setMonth] = useState(0);
  const [day, setDay] = useState(0);
  // Defaulted ON — most of what this page captures has no attached document
  // yet, and "circa" is the honest default for a memory, not a hedge.
  const [approximate, setApproximate] = useState(true);

  // repeated-mode fields
  const [roleOrUnit, setRoleOrUnit] = useState("");
  const [rangeStart, setRangeStart] = useState(new Date().getUTCFullYear());
  const [rangeEnd, setRangeEnd] = useState(new Date().getUTCFullYear());
  const [frequency, setFrequency] = useState("");

  const [provenance, setProvenance] = useState<Provenance | null>(null);
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);

  // The form keeps a copy on this device (never sent anywhere) until Save
  // lands, so stepping away or a refresh never loses what was typed.
  const draft = useDraft<InjuryDraft>("injury-add");
  const restored = useRef(false);
  const [kept, setKept] = useState(false);
  useEffect(() => {
    if (restored.current || !draft.ready) return;
    restored.current = true;
    const d = draft.read();
    if (!d || !d.incidentClass) return;
    if (initialClass && d.incidentClass !== initialClass) return; // he came for a different one
    // Applied from the device copy (an outside store), just after this effect.
    queueMicrotask(() => {
      setIncidentClass(d.incidentClass); setRepeated(!!d.repeated); setPlaceName(d.placeName ?? "");
      if (d.year) setYear(d.year);
      setMonth(d.month ?? 0); setDay(d.day ?? 0); setApproximate(d.approximate ?? true);
      setRoleOrUnit(d.roleOrUnit ?? "");
      if (d.rangeStart) setRangeStart(d.rangeStart);
      if (d.rangeEnd) setRangeEnd(d.rangeEnd);
      setFrequency(d.frequency ?? ""); setProvenance(d.provenance ?? null); setDetail(d.detail ?? "");
      setKept(true);
    });
  }, [draft, initialClass]);
  useEffect(() => {
    if (!restored.current || saved) return;
    const typed = placeName || roleOrUnit || frequency || detail || provenance || month || day || repeated;
    if (incidentClass && typed) {
      draft.write({ incidentClass, repeated, placeName, year, month, day, approximate, roleOrUnit, rangeStart, rangeEnd, frequency, provenance, detail });
    } else draft.clear();
  }, [incidentClass, repeated, placeName, year, month, day, approximate, roleOrUnit, rangeStart, rangeEnd, frequency, provenance, detail, saved, draft]);

  const note = incidentClass ? evidentiaryNoteFor(incidentClass) : null;
  const isMst = incidentClass === "military_sexual_trauma";

  const canSave =
    !!incidentClass &&
    !!provenance &&
    (repeated ? roleOrUnit.trim().length > 0 : true);

  async function save() {
    if (!incidentClass || !provenance || !canSave) return;
    setBusy(true);
    setErr("");
    const res = repeated
      ? await createIncidentEntry(supabase, {
          repeated: true,
          incidentClass,
          roleOrUnit: roleOrUnit.trim(),
          rangeStartYear: Math.min(rangeStart, rangeEnd),
          rangeEndYear: Math.max(rangeStart, rangeEnd),
          frequency: frequency.trim(),
          provenance,
          detail,
        })
      : await createIncidentEntry(supabase, {
          repeated: false,
          incidentClass,
          placeName: placeName.trim() || "Unnamed location",
          year,
          month,
          day,
          approximate,
          provenance,
          detail,
        });
    setBusy(false);
    if (res.status === "error") { setErr(res.message); return; }
    draft.clear();
    setKept(false);
    setSaved(true);
  }

  // "Log another" was pushing to the same /injuries/add URL we're already
  // on — Next.js doesn't remount a client component just because you
  // navigate to the route it's already rendering, so the button did
  // nothing. Reset the form's own state instead.
  function resetForm() {
    setIncidentClass(null);
    setRepeated(false);
    setPlaceName("");
    setYear(new Date().getUTCFullYear());
    setMonth(0);
    setDay(0);
    setApproximate(true);
    setRoleOrUnit("");
    setRangeStart(new Date().getUTCFullYear());
    setRangeEnd(new Date().getUTCFullYear());
    setFrequency("");
    setProvenance(null);
    setDetail("");
    setErr("");
    setSaved(false);
  }

  if (saved) {
    return (
      <div className="card mx-auto max-w-lg p-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-success" aria-hidden="true">
            <path d="m5 13 4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold tracking-tight text-ink">Saved.</h3>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
          It&apos;s on your record now, and connected to any matching conditions on Your conditions.
        </p>
        <Link href="/injuries" className="btn btn-primary btn-lg mt-5 w-full">
          See your entries
        </Link>
        <button type="button" onClick={resetForm} className="btn btn-secondary btn-lg mt-2.5 w-full">
          Log another
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Consent line, stated before anything is asked — trauma-informed UX,
          not boilerplate. */}
      <div className="rounded-xl border border-line bg-canvas p-4 text-[0.9375rem] leading-relaxed text-muted">
        Nothing here is submitted automatically. It stays in your own record until you choose to bring it to a
        VSO. Until you tap Save, what you type is kept only on this device, so if you need to step away, it&apos;s
        safe to close this and come back whenever you&apos;re ready. Nothing you write is touched by AI.
      </div>
      <KeptNotice show={kept} />

      <fieldset>
        <legend className="text-lg font-semibold tracking-tight text-ink">What happened?</legend>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {INCIDENTS.map((x) => (
            <button
              key={x.value}
              type="button"
              aria-pressed={incidentClass === x.value}
              onClick={() => setIncidentClass(x.value)}
              className={`btn min-h-12 ${incidentClass === x.value ? "btn-primary" : "btn-secondary"}`}
            >
              {x.label}
            </button>
          ))}
        </div>
      </fieldset>

      {isMst && (
        <div className="rounded-xl border border-brand/30 bg-brand/5 p-4 text-[0.9375rem] leading-relaxed text-ink">
          This is logged like any other event, nothing more. Every VA medical center has an MST coordinator, and
          care for MST-related conditions is free regardless of your disability rating or discharge status.{" "}
          <a href="tel:988" className="font-semibold text-brand underline">988, then press 1</a> is there
          any hour, for you or anyone you served with.
        </div>
      )}

      {incidentClass && (
        <>
          <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-[0.9375rem] text-ink">
            <input type="checkbox" className="h-6 w-6 flex-none accent-brand" checked={repeated} onChange={(e) => setRepeated(e.target.checked)} />
            This happened repeatedly, not on one day. A pattern over time, not a single event.
          </label>

          {repeated ? (
            <div className="space-y-4 rounded-xl border border-line bg-canvas p-4">
              <div>
                <label htmlFor="injury-role" className="field-label">Your role or unit at the time</label>
                <input
                  id="injury-role"
                  value={roleOrUnit}
                  onChange={(e) => setRoleOrUnit(e.target.value)}
                  placeholder="e.g. breacher, 2nd squad, or just your job"
                  className="field"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="field-label">From</div>
                  <WheelPicker options={YEARS} index={YEARS.indexOf(String(rangeStart))} onChange={(i) => setRangeStart(parseInt(YEARS[i], 10))} ariaLabel="Start year" />
                </div>
                <div>
                  <div className="field-label">To</div>
                  <WheelPicker options={YEARS} index={YEARS.indexOf(String(rangeEnd))} onChange={(i) => setRangeEnd(parseInt(YEARS[i], 10))} ariaLabel="End year" />
                </div>
              </div>
              <div>
                <label htmlFor="injury-frequency" className="field-label">Roughly how often, in your own words</label>
                <input
                  id="injury-frequency"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  placeholder="e.g. near-daily, a handful of times a month"
                  className="field"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 rounded-xl border border-line bg-canvas p-4">
              <div>
                <label htmlFor="injury-place" className="field-label">Where (optional)</label>
                <input
                  id="injury-place"
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  placeholder="A base, a city, or leave it blank"
                  className="field"
                />
              </div>
              <div>
                <div className="field-label">When</div>
                <MonthYearWheel month={month} year={year} day={day} onMonthChange={setMonth} onYearChange={setYear} onDayChange={setDay} approximate={approximate} onApproximateChange={setApproximate} minYear={1940} />
              </div>
            </div>
          )}

          <fieldset>
            <legend className="text-lg font-semibold tracking-tight text-ink">How do you know?</legend>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
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
            {note && (
              <div className="mt-3 rounded-xl border border-line bg-canvas p-4 text-[0.9375rem] leading-relaxed text-ink">
                <div className="font-semibold text-ink">{note.headline}</div>
                <p className="mt-1 text-muted">{note.body}</p>
              </div>
            )}
          </fieldset>

          <div>
            <label htmlFor="injury-detail" className="field-label">In your own words (optional)</label>
            <textarea
              id="injury-detail"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={4}
              placeholder="Whatever you remember. Nothing classified."
              className="field"
            />
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Your own specific memory, details only you would know, is stronger evidence than polished
              wording. This app never writes it for you.
            </p>
          </div>

          {err && <p role="alert" className="text-[0.9375rem] text-scarlet">{err}</p>}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={save} disabled={busy || !canSave} className="btn btn-primary btn-lg flex-1">
              {busy ? "Saving…" : "Save"}
            </button>
            <Link href="/injuries" className="btn btn-secondary btn-lg">
              Not now
            </Link>
          </div>
          {!canSave && (
            <p className="text-sm text-muted">
              {!provenance ? "Choose how you know to save." : "Add your role or unit to save."}
            </p>
          )}
        </>
      )}
    </div>
  );
}
