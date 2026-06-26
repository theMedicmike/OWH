"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import VerifyCard from "./VerifyCard";

type Counts = { checkins: number; exposures: number; conditions: number; corroborations: number };

const QUICK = [
  { href: "/intake", title: "Continue your timeline", body: "Talk it through with your guide.", d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { href: "/map", title: "Open the map", body: "Drop a pin where you served.", d: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" },
  { href: "/report", title: "Your report", body: "One page for your clinician or VSO.", d: "M14 3v5h5M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-5-5z" },
  { href: "/buddies", title: "Find battle buddies", body: "Corroborate with who was there.", d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" },
];

export default function DashboardView() {
  const { user, supabase } = useAuth();
  const [name, setName] = useState<string | null>(null);
  const [counts, setCounts] = useState<Counts>({ checkins: 0, exposures: 0, conditions: 0, corroborations: 0 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const m = await supabase.from("members").select("display_name").eq("auth_id", user.id).maybeSingle();
      if (!m.data) await supabase.from("members").insert({ auth_id: user.id });
      setName((m.data?.display_name as string) ?? null);

      const [ci, ex, co, exprows] = await Promise.all([
        supabase.from("check_ins").select("id", { count: "exact", head: true }),
        supabase.from("exposures").select("id", { count: "exact", head: true }),
        supabase.from("conditions").select("id", { count: "exact", head: true }),
        supabase.from("exposures").select("id"),
      ]);
      let corr = 0;
      const ids = (exprows.data ?? []).map((e: { id: string }) => e.id);
      if (ids.length) {
        const c = await supabase.from("corroborations").select("id", { count: "exact", head: true }).in("exposure_id", ids);
        corr = c.count ?? 0;
      }
      setCounts({ checkins: ci.count ?? 0, exposures: ex.count ?? 0, conditions: co.count ?? 0, corroborations: corr });
      setLoaded(true);
    })();
  }, [user, supabase]);

  const greeting = name || user?.email?.split("@")[0] || "there";
  const stats = [
    { label: "Locations logged", value: counts.checkins },
    { label: "Exposures documented", value: counts.exposures },
    { label: "Health conditions", value: counts.conditions },
    { label: "Buddy corroborations", value: counts.corroborations },
  ];

  const nextStep =
    counts.checkins === 0
      ? { text: "Start by logging where you served — open the guided intake or the map.", href: "/intake", cta: "Begin your timeline" }
      : counts.conditions === 0
      ? { text: "Add the health conditions you live with so we can connect them to your exposures.", href: "/health", cta: "Add your health" }
      : { text: "Your record is taking shape. Generate the one-page report to bring to your clinician or VSO.", href: "/report", cta: "Open your report" };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-ink">Welcome back, {greeting}.</h2>
        <p className="mt-1 text-sm text-muted">Here&apos;s your record at a glance.</p>
      </div>

      <VerifyCard />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-surface p-4">
            <div className="text-2xl font-bold text-ink">{loaded ? s.value : "—"}</div>
            <div className="mt-0.5 text-xs leading-snug text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-brand/20 bg-brand/5 p-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-brand">Your next step</div>
        <p className="mt-1.5 text-sm text-ink">{nextStep.text}</p>
        <Link
          href={nextStep.href}
          className="mt-3 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-600"
        >
          {nextStep.cta}
        </Link>
      </div>

      <div>
        <div className="mb-2 text-sm font-semibold text-ink">Jump back in</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {QUICK.map((q) => (
            <Link key={q.href} href={q.href} className="group flex items-start gap-3 rounded-xl border border-line bg-surface p-4 transition hover:border-brand/40 hover:shadow-sm">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-brand/10 text-brand">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
                  <path d={q.d} />
                </svg>
              </span>
              <div>
                <div className="text-sm font-semibold text-ink">{q.title}</div>
                <div className="text-xs text-muted">{q.body}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
