"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import AuthCard from "./AuthCard";
import ServiceTimeline, { type TimelineData } from "./ServiceTimeline";

// Show the artifact, don't describe it: this is what a finished record looks
// like, the first page a veteran hands their VSO. Sample data, clearly
// labeled. Exported so /welcome can show the same artifact without a second,
// driftable copy.
// 🔴 Every date here has to survive being read by a VSO, because this is a
// timeline and timelines are what they read. A coherent 23-year career:
// enlisted 1982, Lejeune early (inside the statutory window, Aug 1953 to Dec
// 1987), Balad late, retired 2005. Asthma onset 2012 sits after separation,
// which is what 38 U.S.C. §1120(b)(1) requires for the burn-pit presumptive
// and what the app's own onset logic enforces.
export const SAMPLE: TimelineData = {
  serviceStart: 1982,
  serviceEnd: 2005,
  tours: [
    { place: "Camp Lejeune", startYear: 1983, endYear: 1986, exposures: ["water_contamination"] },
    { place: "Joint Base Balad", startYear: 2004, endYear: 2005, exposures: ["burn_pit"] },
  ],
  conditions: [
    { label: "Asthma", onsetYear: 2012, linkedExposures: ["burn_pit"] },
  ],
};

// These four are the ACTUAL order a veteran works in, and that is the point:
// service, then health, then the map. If this list is ever reordered, the
// Dashboard's start-here card, the sidebar's numbered steps and Medic Mike's
// WHERE SOMEONE STARTS block have to move with it.
const POINTS = [
  { title: "Start with your service", body: "Branch, years, and your job. It is short, and everything else is built on it." },
  { title: "Say what you live with now", body: "The conditions you carry, and roughly when each one started." },
  { title: "Map where you served", body: "Every base, deployment, and war zone, and what the government already documents in that ground." },
  { title: "Build the proof", body: "Corroborate with the buddies who were there, and generate a cited packet for your clinician and VSO." },
];

// The four steps as dots on one line: the same spine the sidebar and the
// Dashboard use, so a veteran has seen the shape of the work before signing in.
function Steps({ onNavy = false }: { onNavy?: boolean }) {
  const dot = onNavy ? "border-white/60" : "border-brand/50";
  const line = onNavy ? "bg-white/20" : "bg-line";
  const title = onNavy ? "text-white" : "text-ink";
  const body = onNavy ? "text-white/70" : "text-muted";
  return (
    <ol className="space-y-5">
      {POINTS.map((p, i) => (
        <li key={p.title} className="relative pl-9">
          <span aria-hidden="true" className={`absolute left-0 top-0.5 h-5 w-5 rounded-full border-2 ${dot}`} />
          {i < POINTS.length - 1 && (
            <span aria-hidden="true" className={`absolute bottom-[-1.25rem] left-[9px] top-6 w-0.5 ${line}`} />
          )}
          <div className={`text-[15px] font-semibold leading-snug ${title}`}>
            <span className="sr-only">Step {i + 1}: </span>
            {p.title}
          </div>
          <div className={`mt-0.5 text-[15px] leading-relaxed ${body}`}>{p.body}</div>
        </li>
      ))}
    </ol>
  );
}

function SampleRecord({ animate = false }: { animate?: boolean }) {
  return (
    <div className="rounded-2xl bg-white p-4 sm:p-5">
      <div className={animate ? "reveal" : ""}>
        <ServiceTimeline data={SAMPLE} compact />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        A sample record. Page one of what you hand your VSO.
      </p>
    </div>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 flex-none text-success" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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
    <main className="min-h-screen lg:grid lg:grid-cols-[1.1fr_1fr]">
      {/* The statement, and the record itself (desktop) */}
      <section className="on-navy relative hidden flex-col justify-between bg-brand px-12 py-10 text-white lg:flex xl:px-16">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/owh-logo.png" alt="Operation Whole Health" className="h-12 w-auto object-contain" />
        </div>

        <div className="my-10 max-w-xl">
          <h1 className="display text-[2.75rem] leading-[1.08] text-white xl:text-[3.25rem]">
            Connect the dots between your service and your health.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-white/75">
            A living record of where you served, what you were around, and what you live with now, so the VA
            can finally see the connection.
          </p>
          <div className="mt-9 max-w-md">
            <Steps onNavy />
          </div>
        </div>

        <div className="max-w-xl space-y-4">
          <SampleRecord animate />
          <p className="text-sm leading-relaxed text-white/60">
            Free, and always free. This is not the VA. Run by Operation Whole Health, a 501(c)(3) nonprofit,
            founded by a civilian and built alongside veterans. Nothing here is sold. A record: never a
            diagnosis, and never a rating.
          </p>
        </div>
      </section>

      {/* Sign in */}
      <section className="flex min-h-screen flex-col items-center justify-center px-5 py-10 sm:px-8 sm:py-14">
        <div className="w-full max-w-[26rem]">
          <div className="mb-7 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/owh-logo.png" alt="Operation Whole Health" className="h-11 w-auto object-contain" />
            <h1 className="display mt-6 text-[2rem] leading-[1.1] text-ink">
              Connect the dots between your service and your health.
            </h1>
            {/* 🔴 THE FIVE-SECOND TEST, on the screen most veterans arrive on.
                One straight sentence, up front, that this is free and is not
                the VA. The 75-year-old Navy veteran on the September panel said
                that is what would get him to file after fifty years. */}
            <p className="mt-4 text-[17px] font-semibold leading-snug text-ink">
              Free, and always free. This is not the VA. Nothing here is sold.
            </p>
          </div>

          <AuthCard />

          <p className="mt-5 flex items-start gap-2 text-sm leading-relaxed text-muted">
            <LockIcon />
            <span>
              Private, and yours. Run by Operation Whole Health, a 501(c)(3) nonprofit founded by a civilian and
              built alongside veterans. Your record is never sold.{" "}
              <Link href="/trust" className="font-semibold text-brand hover:underline">What this is</Link>
            </span>
          </p>

          {/* The steps and the artifact, below the form on a phone. Showing what
              you walk away with beats describing it. Same SAMPLE as the desktop
              panel and /welcome, so there is no second copy to drift. */}
          <div className="mt-9 space-y-6 lg:hidden">
            <Steps />
            <div className="card p-1">
              <SampleRecord />
            </div>
          </div>

          <p className="mt-8 text-center text-sm leading-relaxed text-muted">
            If you are struggling, the Veterans Crisis Line is here 24/7: dial 988, then press 1.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-faint">
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
