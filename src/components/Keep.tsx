"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";

// The app never loses typed work, and nothing vanishes on a timer.
//
// Built for a veteran with a brain injury (the cognitive pass, C24):
//   - useAutosave: a field saves itself about 600 ms after the last keystroke
//     (and again on blur), with a quiet "Saved" mark that stays put.
//   - useDraft: a multi-field form also keeps a local copy on this device,
//     keyed by member and screen, so a refresh or a dropped connection gives
//     back what was typed ("We kept what you typed").
//   - UndoProvider / useUndo: a delete or a replace is held, not done, while a
//     quiet bar offers Undo. The bar has NO timer. It stays until the veteran
//     taps Undo, closes it, starts another change, or leaves the screen; only
//     then is the change carried out. If the tab is closed first, the change
//     is attempted on the way out, and if that cannot finish the row simply
//     stays: the safe direction.

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useAutosave<T>(
  value: T,
  save: (v: T) => Promise<boolean>,
  { enabled = true, delay = 600 }: { enabled?: boolean; delay?: number } = {},
) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const last = useRef<string | null>(null);
  const saveRef = useRef(save);
  const valueRef = useRef(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { saveRef.current = save; valueRef.current = value; });

  const run = useCallback(async () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    const v = valueRef.current;
    const key = JSON.stringify(v);
    if (key === last.current) return;
    setStatus("saving");
    const ok = await saveRef.current(v);
    if (ok) last.current = key;
    setStatus(ok ? "saved" : "error");
  }, []);

  // The first value seen once enabled is the saved one; only changes after
  // that are written.
  useEffect(() => {
    if (!enabled) return;
    const key = JSON.stringify(value);
    if (last.current === null) { last.current = key; return; }
    if (key === last.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(run, delay);
  }, [value, enabled, delay, run]);

  // Leaving the screen saves what is pending.
  useEffect(() => () => { if (timer.current) { clearTimeout(timer.current); void run(); } }, [run]);

  return { status, flush: run };
}

// Quiet status beside a field. It is a word, not a toast: it stays until the
// next edit changes it, and it never carries an action.
export function SavedMark({ status, className = "" }: { status: SaveStatus; className?: string }) {
  if (status === "idle") return <span className={`min-h-5 ${className}`} aria-hidden="true" />;
  const text = status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Not saved yet. It is kept on this device.";
  const tone = status === "saved" ? "text-success" : status === "error" ? "text-warn" : "text-muted";
  return (
    <span role="status" className={`inline-flex items-center gap-1.5 text-[0.8125rem] font-medium ${tone} ${className}`}>
      {status === "saved" && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      )}
      {text}
    </span>
  );
}

// A local copy of a form, on this device only, keyed by member and screen.
export function useDraft<T>(screen: string | null) {
  const { user } = useAuth();
  const key = user && screen ? `ctd:draft:${user.id}:${screen}` : null;
  const read = useCallback((): T | null => {
    if (!key || typeof window === "undefined") return null;
    try { const raw = window.localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : null; } catch { return null; }
  }, [key]);
  const write = useCallback((v: T) => {
    if (!key || typeof window === "undefined") return;
    try { window.localStorage.setItem(key, JSON.stringify(v)); } catch {}
  }, [key]);
  const clear = useCallback(() => {
    if (!key || typeof window === "undefined") return;
    try { window.localStorage.removeItem(key); } catch {}
  }, [key]);
  return { read, write, clear, ready: !!key };
}

export function KeptNotice({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p role="status" className="rounded-xl border border-success/30 bg-success-soft px-4 py-3 text-[0.9375rem] text-ink">
      We kept what you typed.
    </p>
  );
}

// ── undo ────────────────────────────────────────────────────────────────────
type Pending = { id: number; message: string; commit: () => void | Promise<void>; undo: () => void };
type UndoApi = { offer: (p: Omit<Pending, "id">) => void };
const UndoCtx = createContext<UndoApi>({ offer: (p) => { void p.commit(); } });

export function useUndo() {
  return useContext(UndoCtx);
}

export function UndoProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const ref = useRef<Pending | null>(null);
  const seq = useRef(0);
  const pathname = usePathname();

  const settle = useCallback(() => {
    const p = ref.current;
    ref.current = null;
    setPending(null);
    if (p) void p.commit();
  }, []);

  const offer = useCallback((p: Omit<Pending, "id">) => {
    settle();
    const next = { ...p, id: ++seq.current };
    ref.current = next;
    setPending(next);
  }, [settle]);

  // Leaving the screen carries the change out. So does closing the tab.
  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    queueMicrotask(settle);
  }, [pathname, settle]);
  useEffect(() => {
    const onHide = () => settle();
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, [settle]);

  function undo() {
    const p = ref.current;
    ref.current = null;
    setPending(null);
    p?.undo();
  }

  return (
    <UndoCtx.Provider value={{ offer }}>
      {children}
      {pending && (
        <div className="fixed inset-x-3 bottom-[4.75rem] z-50 mx-auto flex max-w-lg items-center gap-2 rounded-2xl bg-ink py-1.5 pl-4 pr-1.5 text-white shadow-[0_12px_32px_-12px_rgba(21,33,46,0.6)] print:hidden sm:bottom-5" role="status" aria-live="polite">
          <span className="min-w-0 flex-1 text-[0.9375rem] leading-snug">{pending.message}</span>
          <button type="button" onClick={undo} className="btn min-h-11 flex-none bg-white px-4 text-ink hover:bg-white/90">Undo</button>
          <button type="button" onClick={settle} aria-label="Close" className="flex h-11 w-11 flex-none items-center justify-center rounded-xl text-white/75 hover:bg-white/10 hover:text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-5 w-5" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>
      )}
    </UndoCtx.Provider>
  );
}
