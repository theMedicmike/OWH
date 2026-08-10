"use client";

import { useEffect, useRef, useState } from "react";

// A spin-to-select picker — the "slot machine" control Michael asked for
// after Navy veterans said the year SLIDER made it impossible to build an
// accurate chronology. A sailor who hit four or five ports in one year needs
// to pin the MONTH precisely and quickly, on a phone, without fighting a
// slider that jumps two years per pixel. Scroll, or tap a nearby row — it
// snaps to center and that's the value.
const ROW_H = 40; // px
const VISIBLE_ROWS = 5;
const PAD_ROWS = Math.floor(VISIBLE_ROWS / 2);

export default function WheelPicker({
  options,
  index,
  onChange,
  ariaLabel,
}: {
  options: string[];
  /** Currently selected index into `options`. */
  index: number;
  onChange: (index: number) => void;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [programmatic, setProgrammatic] = useState(false);

  // Keep the wheel in sync when `index` changes from outside (e.g. a reset).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = index * ROW_H;
    if (Math.abs(el.scrollTop - target) > 1) {
      setProgrammatic(true);
      el.scrollTop = target;
      // Let the browser settle before re-arming the scroll handler.
      const t = setTimeout(() => setProgrammatic(false), 50);
      return () => clearTimeout(t);
    }
  }, [index]);

  function handleScroll() {
    if (programmatic) return;
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const nearest = Math.round(el.scrollTop / ROW_H);
      const clamped = Math.max(0, Math.min(options.length - 1, nearest));
      // Correct any sub-pixel snap drift, then report the value.
      el.scrollTo({ top: clamped * ROW_H, behavior: "smooth" });
      if (clamped !== index) onChange(clamped);
    }, 120);
  }

  function tapRow(i: number) {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ top: i * ROW_H, behavior: "smooth" });
    onChange(i);
  }

  return (
    <div
      role="listbox"
      aria-label={ariaLabel}
      className="relative overflow-hidden rounded-lg border border-line bg-white"
      style={{ height: ROW_H * VISIBLE_ROWS }}
    >
      {/* Center highlight band — purely visual, sits under the scrollable list. */}
      <div
        className="pointer-events-none absolute inset-x-0 z-10 border-y-2 border-brand/30 bg-brand/5"
        style={{ top: ROW_H * PAD_ROWS, height: ROW_H }}
      />
      <div
        ref={ref}
        onScroll={handleScroll}
        className="h-full overflow-y-auto scroll-smooth"
        style={{ scrollSnapType: "y mandatory" }}
      >
        <div style={{ height: ROW_H * PAD_ROWS }} />
        {options.map((label, i) => (
          <button
            key={label + i}
            type="button"
            role="option"
            aria-selected={i === index}
            onClick={() => tapRow(i)}
            className={`flex w-full items-center justify-center text-sm tabular-nums transition ${
              i === index ? "font-bold text-ink" : "text-muted"
            }`}
            style={{ height: ROW_H, scrollSnapAlign: "center" }}
          >
            {label}
          </button>
        ))}
        <div style={{ height: ROW_H * PAD_ROWS }} />
      </div>
    </div>
  );
}
