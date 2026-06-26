"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { ServiceRibbon } from "./Patriotic";

export default function AuthCard() {
  const { supabase } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
      // On success, AuthProvider updates the user and the page redirects to /dashboard.
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMsg(error.message);
      } else if (!data.session) {
        setConfirmed(true);
      }
    }
    setBusy(false);
  }

  const field =
    "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-faint focus:border-brand focus:ring-2 focus:ring-brand/15";

  if (confirmed) {
    return (
      <div className="w-full rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-7 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-success">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.49 12 19.79 19.79 0 0 1 1.44 3.44 2 2 0 0 1 3.43 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.08 6.08l.81-.81a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-ink">Check your email</h3>
        <p className="mt-2 text-sm text-muted">
          We sent a confirmation link to <strong className="text-ink">{email}</strong>.
          Click it to verify your account and finish setting up your record.
        </p>
        <p className="mt-3 text-xs text-faint">
          Once you confirm, come back here and sign in.
        </p>
        <button
          onClick={() => { setConfirmed(false); setMode("in"); setEmail(""); setPassword(""); }}
          className="mt-5 w-full rounded-lg border border-line bg-canvas px-4 py-2 text-sm font-medium text-muted hover:bg-surface"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-7">
      <ServiceRibbon className="mb-5 rounded-full opacity-90" />
      <div className="flex rounded-lg bg-canvas p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => { setMode("in"); setMsg(""); }}
          className={`flex-1 rounded-md py-1.5 transition ${mode === "in" ? "bg-surface text-ink shadow-sm" : "text-muted"}`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => { setMode("up"); setMsg(""); }}
          className={`flex-1 rounded-md py-1.5 transition ${mode === "up" ? "bg-surface text-ink shadow-sm" : "text-muted"}`}
        >
          Create account
        </button>
      </div>

      <form onSubmit={submit} className="mt-5 space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Email</label>
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={field}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Password</label>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              required
              autoComplete={mode === "in" ? "current-password" : "new-password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${field} pr-14`}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1.5 py-1 text-xs font-medium text-muted hover:text-ink"
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground transition hover:bg-brand-600 disabled:opacity-60"
        >
          {busy ? "One moment…" : mode === "in" ? "Sign in" : "Create your account"}
        </button>
      </form>

      {msg && <p className="mt-3 text-xs text-muted">{msg}</p>}

      <div className="mt-5 border-t border-line pt-4">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
          Free, private, and built for veterans. Your record is yours.
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-faint">
          After you sign in, you&apos;ll confirm your service. Verified veteran status (ID.me) is coming soon.
        </p>
      </div>
    </div>
  );
}
