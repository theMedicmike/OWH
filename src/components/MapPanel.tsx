"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Site } from "./MapView";

// Load the map only in the browser. MapLibre touches browser globals at import.
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[520px] w-full items-center justify-center rounded-xl border border-zinc-200 text-sm text-zinc-400 dark:border-zinc-800">
      Loading map…
    </div>
  ),
});

export default function MapPanel({ sites }: { sites: Site[] }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  async function signIn() {
    setBusy(true);
    setMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setMsg(error.message);
  }

  async function signUp() {
    setBusy(true);
    setMsg("");
    const { data, error } = await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) setMsg(error.message);
    else if (!data.session)
      setMsg("Account created. If sign-in does not work, email confirmation may be on — turn it off in Supabase for testing.");
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  const inputCls =
    "rounded-md border border-zinc-300 bg-transparent px-3 py-1.5 text-sm dark:border-zinc-700";
  const btnCls =
    "rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800";

  return (
    <div>
      {ready &&
        (user ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm dark:border-emerald-900 dark:bg-emerald-950/40">
            <span className="text-emerald-800 dark:text-emerald-300">
              Signed in as <strong>{user.email}</strong> — your pins save to your private record.
            </span>
            <button onClick={signOut} className={btnCls}>
              Sign out
            </button>
          </div>
        ) : (
          <div className="mb-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Sign in to save your pins
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                type="email"
                placeholder="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
              />
              <input
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
              />
              <button onClick={signIn} disabled={busy} className={btnCls}>
                Sign in
              </button>
              <button onClick={signUp} disabled={busy} className={btnCls}>
                Create account
              </button>
            </div>
            {msg && <p className="mt-2 text-xs text-zinc-500">{msg}</p>}
          </div>
        ))}

      <MapView sites={sites} user={user} />
    </div>
  );
}
