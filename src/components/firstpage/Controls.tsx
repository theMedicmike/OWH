"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { NOT_SET_UP, SOURCE_STATUS_LABEL, TIERS, TIER_HELP, TIER_LABEL, type FpSource, type SourceStatus, type Tier } from "@/lib/firstPage";

// Shared controls for the First Page screens.
//
// Voice input uses the browser's own speech recognition (Chrome, Edge, Safari
// on the phone). The words go from the microphone to the field and nowhere
// else in this app; no model touches them. If the browser has no recognizer
// the mic button simply does not appear and the keyboard's own mic still works.

type RecognitionEvent = { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> };
type Recognizer = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};
type RecognizerCtor = new () => Recognizer;

function recognizerCtor(): RecognizerCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognizerCtor; webkitSpeechRecognition?: RecognizerCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noSubscribe = () => () => {};

export function dictationSupported(): boolean {
  return recognizerCtor() !== null;
}

// Live dictation into a callback. `onFinal` gets each finished phrase; `onInterim`
// gets the in-progress guess so the screen can show it. Continuous until stop().
export function useDictation(onFinal: (text: string) => void, onInterim?: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const supported = useSyncExternalStore(noSubscribe, dictationSupported, () => false);
  const recRef = useRef<Recognizer | null>(null);
  const wantRef = useRef(false);
  const finalRef = useRef(onFinal);
  const interimRef = useRef(onInterim);
  useEffect(() => { finalRef.current = onFinal; interimRef.current = onInterim; });

  const stop = useCallback(() => {
    wantRef.current = false;
    try { recRef.current?.stop(); } catch {}
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = recognizerCtor();
    if (!Ctor) return;
    try { recRef.current?.abort(); } catch {}
    const r = new Ctor();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-US";
    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const text = res[0]?.transcript ?? "";
        if (res.isFinal) finalRef.current(text.trim());
        else interim += text;
      }
      interimRef.current?.(interim.trim());
    };
    r.onerror = (e) => { if (e.error === "not-allowed" || e.error === "service-not-allowed") { wantRef.current = false; setListening(false); } };
    // Browsers end a session on their own after silence; restart while the
    // veteran still wants to talk.
    r.onend = () => { if (wantRef.current) { try { r.start(); } catch { setListening(false); } } else setListening(false); };
    recRef.current = r;
    wantRef.current = true;
    try { r.start(); setListening(true); } catch { setListening(false); }
  }, []);

  useEffect(() => () => { wantRef.current = false; try { recRef.current?.abort(); } catch {} }, []);

  return { listening, supported, start, stop };
}

export function MicButton({ onText, small }: { onText: (t: string) => void; small?: boolean }) {
  const { listening, supported, start, stop } = useDictation((t) => onText(t));
  if (!supported) return null;
  return (
    <button
      type="button"
      onClick={() => (listening ? stop() : start())}
      aria-pressed={listening}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 ${small ? "py-1 text-xs" : "py-1.5 text-sm"} font-medium transition ${
        listening ? "border-scarlet bg-scarlet/10 text-scarlet" : "border-line bg-white text-muted hover:border-brand hover:text-brand"
      }`}
      title={listening ? "Stop listening" : "Talk instead of typing"}
    >
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
      </svg>
      {listening ? "Listening, tap to stop" : "Talk"}
    </button>
  );
}

const inputClass = "w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-brand focus:outline-none";

export function TextField({
  label, help, value, onChange, rows = 3, placeholder, voice = true, id,
}: { label: string; help?: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; voice?: boolean; id?: string }) {
  const fid = id ?? label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <div>
      <div className="mb-1 flex items-end justify-between gap-3">
        <label htmlFor={fid} className="block text-sm font-semibold text-ink">{label}</label>
        {voice && <MicButton small onText={(t) => onChange(value ? `${value.replace(/\s+$/, "")} ${t}` : t)} />}
      </div>
      {help && <p className="mb-2 text-xs leading-relaxed text-faint">{help}</p>}
      <textarea id={fid} value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} className={inputClass} />
    </div>
  );
}

export function Input({
  label, help, value, onChange, placeholder, type = "text", id, voice = false,
}: { label: string; help?: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; id?: string; voice?: boolean }) {
  const fid = id ?? label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <div>
      <div className="mb-1 flex items-end justify-between gap-3">
        <label htmlFor={fid} className="block text-sm font-semibold text-ink">{label}</label>
        {voice && <MicButton small onText={(t) => onChange(value ? `${value.replace(/\s+$/, "")} ${t}` : t)} />}
      </div>
      {help && <p className="mb-2 text-xs leading-relaxed text-faint">{help}</p>}
      <input id={fid} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputClass} />
    </div>
  );
}

export function SourceSelect({ sources, value, onChange, label = "Source" }: { sources: FpSource[]; value: string | null; onChange: (id: string | null) => void; label?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-muted">{label}</label>
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} className={inputClass}>
        <option value="">No source yet</option>
        {sources.map((s) => (
          <option key={s.id} value={s.id}>{s.number}. {s.label}{s.source_date ? `, ${s.source_date}` : ""} ({SOURCE_STATUS_LABEL[s.status]})</option>
        ))}
      </select>
      {sources.length === 0 && (
        <p className="mt-1 text-xs text-faint">No sources yet. <Link href="/first-page/sources" className="text-brand hover:underline">Add the documents first.</Link></p>
      )}
    </div>
  );
}

export function TierSelect({ value, onChange, label = "How you know" }: { value: Tier | null; onChange: (t: Tier) => void; label?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-muted">{label}</label>
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value as Tier)} className={inputClass}>
        <option value="">Choose</option>
        {TIERS.map((t) => <option key={t} value={t}>{TIER_LABEL[t]}: {TIER_HELP[t]}</option>)}
      </select>
    </div>
  );
}

export function StatusSelect({ value, onChange }: { value: SourceStatus; onChange: (s: SourceStatus) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-muted">Where the request stands</label>
      <select value={value} onChange={(e) => onChange(e.target.value as SourceStatus)} className={inputClass}>
        {(Object.keys(SOURCE_STATUS_LABEL) as SourceStatus[]).map((s) => <option key={s} value={s}>{SOURCE_STATUS_LABEL[s]}</option>)}
      </select>
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-brand" />
      {label}
    </label>
  );
}

export function Notice({ error, children }: { error?: string; children?: React.ReactNode }) {
  if (error === NOT_SET_UP) {
    return (
      <div className="rounded-xl border border-warn/40 bg-warn-soft p-4 text-sm leading-relaxed text-ink">
        This section isn&apos;t switched on yet. Nothing is wrong with your record; the database update for the First
        Page has not been applied.
      </div>
    );
  }
  if (error) return <div className="rounded-xl border border-scarlet/40 bg-scarlet/5 p-4 text-sm text-scarlet">{error}</div>;
  if (!children) return null;
  return <div className="rounded-xl border border-line bg-canvas p-4 text-xs leading-relaxed text-muted">{children}</div>;
}

export function Stance() {
  return (
    <Notice>
      Nothing here is sent anywhere. This page organizes what your records say; it never says what is wrong with you,
      never advises, and never files anything. Nothing you write is touched by AI. You choose every row, and you sign
      the page.
    </Notice>
  );
}

export function PrimaryButton({ children, onClick, disabled, type = "button" }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit" }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:bg-brand-600 disabled:opacity-50">
      {children}
    </button>
  );
}
export function QuietButton({ children, onClick, danger }: { children: React.ReactNode; onClick?: () => void; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${danger ? "border-line text-faint hover:border-scarlet hover:text-scarlet" : "border-line text-muted hover:bg-canvas"}`}>
      {children}
    </button>
  );
}

export function BackToHub() {
  return <Link href="/first-page" className="text-xs font-medium text-brand hover:underline">Back to your First Page</Link>;
}
