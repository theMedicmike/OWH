"use client";

import { useEffect, useRef, useState } from "react";
import type { SheetData, SheetRow } from "@/lib/firstPage";

// The First Page as the app shows it: a typeset Letter sheet. It is a picture
// of the page, drawn at one fixed size (480 by 621) and scaled by SheetFrame;
// the readable, full-size version is the print route. Nothing on the sheet is
// a link or a button, so a scaled-down sheet never hides a tiny tap target.
// The buttons that change the page sit beside it.
//
// An empty part shows its heading and a quiet line saying what goes there.
// It never borrows the example's words.

const LIMITS = { served: 8, changed: 7, chain: 7 };

function Rows({ rows, limit, empty }: { rows: SheetRow[]; limit: number; empty: string }) {
  if (rows.length === 0) return <span className="fp-add">{empty}</span>;
  const shown = rows.slice(0, limit);
  return (
    <div className="fp-rows">
      {shown.map((r, i) => (
        <div key={i}>
          <b>{r.year || " "}</b>
          <span>
            {r.text}
            {r.aside && <i> {r.aside}</i>}
          </span>
        </div>
      ))}
      {rows.length > limit && <span className="fp-more">{rows.length - limit} more on the printed page.</span>}
    </div>
  );
}

export function FirstPageSheet({ sheet }: { sheet: SheetData }) {
  const chain = sheet.chain.slice(0, LIMITS.chain);
  return (
    <article className="fp-sheet" aria-label={sheet.example ? "Example First Page. Not a real veteran." : "Your First Page"}>
      <header className="fp-hd">
        <div>
          <p className="fp-title">The First Page</p>
          <div className="fp-who">{sheet.who || "Your name goes here."}</div>
        </div>
        <div className="fp-meta">
          <b>Bring to every visit</b>
          Updated {sheet.updated}
          {sheet.example && (
            <>
              <br />
              Page 1 of 1
            </>
          )}
        </div>
      </header>

      <div className="fp-cols">
        <div>
          <section className="fp-block">
            <p className="fp-h">What the doctor must know today</p>
            {sheet.ownWords.length === 0 ? (
              <span className="fp-add">Three lines, in your own words.</span>
            ) : (
              sheet.ownWords.map((w, i) => (
                <p key={i} className="fp-say">
                  {w}
                </p>
              ))
            )}
          </section>
          <section className="fp-block">
            <p className="fp-h">Where I served and what I was around</p>
            <Rows rows={sheet.served} limit={LIMITS.served} empty="Where you served goes here, one line a posting." />
          </section>
          <section className="fp-block">
            <p className="fp-h">What changed, and when</p>
            <Rows rows={sheet.changed} limit={LIMITS.changed} empty="What changed in your health, and the year it started." />
          </section>
        </div>
        <section>
          <p className="fp-h">The line between them</p>
          {chain.length === 0 ? (
            <span className="fp-add">The line between them, in your words, in your order.</span>
          ) : (
            <div className="fp-chain">
              {chain.map((c, i) => (
                <div key={i} className="fp-c">
                  <strong>{c.word}</strong>
                  {c.detail && <small>{c.detail}</small>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <footer className="fp-ft">
        <span>From my own records. This is my record, not a diagnosis. Ask me about any line.</span>
        {sheet.example && <span>Example page</span>}
      </footer>
    </article>
  );
}

// Scales the 480 px sheet to the width it is given, up to maxScale, and keeps
// the layout height in step so nothing below it jumps. `clip` shows only the
// top of the page (the sign-in peek on a phone, the Home thumbnail).
export function SheetFrame({
  sheet,
  maxScale = 1.4,
  clip,
  tilt = false,
  className = "",
}: {
  sheet: SheetData;
  maxScale?: number;
  clip?: number;
  tilt?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const k = w ? Math.min(maxScale, w / 480) : 0;
  const h = clip ?? Math.round(621 * k);
  return (
    <div ref={ref} className={`relative ${className}`} style={{ height: w ? h : clip ?? 300 }}>
      {w > 0 && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: Math.max(0, (w - 480 * k) / 2),
            width: 480,
            transform: `scale(${k})`,
            transformOrigin: "0 0",
          }}
        >
          <div className={tilt ? "fp-settle" : undefined}>
            <FirstPageSheet sheet={sheet} />
          </div>
        </div>
      )}
    </div>
  );
}
