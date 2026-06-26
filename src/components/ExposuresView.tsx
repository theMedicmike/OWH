"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { EXPOSURE_LABEL, EXPOSURE_EDU } from "@/lib/education";
import { EXPOSURE_BASIS } from "@/lib/citations";

type Row = { place_name: string | null; exposures: { exposure_class: string }[] | null };

function ExposureCard({ cls, places }: { cls: string; places: string[] }) {
  const edu = EXPOSURE_EDU[cls];
  if (!edu) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="h-1 bg-accent" />
      <div className="p-5">
        <h3 className="text-base font-bold text-ink">{EXPOSURE_LABEL[cls] ?? cls}</h3>
        <p className="mt-1 text-sm font-medium text-muted">{edu.short}</p>

        {places.length > 0 && (
          <div className="mt-3 rounded-lg bg-success-soft px-3 py-2 text-xs text-success">
            You logged this at: {places.join(", ")}
          </div>
        )}

        <p className="mt-3 text-sm leading-relaxed text-muted">{edu.where}</p>
        {edu.body.map((p, i) => (
          <p key={i} className="mt-2 text-sm leading-relaxed text-muted">{p}</p>
        ))}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {edu.systems.map((s) => (
            <span key={s} className="rounded-md bg-brand/5 px-2 py-0.5 text-xs font-medium text-brand">{s}</span>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-line bg-canvas p-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-accent">Questions for your clinician</div>
          <ul className="mt-1.5 space-y-1">
            {edu.ask.map((q, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed text-ink">
                <span className="text-accent">•</span>{q}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-faint">{EXPOSURE_BASIS[cls]}</p>

        <Link href="/solutions" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
          See ways to support your body →
        </Link>
      </div>
    </div>
  );
}

export default function ExposuresView() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [places, setPlaces] = useState<Record<string, string[]>>({});
  const [loaded, setLoaded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user ?? null);
      if (!data.user) { setLoaded(true); return; }
      const { data: ci } = await supabase.from("check_ins").select("place_name, exposures(exposure_class)");
      const map: Record<string, string[]> = {};
      for (const r of (ci ?? []) as Row[]) {
        const place = r.place_name || "a logged location";
        for (const e of r.exposures ?? []) {
          (map[e.exposure_class] ??= []);
          if (!map[e.exposure_class].includes(place)) map[e.exposure_class].push(place);
        }
      }
      setPlaces(map);
      setLoaded(true);
    });
  }, [supabase]);

  if (!loaded) return <p className="text-sm text-muted">Loading…</p>;
  if (!user) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6">
        <p className="text-sm text-muted">Sign in to see your exposures.</p>
        <Link href="/" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">← Go to sign in</Link>
      </div>
    );
  }

  const mine = Object.keys(places);
  const others = Object.keys(EXPOSURE_EDU).filter((c) => !mine.includes(c));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        What you were likely exposed to, in plain language — what it is, how it reaches the body, and
        what to talk through with your clinician. Education, never a diagnosis.
      </p>

      {mine.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-6 text-center">
          <p className="text-sm text-muted">No exposures logged yet.</p>
          <Link href="/map" className="mt-3 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-600">
            Map where you served
          </Link>
        </div>
      ) : (
        <>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Your exposures</div>
          {mine.map((c) => <ExposureCard key={c} cls={c} places={places[c]} />)}
        </>
      )}

      {others.length > 0 && (
        <div className="pt-2">
          <button
            onClick={() => setShowAll((s) => !s)}
            className="flex w-full items-center justify-between rounded-xl border border-line bg-surface px-5 py-3 text-sm font-semibold text-ink hover:border-brand/40"
          >
            Learn about other exposures
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 text-muted transition-transform ${showAll ? "rotate-180" : ""}`}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {showAll && <div className="mt-4 space-y-4">{others.map((c) => <ExposureCard key={c} cls={c} places={[]} />)}</div>}
        </div>
      )}

      <p className="border-t border-line pt-4 text-xs leading-relaxed text-faint">
        This is general education drawn from documented sources (ATSDR, VA, PACT Act). It is not a
        diagnosis or medical advice. Veterans Crisis Line: dial 988, then press 1.
      </p>
    </div>
  );
}
