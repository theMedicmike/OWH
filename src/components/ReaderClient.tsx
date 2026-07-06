"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BookChapter } from "@/content/book";
import { chapterToChunks } from "@/lib/bookChunks";
import { onMaleVoice, speakChunks, stopSpeaking, ttsSupported } from "@/lib/voice";
import MikeAvatar from "./MikeAvatar";
import CardStudio from "./CardStudio";
import Link from "next/link";

type Props = {
  chapter: BookChapter;
  prevSlug?: string;
  nextSlug?: string;
  heavy: boolean;
  memoriamOnly: boolean;
  canShare: boolean;
};

const PACES = [
  { label: "Slow", rate: 0.85 },
  { label: "Steady", rate: 1.0 },
  { label: "Brisk", rate: 1.15 },
];

function trimPassage(raw: string): string {
  const t = raw.replace(/\s+/g, " ").trim();
  if (t.length <= 280) return t;
  const cut = t.slice(0, 280);
  const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  return (stop > 120 ? cut.slice(0, stop + 1) : cut.trim()) + "…";
}

export default function ReaderClient({ chapter, prevSlug, nextSlug, heavy, memoriamOnly, canShare }: Props) {
  const chunks = useMemo(() => chapterToChunks(chapter.paragraphs), [chapter.paragraphs]);
  // Gate on mount so SSR and first client render agree (avoids a hydration flash
  // of the wrong Listen-bar state).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const supported = mounted && ttsSupported();

  const [activeIdx, setActiveIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1.0);
  const [ready, setReady] = useState(false);
  const [finished, setFinished] = useState(false);
  const [studioPassage, setStudioPassage] = useState<string | null>(null);
  const [selChip, setSelChip] = useState<{ text: string; x: number; y: number } | null>(null);

  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const rateRef = useRef(1.0);
  const activeRef = useRef(-1);
  const playingRef = useRef(false);
  const userScrolledAt = useRef(0);
  const paraEls = useRef<(HTMLElement | null)[]>([]);
  const articleRef = useRef<HTMLDivElement>(null);

  // Resolve Mike's voice (async on some browsers); enable Play after 4s no matter what.
  useEffect(() => {
    const cleanup = onMaleVoice((v) => { voiceRef.current = v; if (v) setReady(true); });
    const t = setTimeout(() => setReady(true), 4000);
    return () => { cleanup(); clearTimeout(t); };
  }, []);

  // Stop audio on unmount / route change so Mike and the book never overlap.
  useEffect(() => () => stopSpeaking(), []);

  // Soft-pause when the tab is hidden (so a phone lock doesn't blast audio later).
  useEffect(() => {
    const onVis = () => { if (document.hidden && playingRef.current) softPause(); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track genuine user scroll intent (wheel/touch, not our own scrollIntoView).
  useEffect(() => {
    const mark = () => { userScrolledAt.current = Date.now(); };
    window.addEventListener("wheel", mark, { passive: true });
    window.addEventListener("touchmove", mark, { passive: true });
    return () => { window.removeEventListener("wheel", mark); window.removeEventListener("touchmove", mark); };
  }, []);

  // Follow-along: center the active line unless the reader just scrolled.
  useEffect(() => {
    if (activeIdx < 0) return;
    if (Date.now() - userScrolledAt.current < 1200) return;
    paraEls.current[activeIdx]?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeIdx]);

  // Highlight-to-share chip (desktop delight; the per-paragraph button is the mobile guarantee).
  useEffect(() => {
    if (!canShare) return;
    const onSel = () => {
      const sel = window.getSelection();
      const art = articleRef.current;
      if (!sel || sel.isCollapsed || !art) { setSelChip(null); return; }
      const anchor = sel.anchorNode;
      if (anchor && !art.contains(anchor)) { setSelChip(null); return; }
      const text = sel.toString().trim();
      if (text.length < 20) { setSelChip(null); return; }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      setSelChip({ text, x: rect.left + rect.width / 2, y: rect.top });
    };
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, [canShare]);

  // The chip is viewport-positioned and selectionchange doesn't fire on scroll —
  // so dismiss it on scroll/resize rather than let it float over unrelated text.
  useEffect(() => {
    if (!selChip) return;
    const clear = () => setSelChip(null);
    window.addEventListener("scroll", clear, { passive: true });
    window.addEventListener("resize", clear);
    return () => { window.removeEventListener("scroll", clear); window.removeEventListener("resize", clear); };
  }, [selChip]);

  function play(fromIdx: number) {
    const idx = Math.max(0, Math.min(fromIdx, chunks.length - 1));
    activeRef.current = idx;
    playingRef.current = true;
    setActiveIdx(idx);
    setPlaying(true);
    setFinished(false);
    speakChunks(chunks, idx, {
      voice: voiceRef.current,
      rate: rateRef.current,
      onIndex: (i) => { activeRef.current = i; setActiveIdx(i); },
      onDone: () => { playingRef.current = false; setPlaying(false); setFinished(true); },
    });
  }
  function softPause() {
    stopSpeaking();
    playingRef.current = false;
    setPlaying(false);
  }
  function stop() {
    stopSpeaking();
    playingRef.current = false;
    activeRef.current = -1;
    setPlaying(false);
    setActiveIdx(-1);
  }
  function togglePlay() {
    if (playing) softPause();
    else play(activeRef.current >= 0 ? activeRef.current : 0);
  }
  function step(delta: number) {
    play((activeRef.current >= 0 ? activeRef.current : 0) + delta);
  }
  function setPace(r: number) {
    rateRef.current = r;
    setRate(r);
    if (playingRef.current) play(activeRef.current); // re-issue at the new rate
  }
  function openStudio(text: string) {
    setStudioPassage(trimPassage(text));
    setSelChip(null);
    window.getSelection()?.removeAllRanges();
  }

  const bar = supported && (
    <div className="sticky top-[57px] z-10 -mx-1 mb-5 rounded-xl border border-line bg-brand px-3 py-2.5 text-white shadow-sm print:hidden">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-2">
          <MikeAvatar size={28} />
          <span className="text-xs font-semibold leading-tight">Listen — read by<br className="hidden sm:block" /> Medic Mike</span>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={togglePlay}
            disabled={!ready}
            aria-label={playing ? "Pause" : "Play"}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {playing ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>
          <button onClick={() => step(-1)} aria-label="Previous line" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path d="M15 18l-6-6 6-6" /></svg></button>
          <button onClick={() => step(1)} aria-label="Next line" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path d="M9 6l6 6-6 6" /></svg></button>
          <button onClick={stop} aria-label="Stop" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"><svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5"><rect x="6" y="6" width="12" height="12" rx="1.5" /></svg></button>
        </div>

        <div className="flex items-center gap-1 rounded-full bg-white/10 p-0.5">
          {PACES.map((p) => (
            <button key={p.label} onClick={() => setPace(p.rate)} className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition ${rate === p.rate ? "bg-white text-brand" : "text-white/70 hover:text-white"}`}>{p.label}</button>
          ))}
        </div>

        <span className="text-[11px] text-white/70">
          {activeIdx >= 0 ? `Passage ${activeIdx + 1} of ${chunks.length}` : `${chunks.length} passages`}
        </span>

        <a href="tel:988" className="flex items-center gap-1 rounded-full bg-scarlet/90 px-2 py-1 text-[11px] font-bold text-white hover:brightness-110" title="Veterans Crisis Line">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3"><path d="M12 21s-6.7-4.35-9.33-8.07C1.1 10.7 1.64 7.6 4 6.1a5 5 0 0 1 8 1.4 5 5 0 0 1 8-1.4c2.36 1.5 2.9 4.6 1.33 6.83C18.7 16.65 12 21 12 21z" /></svg>
          988
        </a>
      </div>
      <div className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-white/15">
        <span className="block h-0.5 rounded-full bg-accent transition-all" style={{ width: `${chunks.length ? ((activeIdx + 1) / chunks.length) * 100 : 0}%` }} />
      </div>
      {!ready && <div className="mt-1 text-[10px] text-white/60">Warming up Mike&apos;s voice…</div>}
    </div>
  );

  return (
    <>
      {bar}
      {!supported && (
        <p className="mb-5 rounded-lg border border-line bg-canvas px-3 py-2 text-xs text-muted print:hidden">
          Read-aloud works in Chrome, Edge, or Safari.
        </p>
      )}

      <div ref={articleRef} className="space-y-4">
        {chapter.paragraphs.map((p, i) => {
          const active = i === activeIdx;
          const dim = playing && activeIdx >= 0 && !active;
          const wrap = `group relative scroll-mt-28 transition ${active ? "rounded-r-md border-l-[3px] border-accent bg-accent/5 pl-3" : ""} ${dim ? "opacity-40" : ""}`;
          const controls = (
            <span className="absolute right-0 top-0 z-[1] flex gap-1 opacity-60 transition sm:opacity-0 sm:group-hover:opacity-100 group-focus-within:opacity-100">
              {supported && (
                <button onClick={() => play(i)} title="Play from here" aria-label="Play from here"
                  className="flex h-8 w-8 items-center justify-center rounded-md bg-white/80 text-brand shadow-sm ring-1 ring-line hover:bg-white">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5"><path d="M8 5v14l11-7z" /></svg>
                </button>
              )}
              {canShare && p.type === "p" && (
                <button onClick={() => openStudio(p.text)} title="Make a card" aria-label="Share this passage"
                  className="flex h-8 w-8 items-center justify-center rounded-md bg-white/80 text-accent shadow-sm ring-1 ring-line hover:bg-white">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5"><path d="M6 17h3l2-4V6H5v7h3l-2 4zm8 0h3l2-4V6h-6v7h3l-2 4z" /></svg>
                </button>
              )}
            </span>
          );
          return p.type === "h" ? (
            <h2 key={i} ref={(el) => { paraEls.current[i] = el; }} className={`pt-3 pr-16 text-lg font-bold text-ink ${wrap}`}>{controls}{p.text}</h2>
          ) : (
            <p key={i} ref={(el) => { paraEls.current[i] = el; }} className={`pr-16 text-[15px] leading-7 text-ink/90 ${wrap}`}>{controls}{p.text}</p>
          );
        })}
      </div>

      {finished && nextSlug && (
        <div className="mt-6 rounded-xl border border-accent/30 bg-accent/5 p-4 text-center print:hidden">
          <div className="text-sm font-semibold text-ink">Chapter finished.</div>
          <Link href={`/book/${nextSlug}`} className="mt-2 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-600">Read the next chapter →</Link>
        </div>
      )}

      {/* Highlight-to-share floating chip */}
      {selChip && canShare && (
        <button
          onClick={() => openStudio(selChip.text)}
          style={{ position: "fixed", left: selChip.x, top: selChip.y, transform: "translate(-50%, -115%)" }}
          className="z-40 flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-lg print:hidden"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5"><path d="M6 17h3l2-4V6H5v7h3l-2 4zm8 0h3l2-4V6h-6v7h3l-2 4z" /></svg>
          Make a card
        </button>
      )}

      {studioPassage && (
        <CardStudio
          passage={studioPassage}
          chapterNumber={chapter.number}
          chapterTitle={chapter.title}
          heavy={heavy}
          memoriamOnly={memoriamOnly}
          onClose={() => setStudioPassage(null)}
        />
      )}
    </>
  );
}
