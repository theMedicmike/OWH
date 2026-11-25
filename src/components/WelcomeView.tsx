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
      <section className="card p-6 sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight text-ink sm:text-xl">Before you start: three things worth knowing</h2>

        <div className="mt-5 space-y-4">
          <div className="flex gap-3.5">
            <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-canvas text-[0.9375rem] font-semibold text-brand" aria-hidden="true">1</span>
            <div>
              <h3 className="text-[0.9375rem] font-semibold text-ink">A VA disability claim asks one thing</h3>
              <p className="mt-0.5 text-[0.9375rem] leading-relaxed text-muted">
                Did something about your service cause or worsen a health condition. This app helps you build the
                record that answers that: where you served, what happened to you, and what you live with now.
                So it&apos;s not just your memory against a form.
              </p>
            </div>
          </div>
          <div className="flex gap-3.5">
            <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-canvas text-[0.9375rem] font-semibold text-brand" aria-hidden="true">2</span>
            <div>
              <h3 className="text-[0.9375rem] font-semibold text-ink">It&apos;s free, same as filing the claim itself</h3>
              <p className="mt-0.5 text-[0.9375rem] leading-relaxed text-muted">
                Nothing here is sold, and nothing is upsold. An accredited VSO&apos;s help to file is also always
                free. If anyone ever asks you to pay to file a VA claim, that&apos;s a red flag.
              </p>
            </div>
          </div>
          <div className="flex gap-3.5">
            <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-canvas text-[0.9375rem] font-semibold text-brand" aria-hidden="true">3</span>
            <div>
              <h3 className="text-[0.9375rem] font-semibold text-ink">Plan on about three sittings, not one</h3>
              <p className="mt-0.5 text-[0.9375rem] leading-relaxed text-muted">
                Your service, where you served, and what you&apos;re dealing with are three separate steps. Do one,
                close the tab, come back later. Everything saves as you go.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 card p-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[0.9375rem] font-semibold text-ink">Sample record</span>
            <span className="text-sm text-muted">This is what you&apos;ll build</span>
          </div>
          <div className="mt-2">
            <ServiceTimeline data={SAMPLE} compact />
          </div>
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-xl border border-line bg-canvas px-4 py-3 text-sm leading-relaxed text-muted">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-5 w-5 flex-none text-success" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>
            Free and private, built for veterans by Operation Whole Health, a 501(c)(3) nonprofit founded by Michael
            Jones. Your record is yours, never sold.{" "}
            <Link href="/about" className="inline-flex min-h-11 items-center font-semibold text-brand underline-offset-2 hover:underline">Why I built this</Link>
          </span>
        </div>

        <button
          onClick={begin}
          disabled={busy}
          className="mt-6 w-full btn btn-primary btn-lg"
        >
          {busy ? "One moment…" : "Let's build your record"}
        </button>
      </section>

      <p className="text-center text-sm leading-relaxed text-muted">
        If you&apos;re struggling right now, the Veterans Crisis Line is here 24/7 — dial 988, then press 1.
      </p>
    </div>
  );
}
