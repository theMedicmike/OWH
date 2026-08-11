"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import ServiceTimeline from "./ServiceTimeline";
import { SAMPLE } from "./Landing";

// ─────────────────────────────────────────────────────────────────────────────
// PAGE ZERO — the plain-English screen a brand-new veteran sees ONCE, before
// the intake wizard. Gated server-side (app/intake/page.tsx redirects here
// only when a member has no service data yet AND has never confirmed this
// screen) so an existing veteran with a real record never sees it again.
//
// Reuses Landing's exact SAMPLE artifact rather than a second, driftable copy.
// ─────────────────────────────────────────────────────────────────────────────

export default function WelcomeView() {
  const { user, supabase } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function begin() {
    setBusy(true);
    if (user) {
      // Create the member row if this is truly the first thing a brand-new
      // account has ever done, then stamp intro_seen_at so this screen never
      // shows again — a failed write here should never block reaching intake.
      const { data: existing } = await supabase.from("members").select("id").eq("auth_id", user.id).maybeSingle();
      if (existing?.id) {
        await supabase.from("members").update({ intro_seen_at: new Date().toISOString() }).eq("id", existing.id);
      } else {
        await supabase.from("members").insert({ auth_id: user.id, intro_seen_at: new Date().toISOString() });
      }
    }
    router.push("/intake");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <h2 className="text-xl font-bold tracking-tight text-ink">Before you start — three things worth knowing</h2>

        <div className="mt-5 space-y-4">
          <div className="flex gap-3.5">
            <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">1</span>
            <div>
              <div className="text-sm font-semibold text-ink">A VA disability claim asks one thing</div>
              <p className="mt-0.5 text-sm leading-relaxed text-muted">
                Did something about your service cause or worsen a health condition. This app helps you build the
                record that answers that — where you served, what happened to you, and what you live with now —
                so it&apos;s not just your memory against a form.
              </p>
            </div>
          </div>
          <div className="flex gap-3.5">
            <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">2</span>
            <div>
              <div className="text-sm font-semibold text-ink">It&apos;s free — same as filing the claim itself</div>
              <p className="mt-0.5 text-sm leading-relaxed text-muted">
                Nothing here is sold, and nothing is upsold. An accredited VSO&apos;s help to file is also always
                free. If anyone ever asks you to pay to file a VA claim, that&apos;s a red flag.
              </p>
            </div>
          </div>
          <div className="flex gap-3.5">
            <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">3</span>
            <div>
              <div className="text-sm font-semibold text-ink">Plan on about three sittings, not one</div>
              <p className="mt-0.5 text-sm leading-relaxed text-muted">
                Your service, where you served, and what you&apos;re dealing with are three separate steps. Do one,
                close the tab, come back later — everything saves as you go.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-line bg-white p-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wide text-accent">Sample record</span>
            <span className="text-[11px] text-faint">This is what you&apos;ll build</span>
          </div>
          <div className="mt-2">
            <ServiceTimeline data={SAMPLE} compact />
          </div>
        </div>

        <div className="mt-5 flex items-start gap-2 rounded-lg border border-line bg-canvas px-3.5 py-2.5 text-xs leading-relaxed text-muted">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 flex-none text-success">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>
            Free and private, built for veterans by Operation Whole Health, a 501(c)(3) nonprofit founded by Michael
            Jones, a veteran. Your record is yours — never sold.{" "}
            <Link href="/about" className="font-semibold text-brand hover:underline">Why I built this →</Link>
          </span>
        </div>

        <button
          onClick={begin}
          disabled={busy}
          className="mt-6 w-full rounded-xl bg-brand px-4 py-3 text-center text-sm font-bold text-brand-foreground transition hover:bg-brand-600 disabled:opacity-60"
        >
          {busy ? "One moment…" : "Let's build your record →"}
        </button>
      </section>

      <p className="text-center text-xs leading-relaxed text-faint">
        If you&apos;re struggling right now, the Veterans Crisis Line is here 24/7 — dial 988, then press 1.
      </p>
    </div>
  );
}
