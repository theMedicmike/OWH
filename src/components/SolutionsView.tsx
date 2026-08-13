"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { ServiceRibbon } from "./Patriotic";
import {
  SOLUTION_PILLARS, START_THIS_WEEK, VA_WHOLE_HEALTH_NOTE, SOLUTION_CATEGORY_ORDER,
  RESOURCE_POINTERS, type SolutionPillar,
} from "@/lib/education";

// 🔴 This page is deliberately NOT personalised. It used to rank pillars against
// the veteran's own logged exposures and conditions under a heading reading
// "Tailored to your record" — which meant a man who logged heavy metals was shown
// "Support natural detox" as advice matched to him. This app sells nothing and
// recommends no product, but no transaction is needed anywhere for that click
// path to read as a funnel to an outside reviewer.
// Everyone now sees the same pillars in the same order. Do not reintroduce
// matching here — SolutionPillar no longer carries the fields to do it with.
function PillarCard({ p }: { p: SolutionPillar }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="h-1 bg-accent" />
      <div className="p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-brand/10 text-brand">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d={p.icon} />
            </svg>
          </span>
          <h3 className="text-base font-bold text-ink">{p.title}</h3>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-muted">{p.why}</p>

        <div className="mt-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-accent">Everyday, low-risk steps</div>
          <ul className="mt-1.5 space-y-1">
            {p.everyday.map((e, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed text-ink"><span className="text-accent">•</span>{e}</li>
            ))}
          </ul>
        </div>

        <div className="mt-3 rounded-lg border border-line bg-canvas p-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-muted">Bring to your practitioner</div>
          <ul className="mt-1.5 space-y-1">
            {p.practitioner.map((q, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed text-ink"><span className="text-brand">•</span>{q}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function SolutionsView() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);

  // The veteran's exposures and conditions are deliberately NOT read here. This
  // page shows the same general education to everyone; nothing on it is matched
  // to a personal record. See the note above PillarCard.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoaded(true);
    });
  }, [supabase]);

  if (!loaded) return <p className="text-sm text-muted">Loading…</p>;
  if (!user) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6">
        <p className="text-sm text-muted">Sign in to see your whole-health plan.</p>
        <Link href="/" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">← Go to sign in</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Restoration mindset */}
      <div className="overflow-hidden rounded-xl border border-accent/30 bg-accent/5">
        <ServiceRibbon />
        <div className="p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-accent">Burden, not broken</div>
          <p className="mt-1.5 text-sm leading-relaxed text-ink">
            Most veterans aren&apos;t broken — they&apos;re carrying a burden that was never measured or
            written down. Nothing on this page undoes an exposure, and nobody here is selling you anything
            that claims to. What follows is the ordinary, unglamorous ground floor: sleep, movement, blood
            pressure, blood sugar, smoking. It is not exciting and it is the part that is still movable.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            This is general education for every veteran — none of it is matched to your record, and none of
            it is personal advice. It is not treatment, not a prescription, and never part of your VA claim.
            <span className="font-semibold"> This app is free and sells nothing.</span>
          </p>
        </div>
      </div>

      {/* Start this week — the free medicine */}
      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="text-sm font-bold text-ink">Start this week — the free medicine</div>
        <p className="mt-1 text-xs text-muted">
          You don&apos;t have to wait for an appointment. Pick one, do it for two weeks, then add the next.
        </p>
        <ul className="mt-3 space-y-2">
          {START_THIS_WEEK.map((s, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink">
              <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand/10 text-[11px] font-bold text-brand">{i + 1}</span>
              {s}
            </li>
          ))}
        </ul>
        <p className="mt-3 rounded-lg bg-canvas px-3 py-2 text-xs leading-relaxed text-muted">
          Sequence it safely: stabilize before you optimize, change one thing at a time so you can tell
          what&apos;s working, and never stop a prescribed medication on your own — any taper happens with
          your prescriber.
        </p>
      </div>

      {/* VA runs its own real clinical "Whole Health" program — say so once, plainly, before this looks comprehensive enough to be mistaken for it. */}
      <div className="rounded-lg border border-line bg-canvas px-4 py-3 text-xs leading-relaxed text-muted">
        {VA_WHOLE_HEALTH_NOTE}
      </div>

      {/* Cascade order: know what you're carrying, THEN reduce the burden, THEN
          the daily-habit work, THEN a guard against exploitation, THEN extend
          the circle. Same order, same content, for every visitor — grouping is
          display-only and never computed from a veteran's record. */}
      {SOLUTION_CATEGORY_ORDER.map((cat) => {
        const pillars = SOLUTION_PILLARS.filter((p) => p.category === cat);
        const resources = RESOURCE_POINTERS.filter((r) => r.category === cat);
        if (!pillars.length) return null;
        return (
          <div key={cat} className="space-y-3">
            <div className="mt-2 text-xs font-bold uppercase tracking-widest text-muted">{cat}</div>
            {pillars.map((p) => <PillarCard key={p.key} p={p} />)}
            {resources.length > 0 && (
              <div className="rounded-xl border border-line bg-surface p-4">
                <div className="text-[11px] font-bold uppercase tracking-wide text-accent">Real, free help</div>
                <ul className="mt-2 space-y-2.5">
                  {resources.map((r) => (
                    <li key={r.name} className="text-sm leading-relaxed">
                      <a href={r.url} target="_blank" rel="noreferrer" className="font-semibold text-brand hover:underline">{r.name}</a>
                      {r.partner && <span className="ml-1.5 rounded bg-canvas px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">Partner nonprofit, not VA</span>}
                      <div className="text-muted">{r.what}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}

      <div className="rounded-xl border-2 border-brand bg-brand/5 px-5 py-4">
        <div className="font-semibold text-brand">Choosing help wisely</div>
        <ul className="mt-1.5 space-y-1.5 text-sm leading-relaxed text-ink">
          <li>• Run from anyone who promises a cure — no honest person will.</li>
          <li>• Be cautious of anyone whose entire answer is the products they happen to sell.</li>
          <li>• Good help welcomes the questions: &ldquo;Will you test before you treat? Will you coordinate with my VA doctors?&rdquo;</li>
        </ul>
        <p className="mt-2.5 text-sm leading-relaxed text-ink">
          Supplements, herbs, and protocols can interact with medications and conditions — including
          stressing the kidneys or liver, the very organs many exposures already burden. Always talk with
          a qualified clinician before starting anything. If you&apos;re struggling, the Veterans Crisis
          Line is here 24/7 — dial <strong>988</strong>, then press <strong>1</strong>.
        </p>
      </div>
    </div>
  );
}
