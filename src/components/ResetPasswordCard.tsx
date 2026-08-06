"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { ServiceRibbon } from "./Patriotic";

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
    "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-faint focus:border-brand focus:ring-2 focus:ring-brand/15";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (password.length < 8) {
      setErr("Use at least 8 characters — longer is better than complicated.");
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

  if (!ready) return <p className="text-sm text-muted">One moment…</p>;

  if (done) {
    return (
      <div className="w-full rounded-2xl border border-line bg-surface p-6 text-center shadow-sm sm:p-7">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-success">
            <path d="m5 13 4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-ink">You&apos;re back in.</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Your password is changed and your record is exactly where you left it.
        </p>
        <Link
          href="/dashboard"
          className="mt-5 block w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground transition hover:bg-brand-600"
        >
          Go to your record
        </Link>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="w-full rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-7">
        <ServiceRibbon className="mb-5 rounded-full opacity-90" />
        <h3 className="text-base font-semibold text-ink">That link has expired</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Reset links are good for one hour and can only be used once. Nothing has happened to your record —
          ask for a new link and it&apos;ll all be there.
        </p>
        <Link
          href="/"
          className="mt-5 block w-full rounded-lg bg-brand px-4 py-2.5 text-center text-sm font-semibold text-brand-foreground transition hover:bg-brand-600"
        >
          Send me a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-7">
      <ServiceRibbon className="mb-5 rounded-full opacity-90" />
      <h3 className="text-base font-semibold text-ink">Set a new password</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">
        Pick something you&apos;ll remember. Your record hasn&apos;t changed and nothing has been deleted.
      </p>

      <form onSubmit={submit} className="mt-5 space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">New password</label>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              required
              autoComplete="new-password"
              placeholder="At least 8 characters"
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
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Type it again</label>
          <input
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
          className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground transition hover:bg-brand-600 disabled:opacity-60"
        >
          {busy ? "One moment…" : "Save my new password"}
        </button>
      </form>

      {err && <p className="mt-3 text-xs text-scarlet">{err}</p>}

      <p className="mt-5 border-t border-line pt-4 text-[11px] leading-relaxed text-faint">
        A longer phrase you can actually remember beats a short one with symbols in it. If you use a password
        manager, let it pick.
      </p>
    </div>
  );
}
