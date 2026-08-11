"use client";

// A native picker. This used to be a hand-built "spin to select" scroll-snap
// control — some veterans said it felt unfamiliar and fiddly to grab on a
// phone screen. A plain <select> fixes that by becoming the OS's OWN picker:
// iPhone shows the exact spinning wheel this used to imitate (just the real
// one), Android shows a fast searchable list, desktop shows a native
// dropdown — all of it a control the veteran has already used a thousand
// times, with zero custom touch-gesture code to get wrong.
export default function WheelPicker({
  options,
  index,
  onChange,
  ariaLabel,
  disabled,
}: {
  options: string[];
  /** Currently selected index into `options`. */
  index: number;
  onChange: (index: number) => void;
  ariaLabel: string;
  disabled?: boolean;
}) {
  const clamped = Math.max(0, Math.min(options.length - 1, index));
  return (
    <select
      aria-label={ariaLabel}
      value={String(clamped)}
      disabled={disabled}
      onChange={(e) => onChange(parseInt(e.target.value, 10))}
      className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-center text-sm font-medium tabular-nums text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:opacity-40"
    >
      {options.map((label, i) => (
        <option key={label + i} value={i}>{label}</option>
      ))}
    </select>
  );
}
