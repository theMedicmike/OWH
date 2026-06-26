"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { EXPOSURE_LABEL, CONDITION_EDU, CONDITION_CASCADE, CONDITION_EXPOSURES } from "@/lib/education";
import { CONDITION_BASIS } from "@/lib/citations";

type Cond = { label: string; claim_status: string };

export default function ConditionsView() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [conditions, setConditions] = useState<Cond[]>([]);
  const [myClasses, setMyClasses] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user ?? null);
      if (!data.user) { setLoaded(true); return; }
      const [{ data: cond }, { data: exp }] = await Promise.all([
        supabase.from("conditions").select("label, claim_status").order("created_at"),
        supabase.from("exposures").select("exposure_class"),
      ]);
      setConditions((cond ?? []) as Cond[]);
      setMyClasses(new Set(((exp ?? []) as { exposure_class: string }[]).map((e) => e.exposure_class)));
      setLoaded(true);
    });
  }, [supabase]);

  if (!loaded) return <p className="text-sm text-muted">Loading…</p>;
  if (!user) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6">
        <p className="text-sm text-muted">Sign in to see your conditions.</p>
        <Link href="/" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">← Go to sign in</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        The conditions you live with — what they are, how your exposures may relate, and what to track.
        These are rarely isolated problems; they&apos;re often threaded together by one common
        denominator — the chronic inflammation toxic exposure leaves behind. Understanding the
        connection is the first step to addressing the root cause.
      </p>

      {conditions.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-6 text-center">
          <p className="text-sm text-muted">No conditions recorded yet.</p>
          <Link href="/health" className="mt-3 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-600">
            Add your health
          </Link>
        </div>
      ) : (
        conditions.map((c, i) => {
          const edu = CONDITION_EDU[c.label];
          const basis = CONDITION_BASIS[c.label];
          const related = CONDITION_EXPOSURES[c.label] ?? [];
          return (
            <div key={i} className="overflow-hidden rounded-xl border border-line bg-surface">
              <div className="h-1 bg-accent" />
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-ink">{c.label}</h3>
                  {basis && (
                    <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${basis.presumptive ? "bg-success-soft text-success" : "bg-warn-soft text-warn"}`}>
                      {basis.tag}
                    </span>
                  )}
                  {c.claim_status !== "none" && <span className="text-xs text-muted">VA claim {c.claim_status}</span>}
                </div>

                {edu && <p className="mt-2 text-sm leading-relaxed text-muted">{edu.what}</p>}
                {edu && <p className="mt-2 text-sm leading-relaxed text-ink">{edu.link}</p>}

                {CONDITION_CASCADE[c.label] && (
                  <div className="mt-3 rounded-lg border-l-2 border-accent bg-accent/5 px-3 py-2.5">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-accent">Why it&apos;s connected</div>
                    <p className="mt-1 text-sm leading-relaxed text-ink">{CONDITION_CASCADE[c.label]}</p>
                  </div>
                )}

                {related.length > 0 && (
                  <div className="mt-3">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-muted">Exposures commonly studied with this</div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {related.map((e) => {
                        const have = myClasses.has(e);
                        return (
                          <span key={e} className={`rounded-md px-2 py-0.5 text-xs ${have ? "bg-success-soft font-medium text-success" : "bg-canvas text-muted"}`}>
                            {EXPOSURE_LABEL[e] ?? e}{have ? " ✓" : ""}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {edu && (
                  <div className="mt-4 rounded-lg border border-line bg-canvas p-3">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-accent">What to track</div>
                    <ul className="mt-1.5 space-y-1">
                      {edu.track.map((t, j) => (
                        <li key={j} className="flex gap-2 text-xs leading-relaxed text-ink"><span className="text-accent">•</span>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {basis && <p className="mt-3 text-[11px] leading-relaxed text-faint">{basis.cite}</p>}

                <Link href="/solutions" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
                  Explore root-cause and natural options →
                </Link>
              </div>
            </div>
          );
        })
      )}

      <p className="border-t border-line pt-4 text-xs leading-relaxed text-faint">
        General education from documented sources — not a diagnosis, a treatment plan, or a claim
        determination. Work with your clinician and VSO. Veterans Crisis Line: dial 988, then press 1.
      </p>
    </div>
  );
}
