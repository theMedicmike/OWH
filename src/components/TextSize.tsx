"use client";

import { useEffect, useState } from "react";

// Accessibility: a veteran-controlled text-size setting. Scaling the root font
// size scales every rem-based size in the app at once. Persisted in localStorage
// so it sticks across visits — important for older and TBI-affected veterans.

const KEY = "owh-text-size";
const SIZES: Record<string, string> = { sm: "100%", lg: "112.5%", xl: "125%" };

export function applyTextSize(size: string) {
  if (typeof document !== "undefined") {
    document.documentElement.style.fontSize = SIZES[size] ?? "100%";
  }
}

// Mounted once in the root layout so the saved size is applied on every page.
export function TextSizeApplier() {
  useEffect(() => {
    try {
      applyTextSize(localStorage.getItem(KEY) || "sm");
    } catch {
      /* localStorage unavailable */
    }
  }, []);
  return null;
}

// The A / A+ / A++ control (shown in the account menu).
export function TextSizeControl() {
  const [size, setSize] = useState("sm");
  useEffect(() => {
    try {
      setSize(localStorage.getItem(KEY) || "sm");
    } catch {
      /* ignore */
    }
  }, []);

  function choose(s: string) {
    setSize(s);
    try {
      localStorage.setItem(KEY, s);
    } catch {
      /* ignore */
    }
    applyTextSize(s);
  }

  const opts = ["sm", "lg", "xl"];
  return (
    <div className="border-b border-line px-4 py-3">
      <div className="text-xs text-faint">Text size</div>
      <div className="mt-1.5 flex gap-1.5">
        {opts.map((s, i) => (
          <button
            key={s}
            onClick={() => choose(s)}
            aria-label={`Text size ${i + 1} of 3`}
            className={`flex flex-1 items-center justify-center rounded-lg border py-1.5 font-bold transition ${
              size === s ? "border-brand bg-brand/10 text-brand" : "border-line text-muted hover:bg-canvas"
            }`}
            style={{ fontSize: `${0.85 + i * 0.2}rem` }}
          >
            A
          </button>
        ))}
      </div>
    </div>
  );
}
