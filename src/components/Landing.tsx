"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import AuthCard from "./AuthCard";

const POINTS = [
  { title: "Map where you served", body: "Drop a pin on every base, deployment, and war zone — your whole timeline, from day one." },
  { title: "Document what you were exposed to", body: "Burn pits, heavy metals, solvents, PFAS, radiation, and more — tagged to the place and year." },
  { title: "Build the proof", body: "Corroborate with the buddies who were there, and generate a one-page record for your clinician and VSO." },
];

export default function Landing() {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && user) router.replace("/dashboard");
  }, [ready, user, router]);

  return (
    <main className="min-h-screen w-full">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-10 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-0">
        {/* Left: mission */}
        <section className="lg:py-16">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-brand-foreground">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
            </span>
            <span className="text-sm font-semibold tracking-tight text-ink">Connecting the Dots of Service</span>
          </div>

          <h1 className="mt-8 text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl">
            Prove where you served
            <br />
            made you sick.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
            A living record for veterans and military first responders. Map your service, document your exposures,
            and build the evidence that connects them to your health — so the VA can finally see it.
          </p>

          <ul className="mt-8 space-y-4">
            {POINTS.map((p, i) => (
              <li key={p.title} className="flex gap-3.5">
                <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
                  {i + 1}
                </span>
                <div>
                  <div className="text-sm font-semibold text-ink">{p.title}</div>
                  <div className="text-sm leading-relaxed text-muted">{p.body}</div>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-xs text-faint">
            Built by Operation Whole Health, a veteran-founded 501(c)(3). An estimate and a record — not a diagnosis.
          </p>
        </section>

        {/* Right: auth */}
        <section className="lg:py-16">
          <div className="mx-auto w-full max-w-sm">
            <h2 className="mb-1 text-lg font-semibold text-ink">Start your record</h2>
            <p className="mb-4 text-sm text-muted">It takes a minute, and it&apos;s yours forever.</p>
            <AuthCard />
          </div>
        </section>
      </div>
    </main>
  );
}
