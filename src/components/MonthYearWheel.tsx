"use client";

import { useMemo } from "react";
import WheelPicker from "./WheelPicker";
import { daysInMonth } from "@/lib/serviceDates";

const MONTH_LABELS = [
  "Not sure", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Year, Month, Day — same order as Account's date pickers. Built for
 * veterans who moved between several ports or bases in a single stretch: a
 * few sailors reported hitting five to ten ports in a ten-to-fourteen-day
 * span, where even the month isn't precise enough to tell one stop from the
 * next. Day defaults to "Not set", same as month — nobody who doesn't know
 * it is forced to guess.
 */
export default function MonthYearWheel({
  month,
  year,
  day,
  onMonthChange,
  onYearChange,
  onDayChange,
  minYear = 1945,
  maxYear = new Date().getUTCFullYear(),
  approximate,
  onApproximateChange,
}: {
  month: number; // 0 = not sure, 1-12
  year: number;
  day: number; // 0 = not set, 1-31
  onMonthChange: (m: number) => void;
  onYearChange: (y: number) => void;
  onDayChange: (d: number) => void;
  minYear?: number;
  maxYear?: number;
  /** "I don't remember exactly" — a different, honest answer from "I know
   *  the year but not the month/day." When on, month and day are moot (best
   *  guess is year-level), and the date prints as "circa 1968" downstream. */
  approximate?: boolean;
  onApproximateChange?: (v: boolean) => void;
}) {
  const years = useMemo(() => {
    const out: number[] = [];
    for (let y = minYear; y <= maxYear; y++) out.push(y);
    return out;
  }, [minYear, maxYear]);

  const yearIndex = Math.max(0, Math.min(years.length - 1, year - minYear));
  const monthIndex = Math.max(0, Math.min(12, month));

  // Day options depend on the chosen month — never offer "31" for February.
  // A day that no longer fits (month changed after it was set) is clamped
  // for DISPLAY only here; callers clamp the value itself before saving.
  const maxDay = month >= 1 && month <= 12 ? daysInMonth(String(year), String(month)) : 31;
  const dayOptions = useMemo(
    () => ["Not set", ...Array.from({ length: maxDay }, (_, i) => String(i + 1))],
    [maxDay],
  );
  const dayIndex = Math.max(0, Math.min(maxDay, day));

  return (
    <div>
      <div className="flex gap-1.5">
        <div className="flex-[1.3]">
          <div className="mb-1 text-center text-[11px] font-medium text-muted">Year</div>
          <WheelPicker
            options={years.map(String)}
            index={yearIndex}
            onChange={(i) => onYearChange(years[i])}
            ariaLabel="Year"
          />
        </div>
        <div className="flex-1">
          <div className="mb-1 text-center text-[11px] font-medium text-muted">Month</div>
          <WheelPicker
            options={MONTH_LABELS}
            index={monthIndex}
            onChange={(i) => onMonthChange(i)}
            ariaLabel="Month"
            disabled={approximate}
          />
        </div>
        <div className="flex-1">
          <div className="mb-1 text-center text-[11px] font-medium text-muted">Day</div>
          <WheelPicker
            options={dayOptions}
            index={dayIndex}
            onChange={(i) => onDayChange(i)}
            ariaLabel="Day"
            disabled={approximate || !(month >= 1 && month <= 12)}
          />
        </div>
      </div>
      {onApproximateChange && (
        <label className="mt-1.5 flex items-center gap-2 text-[11px] text-muted">
          <input type="checkbox" checked={!!approximate} onChange={(e) => onApproximateChange(e.target.checked)} />
          I&apos;m not sure of the exact date — this is my best guess
        </label>
      )}
    </div>
  );
}
