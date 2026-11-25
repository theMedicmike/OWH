"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";

// Where a veteran lands from the "set a new password" email. By the time he gets
// here the PKCE callback has already exchanged the recovery code for a session,
// so he is signed in — he just cannot get past this card until he sets a password
// he will actually remember.
//
// 🔴 Until 2026-08-06 this app had no recovery of any kind. A forgotten password
// meant a veteran permanently lost the record he built — every pin, every
// condition, every note in his own words. Nothing else in the app can destroy a
// man's work that completely, which is why this is worth its own screen.
export default function ResetPasswordCard() {
  const { supabase, ready, user } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  // If the link expired or was already used there is no session, and telling him
  // that plainly is kinder than a form that silently refuses to work.
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    if (ready && !user) setExpired(true);
  }, [ready, user]);

  const field =
    "field";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (password.length < 8) {
      setErr("Use at least 8 characters. Longer is better than complicated.");
      return;
    }
    if (password !== confirm) {
      setErr("Those two don't match. Have another go.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setErr(error.message);
    else setDone(true);
  }

  if (!ready) return <p className="text-[0.9375rem] text-muted">One moment…</p>;

  if (done) {
    return (
      <div className="w-full card p-6 text-center shadow-sm sm:p-7">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-success">
            <path d="m5 13 4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-ink">You&apos;re back in.</h2>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
          Your password is changed and your record is exactly where you left it.
        </p>
        <Link href="/dashboard" className="btn btn-primary btn-lg mt-5 w-full">
          Go to your record
        </Link>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="w-full card p-6 shadow-sm sm:p-7">
        <h2 className="text-lg font-semibold tracking-tight text-ink">That link has expired</h2>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
          Reset links are good for one hour and can only be used once. Nothing has happened to your record.
          Ask for a new link and it&apos;ll all be there.
        </p>
        <Link href="/" className="btn btn-primary btn-lg mt-5 w-full">
          Send me a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full card p-6 shadow-sm sm:p-7">
      <h2 className="text-lg font-semibold tracking-tight text-ink">Set a new password</h2>
      <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted">
        Pick something you&apos;ll remember. Your record hasn&apos;t changed and nothing has been deleted.
      </p>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="reset-new" className="field-label">New password</label>
          <div className="relative">
            <input
              id="reset-new"
              type={show ? "text" : "password"}
              required
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${field} pr-20`}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-pressed={show}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-1 top-1/2 flex h-11 min-w-16 -translate-y-1/2 items-center justify-center rounded-lg px-2 text-[0.9375rem] font-semibold text-brand hover:bg-canvas"
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="reset-again" className="field-label">Type it again</label>
          <input
            id="reset-again"
            type={show ? "text" : "password"}
            required
            autoComplete="new-password"
            placeholder="Same again"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={field}
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full btn btn-primary btn-lg"
        >
          {busy ? "One moment…" : "Save my new password"}
        </button>
      </form>

      {err && <p role="alert" className="mt-3 text-[0.9375rem] font-medium text-scarlet">{err}</p>}

      <p className="mt-5 border-t border-line pt-4 text-sm leading-relaxed text-muted">
        A longer phrase you can actually remember beats a short one with symbols in it. If you use a password
        manager, let it pick.
      </p>
    </div>
  );
}
