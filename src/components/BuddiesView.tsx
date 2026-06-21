"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

const EXPOSURE_LABEL: Record<string, string> = {
  burn_pit: "Burn pits",
  heavy_metal: "Heavy metals",
  chemical_solvent: "Chemical / solvent",
  water_contamination: "Water contamination",
  pesticide: "Pesticide / herbicide",
  asbestos_silica: "Asbestos / silica",
  nerve_agent: "Nerve agent",
  particulate: "Particulate / dust",
  radiation: "Radiation / depleted uranium",
  pfas_afff: "PFAS / AFFF",
  gulf_war_agent: "Gulf War agent",
};

type Candidate = { exposure_id: string; place: string | null; ev_year: number | null; exposure_class: string };

export default function BuddiesView() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [discoverable, setDiscoverable] = useState(false);
  const [consent, setConsent] = useState<Record<string, unknown>>({});
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());

  async function ensureMember(uid: string) {
    const { data: existing } = await supabase.from("members").select("id, consent").eq("auth_id", uid).maybeSingle();
    if (existing) return existing as { id: string; consent: Record<string, unknown> };
    const { data: created } = await supabase.from("members").insert({ auth_id: uid }).select("id, consent").single();
    return created as { id: string; consent: Record<string, unknown> };
  }

  async function loadCounts() {
    const { data: exps } = await supabase.from("exposures").select("id");
    const ids = (exps ?? []).map((e: { id: string }) => e.id);
    if (ids.length === 0) {
      setConfirmedCount(0);
      return;
    }
    const { count } = await supabase
      .from("corroborations")
      .select("id", { count: "exact", head: true })
      .in("exposure_id", ids);
    setConfirmedCount(count ?? 0);
  }

  async function loadCandidates() {
    const { data } = await supabase.rpc("find_corroboration_candidates");
    setCandidates((data ?? []) as Candidate[]);
  }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user ?? null);
      setReady(true);
      if (!data.user) return;
      const m = await ensureMember(data.user.id);
      const c = (m?.consent ?? {}) as Record<string, unknown>;
      setConsent(c);
      setDiscoverable(Boolean(c.corroborate));
      await Promise.all([loadCandidates(), loadCounts()]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function toggleDiscoverable(val: boolean) {
    if (!user) return;
    setDiscoverable(val);
    const next = { ...consent, corroborate: val };
    setConsent(next);
    await supabase.from("members").update({ consent: next }).eq("auth_id", user.id);
  }

  async function confirm(c: Candidate) {
    await supabase.rpc("corroborate", { p_exposure_id: c.exposure_id, p_witness_type: "same_location" });
    setConfirmed((prev) => new Set(prev).add(c.exposure_id));
    setCandidates((prev) => prev.filter((x) => x.exposure_id !== c.exposure_id));
  }

  if (!ready) return <p className="text-sm text-zinc-500">Loading…</p>;
  if (!user) {
    return (
      <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">Sign in on the map to find the people you served with.</p>
        <Link href="/" className="mt-3 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400">← Go to the map</Link>
      </div>
    );
  }

  const card = "rounded-xl border border-zinc-200 p-5 dark:border-zinc-800";

  return (
    <div className="space-y-4">
      <div className={card}>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" checked={discoverable} onChange={(e) => toggleDiscoverable(e.target.checked)} className="mt-0.5" />
          <span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">Let others who served where I did corroborate my exposures</span>
            <span className="mt-0.5 block text-xs text-zinc-500">
              Only your place, time, and exposure type are shared for matching, never your name or health details. You can turn this off anytime.
            </span>
          </span>
        </label>
      </div>

      <div className={card}>
        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Veterans who served where you did</div>
        <div className="mt-1 text-xs text-zinc-500">
          When someone logged the same exposure near the same place and time, you can confirm you saw it too. That raises the strength of their record, and yours.
        </div>

        {candidates.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            No overlaps yet. As more veterans log their service, the ones who were where you were will appear here.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {candidates.map((c) => (
              <li key={c.exposure_id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-100 p-3 dark:border-zinc-800">
                <span className="text-sm">
                  A veteran logged{" "}
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {EXPOSURE_LABEL[c.exposure_class] ?? c.exposure_class}
                  </span>{" "}
                  near <span className="font-medium">{c.place || "your location"}</span>
                  {c.ev_year ? <span className="text-zinc-500"> in {c.ev_year}</span> : null}
                </span>
                <button onClick={() => confirm(c)} className="rounded-md bg-zinc-900 px-3 py-1 text-xs text-white hover:opacity-90 dark:bg-white dark:text-zinc-900">
                  I was there too
                </button>
              </li>
            ))}
          </ul>
        )}
        {confirmed.size > 0 && (
          <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">You corroborated {confirmed.size} exposure(s). Thank you.</p>
        )}
      </div>

      <div className={card}>
        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Your record</div>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          {confirmedCount > 0
            ? `${confirmedCount} corroboration${confirmedCount === 1 ? "" : "s"} on your exposures from others who were there.`
            : "No corroborations on your record yet. Turn on discoverability above so battle buddies can confirm what you logged."}
        </p>
      </div>

      <p className="px-1 text-xs leading-relaxed text-zinc-400">
        Confirm only what you actually witnessed. Honest corroboration is what makes this record something the VA and
        researchers can trust. Named buddy statements come later, with explicit consent.
      </p>
    </div>
  );
}
