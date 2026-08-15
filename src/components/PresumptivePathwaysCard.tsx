"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { scopeFor, type TourFacts } from "@/lib/presumptive";
import { PROGRAM_LABEL } from "@/lib/conditions";

// THE PRESUMPTIVE-PATHWAY FLAGGER — post-test council shortlist item. Every
// existing use of scopeFor() (conditionMatch.ts) only surfaces once a
// veteran has BOTH logged a tour AND added a matching condition. This card
// runs the same scope check against logged tours alone, so a veteran can
// see "your service may fall under X" before they've connected it to
// anything — which is often the more useful direction: it can be the reason
// they go add the condition in the first place.
//
// Same discipline as lib/presumptive.ts itself: a scoped QUESTION for a
// VSO, never a verdict. Out-of-scope programs are never shown — only
// in-scope and unknown, exactly like conditionMatch.ts's own filter.

const PROGRAMS = ["pact", "agent_orange", "lejeune", "gulf_war", "radiation"];

type CheckRow = { place_name: string | null; date_start: string | null };

export default function PresumptivePathwaysCard({ compact = false }: { compact?: boolean }) {
  const { user, supabase } = useAuth();
  const [tours, setTours] = useState<TourFacts[] | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("check_ins").select("place_name, date_start");
      const rows = (data ?? []) as CheckRow[];
      setTours(
        rows.map((r) => ({
          place: r.place_name ?? "",
          year: r.date_start ? new Date(r.date_start).getUTCFullYear() : null,
        })),
      );
    })();
  }, [user, supabase]);

  if (tours === null) return null;

  const scoped = PROGRAMS.map((p) => ({ p, s: scopeFor(p, tours) })).filter((x) => x.s.status !== "out-of-scope");
  const inScope = scoped.filter((x) => x.s.status === "in-scope");

  if (compact) {
    if (inScope.length === 0) return null;
    return (
      <Link href="/journey" className="block rounded-xl border border-line bg-surface p-5 transition hover:border-brand/40">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">
          {inScope.length} presumptive pathway{inScope.length === 1 ? "" : "s"} may apply
        </div>
        <div className="mt-1 text-sm font-semibold text-ink">Your logged service may fall inside a presumptive program — see which →</div>
      </Link>
    );
  }

  if (tours.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="text-sm font-semibold text-ink">Presumptive pathways</div>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Once you&apos;ve logged where and when you served, this checks it against the government&apos;s own
          presumptive programs — PACT Act, Agent Orange, Camp Lejeune, Gulf War, radiation — and flags anything
          your dates and locations may fall inside.
        </p>
        <Link href="/map" className="mt-2 inline-block text-xs font-semibold text-brand hover:underline">→ Map where you served</Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="text-sm font-semibold text-ink">Presumptive pathways</div>
      <p className="mt-1 text-xs leading-relaxed text-faint">
        Checked against your logged service. A presumption belongs to a veteran whose dates and locations meet a
        specific legal window — never a property of a condition alone. Only VA decides it; ask an accredited VSO
        to confirm.
      </p>
      {scoped.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Nothing you&apos;ve logged falls inside a presumptive program&apos;s dates and locations yet — which doesn&apos;t rule anything out. A VSO can check further.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {scoped.map((x) => (
            <li key={x.p} className={`rounded-lg border-l-2 px-3 py-2.5 ${x.s.status === "in-scope" ? "border-accent bg-accent/5" : "border-line bg-canvas"}`}>
              <div className="text-sm font-semibold text-ink">
                {PROGRAM_LABEL[x.p] ?? x.p}
                {x.s.status === "in-scope"
                  ? <span className="ml-2 rounded bg-success-soft px-1.5 py-0.5 text-[10px] font-medium text-success">may apply</span>
                  : <span className="ml-2 rounded bg-canvas px-1.5 py-0.5 text-[10px] font-medium text-muted">can&apos;t tell yet</span>}
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">{x.s.scope}</p>
              {x.s.note && <p className="mt-1 text-[12px] leading-relaxed text-ink/80">{x.s.note}</p>}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        <Link href="/presumptives" className="text-xs font-semibold text-brand hover:underline">→ Look up any era or location</Link>
        <Link href="/vso" className="text-xs font-semibold text-brand hover:underline">→ Find a VSO to confirm this</Link>
      </div>
    </div>
  );
}
