"use client";

import { useMemo } from "react";
import WheelPicker from "./WheelPicker";

const MONTH_LABELS = [
  "Not sure", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Two wheels side by side — month (0 = not sure, 1–12) and year. Built for
 * veterans who moved between several ports or bases in a single year: a
 * slider that only picks a year can't tell March apart from November, so two
 * stops in the same year collapse into one indistinguishable date. Spin to
 * the month, spin to the year — same motion either way.
 */
export default function MonthYearWheel({
  month,
  year,
  onMonthChange,
  onYearChange,
  minYear = 1945,
  maxYear = new Date().getUTCFullYear(),
}: {
  month: number; // 0 = not sure, 1-12
  year: number;
  onMonthChange: (m: number) => void;
  onYearChange: (y: number) => void;
  minYear?: number;
  maxYear?: number;
}) {
  const years = useMemo(() => {
    const out: number[] = [];
    for (let y = minYear; y <= maxYear; y++) out.push(y);
    return out;
  }, [minYear, maxYear]);

  const monthIndex = Math.max(0, Math.min(12, month));
  const yearIndex = Math.max(0, Math.min(years.length - 1, year - minYear));

  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <div className="mb-1 text-center text-[11px] font-medium text-muted">Month</div>
        <WheelPicker
          options={MONTH_LABELS}
          index={monthIndex}
          onChange={(i) => onMonthChange(i)}
          ariaLabel="Month"
        />
      </div>
      <div className="flex-[1.2]">
        <div className="mb-1 text-center text-[11px] font-medium text-muted">Year</div>
        <WheelPicker
          options={years.map(String)}
          index={yearIndex}
          onChange={(i) => onYearChange(years[i])}
          ariaLabel="Year"
        />
      </div>
    </div>
  );
}
