"use client";

import { EXPOSURE_LABEL } from "@/lib/education";

// ─────────────────────────────────────────────────────────────────────────────
// THE SERVICE TIMELINE — the mission rendered as a screen.
//
// The book: "a veteran is not a collection of disconnected symptoms. A veteran
// is a timeline." The bill (SEC. 309): a LONGITUDINAL service and exposure
// record. Everywhere else the app is spatial (the map) or relational (connect
// the dots); this is the one view that shows TIME — where you were, what was
// there, when your health changed, and the gap in between.
//
// Deliberately dependency-free and print-safe: it renders as page one of the
// claim packet, so it must survive a black-and-white printer.
// ─────────────────────────────────────────────────────────────────────────────

export type TimelineTour = {
  place: string;
  startYear: number;
  endYear: number | null;
  exposures: string[];
};

export type TimelineCondition = {
  label: string;
  onsetYear: number | null;
  linkedExposures: string[]; // classes the veteran logged that are linked to it
};

export type TimelineData = {
  serviceStart: number | null;
  serviceEnd: number | null;
  tours: TimelineTour[];
  conditions: TimelineCondition[];
};

// Latency: years between the earliest logged exposure that is linked to a
// condition and that condition's onset. Stated as a fact, never as causation.
export function latencyFor(cond: TimelineCondition, tours: TimelineTour[]): { years: number; place: string; year: number } | null {
  if (!cond.onsetYear || cond.linkedExposures.length === 0) return null;
  let best: { place: string; year: number } | null = null;
  for (const t of tours) {
    if (!t.exposures.some((e) => cond.linkedExposures.includes(e))) continue;
    if (!best || t.startYear < best.year) best = { place: t.place, year: t.startYear };
  }
  if (!best || cond.onsetYear < best.year) return null;
  return { years: cond.onsetYear - best.year, place: best.place, year: best.year };
}

export function timelineBounds(d: TimelineData): { min: number; max: number } {
  const years: number[] = [];
  if (d.serviceStart) years.push(d.serviceStart);
  if (d.serviceEnd) years.push(d.serviceEnd);
  for (const t of d.tours) { years.push(t.startYear); if (t.endYear) years.push(t.endYear); }
  for (const c of d.conditions) if (c.onsetYear) years.push(c.onsetYear);
  const now = new Date().getUTCFullYear();
  if (years.length === 0) return { min: now - 20, max: now };
  const min = Math.min(...years);
  const max = Math.max(...years, now);
  return { min: min - 1, max: max + 1 };
}

export default function ServiceTimeline({ data, compact = false }: { data: TimelineData; compact?: boolean }) {
  const { min, max } = timelineBounds(data);
  const span = Math.max(1, max - min);
  const pct = (y: number) => ((y - min) / span) * 100;

  const tours = [...data.tours].sort((a, b) => a.startYear - b.startYear);
  const conds = [...data.conditions].sort((a, b) => (a.onsetYear ?? 9999) - (b.onsetYear ?? 9999));
  const dated = conds.filter((c) => c.onsetYear);
  const undated = conds.filter((c) => !c.onsetYear);

  // Decade ticks across the whole span.
  const ticks: number[] = [];
  for (let y = Math.ceil(min / 5) * 5; y <= max; y += 5) ticks.push(y);

  if (tours.length === 0 && conds.length === 0) {
    return (
      <p className="text-sm text-muted">
        Your timeline builds itself as you add where you served and what you live with.
      </p>
    );
  }

  return (
    <div className="w-full">
      {/* Year axis */}
      <div className="relative mb-1 h-4">
        {ticks.map((t) => (
          <span key={t} className="absolute -translate-x-1/2 text-[10px] tabular-nums text-faint" style={{ left: `${pct(t)}%` }}>
            {t}
          </span>
        ))}
      </div>
      <div className="relative h-px w-full bg-line">
        {ticks.map((t) => (
          <span key={t} className="absolute top-0 h-1.5 w-px bg-line" style={{ left: `${pct(t)}%` }} />
        ))}
      </div>

      {/* Service band */}
      {(data.serviceStart || data.serviceEnd) && (
        <div className="relative mt-2 h-5">
          <div
            className="absolute top-1 h-3 rounded-full bg-brand/15 ring-1 ring-brand/30"
            style={{
              left: `${pct(data.serviceStart ?? min)}%`,
              width: `${Math.max(1.5, pct(data.serviceEnd ?? max) - pct(data.serviceStart ?? min))}%`,
            }}
          />
          <span className="absolute left-0 top-0 text-[10px] font-semibold uppercase tracking-wide text-brand">
            In service
          </span>
        </div>
      )}

      {/* Tours — where you were, and what was documented there */}
      <div className="mt-2 space-y-1.5">
        {tours.map((t, i) => {
          const left = pct(t.startYear);
          const right = pct(t.endYear ?? t.startYear);
          const width = Math.max(2, right - left);
          return (
            <div key={`${t.place}-${i}`} className="relative h-9">
              <div
                className="absolute top-0 flex h-5 items-center rounded-md bg-brand px-1.5 text-[10px] font-semibold text-white shadow-sm print:bg-brand"
                style={{ left: `${left}%`, width: `${width}%`, minWidth: 8 }}
                title={`${t.place} — ${t.startYear}${t.endYear && t.endYear !== t.startYear ? `–${t.endYear}` : ""}`}
              />
              <div
                className="absolute top-[22px] max-w-[70%] truncate text-[11px] leading-tight text-ink"
                style={{ left: `${Math.min(left, 70)}%` }}
              >
                <span className="font-semibold">{t.place}</span>{" "}
                <span className="tabular-nums text-muted">
                  {t.startYear}{t.endYear && t.endYear !== t.startYear ? `–${t.endYear}` : ""}
                </span>
                {t.exposures.length > 0 && !compact && (
                  <span className="text-muted"> · {t.exposures.map((e) => EXPOSURE_LABEL[e] ?? e).join(", ")}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Conditions — when your health changed */}
      {dated.length > 0 && (
        <>
          <div className="mt-4 border-t border-dashed border-line pt-2 text-[10px] font-semibold uppercase tracking-wide text-accent">
            Health changes
          </div>
          <div className="mt-1 space-y-1.5">
            {dated.map((c, i) => {
              const lat = latencyFor(c, tours);
              const left = pct(c.onsetYear!);
              return (
                <div key={`${c.label}-${i}`} className="relative h-9">
                  {/* latency bridge: exposure year → onset year */}
                  {lat && (
                    <div
                      className="absolute top-[9px] h-px border-t border-dashed border-accent/60"
                      style={{ left: `${pct(lat.year)}%`, width: `${Math.max(0, left - pct(lat.year))}%` }}
                    />
                  )}
                  <span
                    className="absolute top-1.5 h-3 w-3 -translate-x-1/2 rotate-45 rounded-[2px] bg-accent ring-2 ring-white print:bg-accent"
                    style={{ left: `${left}%` }}
                    title={`${c.label} — ${c.onsetYear}`}
                  />
                  <div
                    className="absolute top-[22px] max-w-[70%] truncate text-[11px] leading-tight text-ink"
                    style={{ left: `${Math.min(left, 70)}%` }}
                  >
                    <span className="font-semibold">{c.label}</span>{" "}
                    <span className="tabular-nums text-muted">{c.onsetYear}</span>
                    {lat && (
                      <span className="text-accent">
                        {" "}· {lat.years === 0 ? "same year as" : `${lat.years} yr${lat.years === 1 ? "" : "s"} after`} {lat.place}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {undated.length > 0 && (
        <p className="mt-3 border-t border-line pt-2 text-[11px] leading-relaxed text-faint">
          <span className="font-semibold text-muted">No year yet:</span>{" "}
          {undated.map((c) => c.label).join(", ")}. Adding the year each began puts them on this
          timeline — the gap between an exposure and the first symptom is often the most persuasive
          part of a record.
        </p>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-faint">
        A timeline of what you logged — dates and gaps as you reported them. It documents sequence,
        not causation; a clinician and an accredited VSO (Veterans Service Officer — free help) weigh
        what it means.
      </p>
    </div>
  );
}
