"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { NOT_SET_UP, SOURCE_STATUS_LABEL, TIERS, TIER_HELP, TIER_LABEL, type FpSource, type SourceStatus, type Tier } from "@/lib/firstPage";

// Shared controls for the First Page screens.
//
// Voice input uses the browser's own speech recognition (Chrome, Edge, Safari
// on the phone). The words go from the microphone to the field and nowhere
// else in this app; no model touches them. If the browser has no recognizer
// the mic button simply does not appear and the keyboard's own mic still works.
//
// Every control here is tap-first: short fixed lists are big tiles, toggles
// are whole rows, and nothing a thumb has to hit is shorter than 44px.

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
      className={`btn btn-secondary min-h-11 flex-none ${small ? "px-3.5" : ""} ${listening ? "border-scarlet bg-scarlet/10 text-scarlet" : ""}`}
      title={listening ? "Stop listening" : "Talk instead of typing"}
    >
      <svg aria-hidden="true" className="h-4 w-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
      </svg>
      {listening ? "Listening, tap to stop" : "Talk"}
    </button>
  );
}

export function TextField({
  label, help, value, onChange, rows = 3, placeholder, voice = true, id, inputRef,
}: {
  label: string; help?: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; voice?: boolean; id?: string;
  inputRef?: React.Ref<HTMLTextAreaElement>;
}) {
  const fid = id ?? label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <div>
      <div className="mb-1.5 flex items-end justify-between gap-3">
        <label htmlFor={fid} className="field-label mb-0">{label}</label>
        {voice && <MicButton small onText={(t) => onChange(value ? `${value.replace(/\s+$/, "")} ${t}` : t)} />}
      </div>
      {help && <p className="mb-2 text-sm leading-relaxed text-muted">{help}</p>}
      <textarea ref={inputRef} id={fid} value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} className="field" />
    </div>
  );
}

export function Input({
  label, help, value, onChange, placeholder, type = "text", id, voice = false, inputMode,
}: {
  label: string; help?: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; id?: string; voice?: boolean;
  inputMode?: "numeric" | "text" | "tel";
}) {
  const fid = id ?? label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <div>
      <div className="mb-1.5 flex items-end justify-between gap-3">
        <label htmlFor={fid} className="field-label mb-0">{label}</label>
        {voice && <MicButton small onText={(t) => onChange(value ? `${value.replace(/\s+$/, "")} ${t}` : t)} />}
      </div>
      {help && <p className="mb-2 text-sm leading-relaxed text-muted">{help}</p>}
      <input id={fid} type={type} inputMode={inputMode} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="field" />
    </div>
  );
}

// Picking one of many numbered documents stays a list: there can be dozens.
export function SourceSelect({ sources, value, onChange, label = "Source", id }: { sources: FpSource[]; value: string | null; onChange: (id: string | null) => void; label?: string; id?: string }) {
  const autoId = useId();
  const fid = id ?? `source-${autoId}`;
  return (
    <div>
      <label htmlFor={fid} className="field-label">{label}</label>
      <select id={fid} value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} className="field">
        <option value="">No source yet</option>
        {sources.map((s) => (
          <option key={s.id} value={s.id}>{s.number}. {s.label}{s.source_date ? `, ${s.source_date}` : ""} ({SOURCE_STATUS_LABEL[s.status]})</option>
        ))}
      </select>
      {sources.length === 0 && (
        <p className="mt-1.5 text-sm text-muted">
          No sources yet. <Link href="/first-page/sources" className="font-semibold text-brand hover:underline">Add your documents first.</Link>
        </p>
      )}
    </div>
  );
}

// A short fixed list is a set of big tap tiles, never a dropdown. The chosen
// one is filled; the rest are outlined. A tile can carry a second line.
export function ChoiceTiles<T extends string>({
  label, options, value, onChange, cols = 2, help,
}: {
  label: string;
  options: { value: T; label: string; detail?: string }[];
  value: T | null;
  onChange: (v: T) => void;
  cols?: 2 | 3 | 4;
  help?: string;
}) {
  const grid = cols === 4 ? "sm:grid-cols-4" : cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
  return (
    <fieldset>
      <legend className="field-label">{label}</legend>
      {help && <p className="mb-2 text-sm leading-relaxed text-muted">{help}</p>}
      <div className={`grid grid-cols-1 gap-2 ${grid}`}>
        {options.map((o) => {
          const on = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(o.value)}
              className={`btn w-full ${o.detail ? "min-h-14 flex-col items-start justify-center gap-0.5 text-left" : "min-h-12"} ${on ? "btn-primary" : "btn-secondary"}`}
            >
              <span>{o.label}</span>
              {o.detail && <span className={`text-sm font-normal leading-snug ${on ? "text-brand-foreground/85" : "text-muted"}`}>{o.detail}</span>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

// Common answers as tap chips. Tapping one puts it in the box; the veteran
// finishes the rest. Nothing here guesses a date, a value or a source.
export function QuickPicks({ label, picks, onPick }: { label: string; picks: string[]; onPick: (p: string) => void }) {
  if (picks.length === 0) return null;
  return (
    <div>
      <p className="field-label">{label}</p>
      <div className="flex flex-wrap gap-2">
        {picks.map((p) => (
          <button key={p} type="button" onClick={() => onPick(p)} className="btn btn-secondary min-h-11 rounded-full px-4">
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TierSelect({ value, onChange, label = "How you know" }: { value: Tier | null; onChange: (t: Tier) => void; label?: string }) {
  return (
    <ChoiceTiles
      label={label}
      value={value}
      onChange={onChange}
      options={TIERS.map((t) => ({ value: t, label: TIER_LABEL[t], detail: TIER_HELP[t] }))}
    />
  );
}

const STATUS_OPTIONS = (Object.keys(SOURCE_STATUS_LABEL) as SourceStatus[]).map((s) => ({ value: s, label: SOURCE_STATUS_LABEL[s] }));

export function StatusSelect({ value, onChange, label = "Where the request stands" }: { value: SourceStatus; onChange: (s: SourceStatus) => void; label?: string }) {
  return <ChoiceTiles label={label} value={value} onChange={onChange} options={STATUS_OPTIONS} cols={3} />;
}

// A whole-row tap target: the box and its words both toggle it.
export function Toggle({ checked, onChange, label, detail }: { checked: boolean; onChange: (v: boolean) => void; label: string; detail?: string }) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 py-1.5 text-[0.9375rem] leading-snug text-ink">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-6 w-6 flex-none accent-brand" />
      <span>
        {label}
        {detail && <span className="mt-0.5 block text-sm text-muted">{detail}</span>}
      </span>
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
  if (error) return <div role="alert" className="rounded-xl border border-scarlet/40 bg-scarlet/5 p-4 text-[0.9375rem] text-scarlet">{error}</div>;
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

export function PrimaryButton({
  children, onClick, disabled, type = "button", large,
}: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit"; large?: boolean }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`btn btn-primary ${large ? "btn-lg w-full sm:w-auto" : ""}`}>
      {children}
    </button>
  );
}

// Secondary actions are outlined. A destructive one is quiet (a ghost), so it
// is never the thing a thumb lands on by accident.
export function QuietButton({ children, onClick, danger }: { children: React.ReactNode; onClick?: () => void; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={danger ? "btn btn-ghost text-muted hover:text-scarlet" : "btn btn-secondary"}>
      {children}
    </button>
  );
}

// The heading at the top of a card, with an optional one-sentence lede.
export function CardTitle({ children, lede }: { children: React.ReactNode; lede?: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight text-ink">{children}</h2>
      {lede && <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted">{lede}</p>}
    </div>
  );
}

export function BackToHub() {
  return (
    <Link href="/first-page" className="btn btn-ghost -ml-2">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 flex-none" aria-hidden="true">
        <path d="m15 6-6 6 6 6" />
      </svg>
      Back to your First Page
    </Link>
  );
}
