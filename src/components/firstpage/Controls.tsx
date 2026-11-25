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
      className={`btn btn-secondary ${small ? "btn-sm" : ""} ${listening ? "border-scarlet bg-scarlet/10 text-scarlet" : ""}`}
      title={listening ? "Stop listening" : "Talk instead of typing"}
    >
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
      </svg>
      {listening ? "Listening, tap to stop" : "Talk"}
    </button>
  );
}

const inputClass = "field";

export function TextField({
  label, help, value, onChange, rows = 3, placeholder, voice = true, id,
}: { label: string; help?: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; voice?: boolean; id?: string }) {
  const fid = id ?? label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <div>
      <div className="mb-1 flex items-end justify-between gap-3">
        <label htmlFor={fid} className="field-label mb-0">{label}</label>
        {voice && <MicButton small onText={(t) => onChange(value ? `${value.replace(/\s+$/, "")} ${t}` : t)} />}
      </div>
      {help && <p className="mb-2 text-sm leading-relaxed text-muted">{help}</p>}
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
        <label htmlFor={fid} className="field-label mb-0">{label}</label>
        {voice && <MicButton small onText={(t) => onChange(value ? `${value.replace(/\s+$/, "")} ${t}` : t)} />}
      </div>
      {help && <p className="mb-2 text-sm leading-relaxed text-muted">{help}</p>}
      <input id={fid} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputClass} />
    </div>
  );
}

export function SourceSelect({ sources, value, onChange, label = "Source" }: { sources: FpSource[]; value: string | null; onChange: (id: string | null) => void; label?: string }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} className={inputClass}>
        <option value="">No source yet</option>
        {sources.map((s) => (
          <option key={s.id} value={s.id}>{s.number}. {s.label}{s.source_date ? `, ${s.source_date}` : ""} ({SOURCE_STATUS_LABEL[s.status]})</option>
        ))}
      </select>
      {sources.length === 0 && (
        <p className="mt-1.5 text-sm text-muted">No sources yet. <Link href="/first-page/sources" className="text-brand hover:underline">Add the documents first.</Link></p>
      )}
    </div>
  );
}

export function TierSelect({ value, onChange, label = "How you know" }: { value: Tier | null; onChange: (t: Tier) => void; label?: string }) {
  return (
    <div>
      <label className="field-label">{label}</label>
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
      <label className="field-label">Where the request stands</label>
      <select value={value} onChange={(e) => onChange(e.target.value as SourceStatus)} className={inputClass}>
        {(Object.keys(SOURCE_STATUS_LABEL) as SourceStatus[]).map((s) => <option key={s} value={s}>{SOURCE_STATUS_LABEL[s]}</option>)}
      </select>
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center gap-2.5 text-[0.9375rem] text-ink">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-brand" />
      {label}
    </label>
  );
}

export function Notice({ error, children }: { error?: string; children?: React.ReactNode }) {
  if (error === NOT_SET_UP) {
    return (
      <div className="rounded-xl border border-warn/40 bg-warn-soft p-4 text-[0.9375rem] leading-relaxed text-ink">
        This section isn&apos;t switched on yet. Nothing is wrong with your record; the database update for the First
        Page has not been applied.
      </div>
    );
  }
  if (error) return <div className="rounded-xl border border-scarlet/40 bg-scarlet/5 p-4 text-[0.9375rem] text-scarlet">{error}</div>;
  if (!children) return null;
  return <div className="rounded-xl border border-line bg-canvas p-4 text-[0.9375rem] leading-relaxed text-muted">{children}</div>;
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
    <button type={type} onClick={onClick} disabled={disabled} className="btn btn-primary">
      {children}
    </button>
  );
}
export function QuietButton({ children, onClick, danger }: { children: React.ReactNode; onClick?: () => void; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`btn btn-secondary btn-sm ${danger ? "text-muted hover:border-scarlet hover:text-scarlet" : ""}`}>
      {children}
    </button>
  );
}

export function BackToHub() {
  return <Link href="/first-page" className="btn btn-ghost">Back to your First Page</Link>;
}
