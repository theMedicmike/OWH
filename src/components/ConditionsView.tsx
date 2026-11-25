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

  if (!loaded) return <p className="text-[0.9375rem] text-muted">Loading…</p>;
  if (!user) {
    return (
      <div className="card p-6">
        <p className="text-[0.9375rem] text-muted">Sign in to see your conditions.</p>
        <Link href="/" className="btn btn-primary mt-4">Go to sign in</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[0.9375rem] leading-relaxed text-muted">
        The conditions you live with: what they are, how your exposures may relate, and what to track.
        These are rarely isolated problems; they&apos;re often threaded together by one common
        denominator, the chronic inflammation toxic exposure leaves behind. Understanding the
        connection is the first step to addressing the root cause.
      </p>

      {conditions.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-[0.9375rem] text-muted">No conditions recorded yet.</p>
          <Link href="/health" className="btn btn-primary mt-4">
            Add your health
          </Link>
        </div>
      ) : (
        conditions.map((c, i) => {
          const edu = CONDITION_EDU[c.label];
          const basis = CONDITION_BASIS[c.label];
          const related = CONDITION_EXPOSURES[c.label] ?? [];
          return (
            <div key={i} className="card p-5">
              <h2 className="text-lg font-semibold tracking-tight text-ink">{c.label}</h2>
              {(basis || c.claim_status !== "none") && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {basis && (
                    <span className={`rounded-lg px-2.5 py-1 text-sm font-medium ${basis.presumptive ? "bg-success-soft text-success" : "bg-warn-soft text-ink"}`}>
                      {basis.tag}
                    </span>
                  )}
                  {c.claim_status !== "none" && <span className="text-sm text-muted">VA claim {c.claim_status}</span>}
                </div>
              )}

              {edu && <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">{edu.what}</p>}
              {edu && <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink">{edu.link}</p>}

              {CONDITION_CASCADE[c.label] && (
                <div className="mt-4 rounded-xl border border-line bg-canvas px-4 py-3">
                  <h3 className="text-[0.9375rem] font-semibold text-ink">Why it&apos;s connected</h3>
                  <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink">{CONDITION_CASCADE[c.label]}</p>
                </div>
              )}

              {related.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-[0.9375rem] font-semibold text-ink">Exposures commonly studied with this</h3>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {related.map((e) => {
                      const have = myClasses.has(e);
                      return (
                        <li key={e} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ${have ? "bg-success-soft font-medium text-success" : "bg-canvas text-ink"}`}>
                          {have && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                          )}
                          {EXPOSURE_LABEL[e] ?? e}
                          {have && <span className="sr-only">, on your record</span>}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {edu && (
                <div className="mt-4 rounded-xl border border-line bg-canvas p-4">
                  <h3 className="text-[0.9375rem] font-semibold text-ink">What to track</h3>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[0.9375rem] leading-relaxed text-ink marker:text-muted">
                    {edu.track.map((t, j) => (
                      <li key={j}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}

              {basis && <p className="mt-3 text-sm leading-relaxed text-muted">{basis.cite}</p>}

              <Link href="/solutions" className="btn btn-secondary mt-4">
                Explore root-cause and natural options
              </Link>
            </div>
          );
        })
      )}

      <p className="border-t border-line pt-4 text-sm leading-relaxed text-muted">
        General education from documented sources. Not a diagnosis, a treatment plan, or a claim
        determination. Work with your clinician and VSO. Veterans Crisis Line: dial 988, then press 1.
      </p>
    </div>
  );
}
