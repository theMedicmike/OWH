"use client";

import { useState } from "react";

// Medic Mike's face — shared by the chat and the book's Listen bar so it's
// unmistakably the same guide. Renders the real photo the moment
// /public/medic-mike.png exists; a medic badge until then.
export default function MikeAvatar({ size = 40 }: { size?: number }) {
  const [ok, setOk] = useState(true);
  const s = { width: size, height: size };
  if (ok) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/medic-mike.png" alt="Medic Mike" onError={() => setOk(false)}
        className="flex-none rounded-full object-cover ring-2 ring-accent/40" style={s} />
    );
  }
  return (
    <span className="flex flex-none items-center justify-center rounded-full bg-brand text-white ring-2 ring-accent/40" style={s}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" style={{ width: size * 0.5, height: size * 0.5 }}>
        <path d="M12 8v8M8 12h8" />
      </svg>
    </span>
  );
}
