"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";

const TITLE = {
  in: "Sign in",
  up: "Create your free account",
  forgot: "Reset your password",
} as const;

const LEDE = {
  in: "Welcome back. Your record is where you left it.",
  up: "Free, private, and yours. It takes about a minute.",
  forgot: "Enter the email you signed up with. Your record stays exactly as it is.",
} as const;

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-success" aria-hidden="true">
      <path d="M4 4h16v16H4z" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

// `bare` drops the card chrome when the sign-in page already wraps the form in
// its own card; `onBack` returns that card to its opening words.
export default function AuthCard({
  initialMode = "in",
  bare = false,
  onBack,
}: {
  initialMode?: "in" | "up";
  bare?: boolean;
  onBack?: () => void;
} = {}) {
  const { supabase } = useAuth();
  // 🔴 "forgot" exists because until 2026-08-06 this app had NO password recovery
  // of any kind. A veteran who forgot his password was permanently locked out of
  // a record he may have spent hours building. Do not remove this path without
  // replacing it.
  const [mode, setMode] = useState<"in" | "up" | "forgot">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    if (mode === "forgot") {
      // Routed through the existing PKCE callback, which exchanges the code for a
      // session and forwards to /reset, where he sets the new password.
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset`,
      });
      // Deliberately the SAME response whether or not the address is on file:
      // otherwise this form tells a stranger which veterans have accounts here.
      if (error && !/rate|limit|many/i.test(error.message)) setResetSent(true);
      else if (error) setMsg(error.message);
      else setResetSent(true);
    } else if (mode === "in") {
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

  function go(next: "in" | "up" | "forgot") {
    setMode(next);
    setMsg("");
    if (next !== "in") setPassword("");
  }

  function backToSignIn() {
    setResetSent(false);
    setConfirmed(false);
    setMode("in");
    setPassword("");
    setMsg("");
  }

  if (resetSent || confirmed) {
    return (
      <div className={bare ? "text-center" : "card p-6 text-center sm:p-7"}>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-soft">
          <MailIcon />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-ink">Check your email</h2>
        {resetSent ? (
          <>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
              If <strong className="text-ink">{email}</strong> has an account here, we sent a link to set a new
              password. It is good for one hour.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Nothing in your record changes, and nothing is deleted. Check spam if it does not arrive in a few
              minutes.
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
              We sent a confirmation link to <strong className="text-ink">{email}</strong>. Open it to verify your
              account and finish setting up your record.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">Once you confirm, come back here and sign in.</p>
          </>
        )}
        <button
          onClick={() => { backToSignIn(); if (confirmed) setEmail(""); }}
          className="btn btn-secondary mt-6 w-full"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className={bare ? "" : "card p-6 sm:p-7"}>
      <h2 className="text-xl font-semibold tracking-tight text-ink">{TITLE[mode]}</h2>
      <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted">{LEDE[mode]}</p>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="auth-email" className="field-label">Email</label>
          <input
            id="auth-email"
            type="email"
            required
            autoComplete="email"
            autoFocus={bare}
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
          />
        </div>
        {mode !== "forgot" && (
          <div>
            <label htmlFor="auth-password" className="field-label">Password</label>
            <div className="relative">
              <input
                id="auth-password"
                type={show ? "text" : "password"}
                required
                autoComplete={mode === "in" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field pr-20"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="btn btn-ghost btn-sm absolute right-0.5 top-1/2 min-h-11 -translate-y-1/2"
                aria-pressed={show}
              >
                {show ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        )}

        {msg && (
          <p role="alert" className="rounded-xl bg-scarlet/8 px-3.5 py-2.5 text-sm font-medium leading-relaxed text-scarlet">
            {msg}
          </p>
        )}

        <button type="submit" disabled={busy} className={`btn btn-lg w-full ${mode === "in" ? "btn-flag" : "btn-primary"}`}>
          {busy
            ? "One moment…"
            : mode === "in"
              ? "Sign in"
              : mode === "up"
                ? "Create my account"
                : "Send me a reset link"}
        </button>
      </form>

      <div className="mt-5 flex flex-col items-center gap-1 text-[0.9375rem]">
        {mode === "in" && (
          <>
            <button type="button" onClick={() => go("forgot")} className="btn btn-ghost">
              Forgot your password?
            </button>
            <p className="text-muted">
              New here?{" "}
              <button type="button" onClick={() => go("up")} className="inline-flex min-h-11 items-center font-semibold text-brand hover:underline">
                Create your free account
              </button>
            </p>
          </>
        )}
        {mode === "up" && (
          <p className="text-muted">
            Already have an account?{" "}
            <button type="button" onClick={() => go("in")} className="inline-flex min-h-11 items-center font-semibold text-brand hover:underline">
              Sign in
            </button>
          </p>
        )}
        {mode === "forgot" && (
          <button type="button" onClick={backToSignIn} className="btn btn-ghost">
            Back to sign in
          </button>
        )}
        {onBack && mode !== "forgot" && (
          <button type="button" onClick={onBack} className="btn btn-ghost text-muted">
            Back
          </button>
        )}
      </div>

      <p className="mt-5 border-t border-line pt-4 text-sm leading-relaxed text-muted">
        After you sign in, you confirm your service. Verified veteran status (ID.me) is coming soon.
      </p>
    </div>
  );
}
