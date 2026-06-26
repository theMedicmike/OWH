"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";

export default function AuthCard() {
  const { supabase } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

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
      if (error) setMsg(error.message);
      else if (!data.session) setMsg("Account created — you can sign in now.");
    }
    setBusy(false);
  }

  const field =
    "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-faint focus:border-brand focus:ring-2 focus:ring-brand/15";

  return (
    <div className="w-full rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-7">
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
          <input
            type="password"
            required
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={field}
          />
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
          Free, private, and veteran-owned. Your record is yours.
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-faint">
          After you sign in, you&apos;ll confirm your service. Verified veteran status (ID.me) is coming soon.
        </p>
      </div>
    </div>
  );
}
