"use client";

import { useEffect, useRef, useState } from "react";
import {
  drawCard, canvasToBlob, ensureFonts, buildCaption, shareCard, canShareFiles,
  downloadBlob, copyImage, copyText, tweetHref, facebookHref, smsHref,
  CARD_DIMS, type CardStyle, type CardSize,
} from "@/lib/challengeCoin";

type Props = {
  passage: string;
  chapterNumber: number;
  chapterTitle: string;
  heavy: boolean;
  memoriamOnly: boolean;
  onClose: () => void;
};

const STYLE_OPTS: { v: CardStyle; label: string }[] = [
  { v: "standard", label: "Standard" },
  { v: "night", label: "Night" },
  { v: "memoriam", label: "Memoriam" },
];
const SIZE_OPTS: { v: CardSize; label: string }[] = [
  { v: "post", label: "Post 4:5" },
  { v: "story", label: "Story 9:16" },
];

export default function CardStudio({ passage, chapterNumber, chapterTitle, heavy, memoriamOnly, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blobRef = useRef<Blob | null>(null);
  const [style, setStyle] = useState<CardStyle>(memoriamOnly ? "memoriam" : "standard");
  const [size, setSize] = useState<CardSize>("post");
  const [caption, setCaption] = useState(() => buildCaption(passage, heavy));
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => { setShowFallback(!canShareFiles()); }, []);

  // Render the preview + export blob whenever the look changes. Rendering the
  // blob here (on open / change, not on the Share tap) keeps navigator.share
  // inside the user gesture on iOS.
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    blobRef.current = null; // invalidate the previous look's blob immediately
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dims = CARD_DIMS[size];
    canvas.width = dims.w;
    canvas.height = dims.h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    (async () => {
      await ensureFonts();
      if (cancelled) return;
      drawCard(ctx, { passage, chapterNumber, chapterTitle, style, size, heavy, memoriamOnly });
      try {
        const blob = await canvasToBlob(canvas);
        if (cancelled) return;
        blobRef.current = blob;
        setReady(true);
      } catch { blobRef.current = null; }
    })();
    return () => { cancelled = true; };
  }, [passage, chapterNumber, chapterTitle, style, size, heavy, memoriamOnly]);

  async function onShare() {
    if (!blobRef.current) return;
    setBusy(true);
    const res = await shareCard(blobRef.current, caption);
    setBusy(false);
    if (res === "shared") setStatus("Shared. Thank you for spreading the word.");
    else setShowFallback(true);
  }

  const chip = (on: boolean) =>
    `rounded-full border px-3 py-1 text-xs font-medium transition ${on ? "border-brand bg-brand/10 text-brand" : "border-line text-muted hover:bg-canvas"}`;
  const fbtn = "flex items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink transition hover:border-brand/40 hover:bg-canvas";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-line bg-surface p-5 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-bold text-ink">Make a card</div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-canvas" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="h-5 w-5"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Live preview */}
        <div className="flex justify-center rounded-xl bg-canvas p-3">
          <canvas ref={canvasRef} className="h-auto w-auto max-h-[42vh] rounded-md shadow-lg ring-1 ring-black/20" />
        </div>

        {/* Look controls */}
        {!memoriamOnly && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {STYLE_OPTS.map((s) => (
              <button key={s.v} onClick={() => setStyle(s.v)} className={chip(style === s.v)}>{s.label}</button>
            ))}
          </div>
        )}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SIZE_OPTS.map((s) => (
            <button key={s.v} onClick={() => setSize(s.v)} className={chip(size === s.v)}>{s.label}</button>
          ))}
        </div>

        {/* Caption */}
        <label className="mt-3 block text-xs font-medium text-muted">Caption</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-line bg-canvas px-3 py-2 text-xs leading-relaxed text-ink focus:border-brand focus:bg-white focus:outline-none"
        />

        <p className="mt-2 text-[11px] text-faint">Share what moved you. This is your call.</p>

        {/* Primary + fallbacks */}
        {status ? (
          <div className="mt-3 rounded-lg border border-success/30 bg-success-soft px-3 py-2 text-xs font-medium text-success">{status}</div>
        ) : (
          <>
            <button
              onClick={onShare}
              disabled={busy || !ready}
              className="mt-3 w-full rounded-xl bg-brand px-6 py-3 text-sm font-bold text-brand-foreground transition hover:bg-brand-600 disabled:opacity-60"
            >
              {busy ? "Opening…" : !ready ? "Preparing…" : "Share…"}
            </button>

            {showFallback && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className={fbtn} onClick={() => blobRef.current && downloadBlob(blobRef.current)}>Save image</button>
                <button className={fbtn} onClick={async () => setStatus((await copyText(caption)) ? "Caption copied." : "Couldn't copy.")}>Copy caption</button>
                <button className={fbtn} onClick={async () => { if (blobRef.current) setStatus((await copyImage(blobRef.current)) ? "Image copied." : "Save the image instead."); }}>Copy image</button>
                <a className={fbtn} href={smsHref(caption)}>Text it</a>
                <a className={fbtn} href={tweetHref(caption)} target="_blank" rel="noreferrer">Post on X</a>
                <a className={fbtn} href={facebookHref()} target="_blank" rel="noreferrer">Facebook</a>
                <p className="col-span-2 text-[11px] leading-relaxed text-faint">Instagram has no web share — save the image, then post it there.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
