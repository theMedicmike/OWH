"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import MonthYearWheel from "./MonthYearWheel";
import WheelPicker from "./WheelPicker";
import { INCIDENTS, type IncidentClass } from "@/lib/education";
import { evidentiaryNoteFor } from "@/lib/incidentCopy";
import { createIncidentEntry, PROVENANCE_OPTIONS, type Provenance } from "@/lib/incidents";

const YEARS = Array.from({ length: new Date().getUTCFullYear() - 1940 + 1 }, (_, i) => String(1940 + i));

// Calmer register on this one page, per the trauma-informed UX research the
// council cited (Callisto pattern): a visible consent line before anything
// is asked, progressive disclosure (repeated-mode fields only appear once
// chosen), and a save-and-exit affordance that's always on screen — not
// buried at the bottom of a long form.
export default function InjuryCaptureFlow() {
  const { supabase } = useAuth();
  const router = useRouter();

  const [incidentClass, setIncidentClass] = useState<IncidentClass | null>(null);
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
    setSaved(true);
  }

  if (saved) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-line bg-surface p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-success">
            <path d="m5 13 4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-ink">Saved.</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          It&apos;s on your record now, and connected to any matching conditions on Your conditions.
        </p>
        <Link href="/injuries" className="mt-5 block w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand-600">
          See your entries →
        </Link>
        <button onClick={() => router.push("/injuries/add")} className="mt-2.5 w-full rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink hover:bg-canvas">
          Log another
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      {/* Consent line, stated before anything is asked — trauma-informed UX,
          not boilerplate. */}
      <div className="rounded-xl border border-line bg-canvas p-4 text-xs leading-relaxed text-muted">
        Nothing here is submitted automatically — it stays in your own record until you choose to bring it to a
        VSO. Nothing you type is saved until you tap Save, so if you need to step away, it&apos;s safe to close
        this and come back whenever you&apos;re ready. Nothing you write is touched by AI.
      </div>

      <div>
        <div className="text-sm font-semibold text-ink">What happened?</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {INCIDENTS.map((x) => (
            <button
              key={x.value}
              type="button"
              aria-pressed={incidentClass === x.value}
              onClick={() => setIncidentClass(x.value)}
              className={`rounded-full border px-2.5 py-1 text-xs ${incidentClass === x.value ? "border-brand bg-brand/10 font-medium text-brand" : "border-line text-muted hover:bg-canvas"}`}
            >
              {x.label}
            </button>
          ))}
        </div>
      </div>

      {isMst && (
        <div className="rounded-lg border border-brand/30 bg-brand/5 px-3 py-2.5 text-xs leading-relaxed text-ink">
          This is logged like any other event — nothing more. Every VA medical center has an MST coordinator, and
          care for MST-related conditions is free regardless of your disability rating or discharge status.{" "}
          <a href="tel:988" className="font-semibold text-brand hover:underline">988, then press 1</a> is there
          any hour, for you or anyone you served with.
        </div>
      )}

      {incidentClass && (
        <>
          <label className="flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" checked={repeated} onChange={(e) => setRepeated(e.target.checked)} />
            This happened repeatedly, not on one day — not a single event, but a pattern over time
          </label>

          {repeated ? (
            <div className="space-y-3 rounded-lg border border-line bg-canvas p-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Your role or unit at the time</label>
                <input
                  value={roleOrUnit}
                  onChange={(e) => setRoleOrUnit(e.target.value)}
                  placeholder="e.g. breacher, 2nd squad — or just your job"
                  className="w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-sm text-ink placeholder:text-faint focus:border-brand focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">From</label>
                  <WheelPicker options={YEARS} index={YEARS.indexOf(String(rangeStart))} onChange={(i) => setRangeStart(parseInt(YEARS[i], 10))} ariaLabel="Start year" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">To</label>
                  <WheelPicker options={YEARS} index={YEARS.indexOf(String(rangeEnd))} onChange={(i) => setRangeEnd(parseInt(YEARS[i], 10))} ariaLabel="End year" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Roughly how often, in your own words</label>
                <input
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  placeholder="e.g. near-daily, a handful of times a month"
                  className="w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-sm text-ink placeholder:text-faint focus:border-brand focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 rounded-lg border border-line bg-canvas p-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Where (optional)</label>
                <input
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  placeholder="A base, a city, or leave it blank"
                  className="w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-sm text-ink placeholder:text-faint focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">When</label>
                <MonthYearWheel month={month} year={year} day={day} onMonthChange={setMonth} onYearChange={setYear} onDayChange={setDay} approximate={approximate} onApproximateChange={setApproximate} minYear={1940} />
              </div>
            </div>
          )}

          <div>
            <div className="text-sm font-semibold text-ink">How do you know?</div>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {PROVENANCE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={provenance === o.value}
                  onClick={() => setProvenance(o.value)}
                  className={`rounded-lg border px-3 py-2.5 text-left text-[13px] ${provenance === o.value ? "border-brand bg-brand/10 font-semibold text-brand" : "border-line bg-white text-ink hover:bg-canvas"}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {note && (
              <div className="mt-2 rounded-lg border border-line bg-canvas px-3 py-2.5 text-xs leading-relaxed text-ink">
                <div className="font-semibold text-brand">{note.headline}</div>
                <p className="mt-1 text-muted">{note.body}</p>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">In your own words (optional)</label>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={4}
              placeholder="Whatever you remember. Nothing classified."
              className="w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-sm text-ink placeholder:text-faint focus:border-brand focus:outline-none"
            />
            <p className="mt-1 text-[11px] leading-relaxed text-faint">
              VA now screens statements for AI-generated and copy-paste language — your own specific memory is
              stronger evidence than polished wording. This app never writes it for you.
            </p>
          </div>

          {err && <p className="text-xs text-scarlet">{err}</p>}

          <div className="flex gap-2">
            <button onClick={save} disabled={busy || !canSave} className="flex-1 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand-600 disabled:opacity-50">
              {busy ? "Saving…" : "Save"}
            </button>
            <Link href="/injuries" className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-muted hover:bg-canvas">
              Not now
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
