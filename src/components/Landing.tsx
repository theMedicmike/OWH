"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import AuthCard from "./AuthCard";
import { ServiceRibbon } from "./Patriotic";
import ServiceTimeline, { type TimelineData } from "./ServiceTimeline";

// Show the artifact, don't describe it: this is what a finished record looks
// like — the first page a veteran hands their VSO. Sample data, clearly
// labeled. Exported so /welcome can show the same artifact without a second,
// driftable copy.
export const SAMPLE: TimelineData = {
  serviceStart: 2003,
  serviceEnd: 2011,
  tours: [
    { place: "Joint Base Balad", startYear: 2004, endYear: 2005, exposures: ["burn_pit"] },
    // Inside the statutory Camp Lejeune window (Aug 1953 – Dec 1987). The
    // sample packet must never demonstrate a claim outside its own scope.
    { place: "Camp Lejeune", startYear: 1982, endYear: 1985, exposures: ["water_contamination"] },
  ],
  conditions: [
    { label: "Asthma", onsetYear: 2012, linkedExposures: ["burn_pit"] },
  ],
};

const POINTS = [
  { title: "Map where you served", body: "Every base, deployment, and war zone — your whole timeline, from day one." },
  { title: "Document what you were exposed to", body: "Burn pits, heavy metals, solvents, PFAS, radiation — tagged to the place and year." },
  { title: "Build the proof", body: "Corroborate with the buddies who were there, and generate a cited packet for your clinician and VSO." },
];

function PinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export default function Landing() {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && user) router.replace("/dashboard");
  }, [ready, user, router]);

  return (
    <main className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Brand panel (desktop) */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-brand p-12 text-brand-foreground lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/5" />

        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/owh-logo.png" alt="Operation Whole Health" className="h-16 w-auto object-contain" />
          <ServiceRibbon className="mt-5 w-40 rounded-full opacity-90" />
        </div>

        <div className="relative">
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight">
            Finally connect the dots between your service and your health.
          </h1>
          <div className="mt-4 h-1 w-12 rounded bg-accent" />
          <p className="mt-5 max-w-md leading-relaxed text-white/75">
            A living record for veterans and military first responders — so the VA can finally see the connection
            between your service and your health.
          </p>
          <ul className="mt-8 space-y-4">
            {POINTS.map((p, i) => (
              <li key={p.title} className="flex gap-3.5">
                <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white/15 text-xs font-semibold">
                  {i + 1}
                </span>
                <div>
                  <div className="text-sm font-semibold">{p.title}</div>
                  <div className="text-sm leading-relaxed text-white/70">{p.body}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative space-y-4">
          {/* The artifact itself — the strongest pitch the app has */}
          <div className="rounded-xl bg-white p-4 shadow-lg">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-accent">Sample record</span>
              <span className="text-[11px] text-faint">Page one of what you hand your VSO</span>
            </div>
            <div className="mt-2">
              <ServiceTimeline data={SAMPLE} compact />
            </div>
          </div>
          <div className="text-xs text-white/55">
            Free. No products. Nothing sold. Operation Whole Health, a Patriot-founded 501(c)(3).
            A record and an estimate — never a diagnosis.
          </div>
        </div>
      </section>

      {/* Auth side */}
      <section className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-6 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/owh-logo.png" alt="Operation Whole Health" className="h-14 w-auto object-contain" />
            <ServiceRibbon className="mt-4 w-32 rounded-full opacity-90" />
            <h1 className="mt-5 text-2xl font-bold leading-tight tracking-tight text-ink">
              Finally connect the dots between your service and your health.
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              A free, private tool for veterans and military first responders. Map where you served,
              see what you were likely exposed to, and build the documented proof that connects it to
              your health — so you can build the strongest possible case.
            </p>
            <ul className="mt-4 space-y-3">
              {POINTS.map((p, i) => (
                <li key={p.title} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-ink">{p.title}</div>
                    <div className="text-xs leading-relaxed text-muted">{p.body}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <h2 className="text-xl font-semibold tracking-tight text-ink">Welcome</h2>
          <p className="mt-1 text-sm text-muted">Sign in, or create your free account to start your record.</p>

          <div className="mt-3 flex items-start gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-xs leading-relaxed text-muted">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 flex-none text-success">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Free and private, built for veterans by a Patriot-founded 501(c)(3). Your record is yours — never sold.</span>
          </div>

          <div className="mt-4">
            <AuthCard />
          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-faint">
            If you&apos;re struggling, the Veterans Crisis Line is here 24/7 — dial 988, then press 1.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-faint">
            <Link href="/trust" className="hover:text-brand hover:underline">What this is</Link>
            <Link href="/privacy" className="hover:text-brand hover:underline">Privacy</Link>
            <Link href="/terms" className="hover:text-brand hover:underline">Terms</Link>
            <Link href="/support" className="hover:text-brand hover:underline">Support</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
