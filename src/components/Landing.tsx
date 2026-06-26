"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import AuthCard from "./AuthCard";
import { ServiceRibbon, Anniversary250 } from "./Patriotic";

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
            Prove where you served
            <br />
            made you sick.
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
          <Anniversary250 className="w-44" />
          <div className="text-xs text-white/55">
            Operation Whole Health, a Patriot-founded 501(c)(3). An estimate and a record — not a diagnosis.
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
          </div>

          <h2 className="text-xl font-semibold tracking-tight text-ink">Welcome</h2>
          <p className="mt-1 text-sm text-muted">Sign in, or create your free account to start your record.</p>

          <div className="mt-5">
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
