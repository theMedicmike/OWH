"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { EXPOSURE_LABEL, SOLUTION_PILLARS, type SolutionPillar } from "@/lib/education";

function PillarCard({ p, relevant }: { p: SolutionPillar; relevant: boolean }) {
  return (
    <div className={`overflow-hidden rounded-xl border bg-surface ${relevant ? "border-accent/40" : "border-line"}`}>
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
  const [myClasses, setMyClasses] = useState<string[]>([]);
  const [myConditions, setMyConditions] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user ?? null);
      if (!data.user) { setLoaded(true); return; }
      const [{ data: exp }, { data: cond }] = await Promise.all([
        supabase.from("exposures").select("exposure_class"),
        supabase.from("conditions").select("label"),
      ]);
      setMyClasses(Array.from(new Set(((exp ?? []) as { exposure_class: string }[]).map((e) => e.exposure_class))));
      setMyConditions(((cond ?? []) as { label: string }[]).map((c) => c.label));
      setLoaded(true);
    });
  }, [supabase]);

  if (!loaded) return <p className="text-sm text-muted">Loading…</p>;
  if (!user) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6">
        <p className="text-sm text-muted">Sign in to see your solutions.</p>
        <Link href="/" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">← Go to sign in</Link>
      </div>
    );
  }

  const classSet = new Set(myClasses);
  const condSet = new Set(myConditions);
  const isRelevant = (p: SolutionPillar) =>
    p.exposures.some((e) => classSet.has(e)) || p.conditions.some((c) => condSet.has(c));

  const relevant = SOLUTION_PILLARS.filter(isRelevant);
  const rest = SOLUTION_PILLARS.filter((p) => !isRelevant(p));

  return (
    <div className="space-y-4">
      {/* Guardrail banner */}
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
        <div className="text-xs font-bold uppercase tracking-wide text-accent">Root-cause, whole-person education</div>
        <p className="mt-1.5 text-sm leading-relaxed text-ink">
          Operation Whole Health is about treating the root cause, not just masking symptoms. Below are
          general, well-studied areas you can explore to support your body alongside your medical care.
          This is education — not treatment, not a prescription, and never part of your VA claim.
        </p>
      </div>

      {(myClasses.length > 0 || myConditions.length > 0) && (
        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="text-sm font-semibold text-ink">Tailored to your record</div>
          <p className="mt-1 text-xs text-muted">
            Based on{" "}
            {myClasses.length > 0 && <span>{myClasses.map((c) => EXPOSURE_LABEL[c] ?? c).join(", ")}</span>}
            {myClasses.length > 0 && myConditions.length > 0 && " and "}
            {myConditions.length > 0 && <span>{myConditions.join(", ")}</span>}.
          </p>
        </div>
      )}

      {relevant.length > 0 && (
        <>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Most relevant to you</div>
          {relevant.map((p) => <PillarCard key={p.key} p={p} relevant />)}
        </>
      )}

      {rest.length > 0 && (
        <>
          <div className="pt-2 text-xs font-bold uppercase tracking-widest text-muted">More foundations of healing</div>
          {rest.map((p) => <PillarCard key={p.key} p={p} relevant={false} />)}
        </>
      )}

      <div className="rounded-xl border-2 border-brand bg-brand/5 px-5 py-4">
        <div className="font-semibold text-brand">A note on natural options</div>
        <p className="mt-1 text-sm leading-relaxed text-ink">
          Supplements, herbs, and protocols can interact with medications and conditions — including
          stressing the kidneys or liver, the very organs many exposures already burden. Always talk with
          a qualified clinician or practitioner before starting anything. If you&apos;re struggling, the
          Veterans Crisis Line is here 24/7 — dial <strong>988</strong>, then press <strong>1</strong>.
        </p>
      </div>
    </div>
  );
}
