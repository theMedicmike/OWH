"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import AuthCard from "./AuthCard";
import type { TimelineData } from "./ServiceTimeline";
import { SheetFrame } from "./firstpage/FirstPageSheet";
import { EXAMPLE_SHEET } from "@/lib/firstPage";

// The timeline sample /welcome still shows. Kept here so there is one copy.
// 🔴 Every date has to survive being read by a VSO: a coherent 23-year career,
// Lejeune early (inside the statutory window, Aug 1953 to Dec 1987), Balad
// late, retired 2005, asthma onset 2012 after separation, as 38 U.S.C.
// §1120(b)(1) requires for the burn-pit presumptive.
export const SAMPLE: TimelineData = {
  serviceStart: 1982,
  serviceEnd: 2005,
  tours: [
    { place: "Camp Lejeune", startYear: 1983, endYear: 1986, exposures: ["water_contamination"] },
    { place: "Joint Base Balad", startYear: 2004, endYear: 2005, exposures: ["burn_pit"] },
  ],
  conditions: [{ label: "Asthma", onsetYear: 2012, linkedExposures: ["burn_pit"] }],
};

// The mark: three dots on one line, the last one red. The same idea as the
// chain on the page.
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 text-[0.9375rem] font-semibold text-ink ${className}`}>
      <svg viewBox="0 0 26 26" className="h-[1.625rem] w-[1.625rem]" aria-hidden="true">
        <path d="M5 19 L13 8 L21 17" fill="none" stroke="#16314f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="5" cy="19" r="3.4" fill="#16314f" />
        <circle cx="13" cy="8" r="3.4" fill="#16314f" />
        <circle cx="21" cy="17" r="3.4" fill="#b22234" />
      </svg>
      Connecting the Dots
    </span>
  );
}

export function FlagStripe() {
  return (
    <div
      aria-hidden="true"
      className="h-1.5 w-full"
      style={{ background: "linear-gradient(90deg, #16314f 0 50%, #ffffff 50% 75%, #b22234 75% 100%)" }}
    />
  );
}

// The sign-in page. The hero is the thing a veteran walks away with: his First
// Page, set like a real document. Signed out it is the EXAMPLE page, marked as
// such on the sheet itself. One motion on the screen: the page settles onto
// the desk as it loads (none under reduced motion).
export default function Landing() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<"intro" | "in" | "up">("intro");

  useEffect(() => {
    if (ready && user) router.replace("/dashboard");
  }, [ready, user, router]);

  return (
    <main className="fp-desk min-h-screen">
      <FlagStripe />
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <header className="flex items-center justify-between gap-4 py-5">
          <BrandMark />
          <nav className="flex items-center gap-1 text-[0.9375rem] text-muted sm:gap-4" aria-label="About">
            <Link href="/help" className="hidden min-h-11 items-center px-2 hover:text-brand sm:inline-flex">How it works</Link>
            <Link href="/trust" className="hidden min-h-11 items-center px-2 hover:text-brand sm:inline-flex">What this is</Link>
            <a href="tel:988" className="inline-flex min-h-11 items-center px-2 hover:text-brand">Crisis line</a>
          </nav>
        </header>

        <div className="grid items-center gap-2 pb-10 lg:grid-cols-[minmax(0,1fr)_25.5rem] lg:gap-14 lg:pb-16 lg:pt-2">
          {/* The page. Whole on a wide screen, the top of it on a phone. */}
          <div className="hidden py-6 lg:block">
            <SheetFrame sheet={EXAMPLE_SHEET} maxScale={1.1} tilt className="mx-auto max-w-[33rem]" />
          </div>
          <div className="relative -mx-5 overflow-hidden pt-3 sm:-mx-8 lg:hidden">
            <SheetFrame sheet={EXAMPLE_SHEET} maxScale={0.6} clip={236} tilt />
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-[#f7f8fa]" />
          </div>

          <section className="card card-raise rounded-[1.375rem] p-7 sm:p-9" aria-live="polite">
            {view === "intro" ? (
              <>
                <h1 className="display text-[1.875rem] leading-[1.08] text-ink [text-wrap:balance] sm:text-[2.375rem] sm:leading-[1.06]">
                  What happened to you, on one page.
                </h1>
                <p className="mt-3.5 text-[0.9375rem] leading-relaxed text-muted">
                  Where you served, what you were around, what changed, and the line between them. Print it and
                  hand it over at every visit. Built for the ones who never got asked.
                </p>
                <div className="mt-6 space-y-2.5">
                  <button type="button" onClick={() => setView("in")} className="btn btn-flag btn-lg w-full">
                    Sign in
                  </button>
                  <button type="button" onClick={() => setView("up")} className="btn btn-outline btn-lg w-full">
                    Start your page, free
                  </button>
                </div>
                <p className="mt-4 text-center text-sm leading-relaxed text-faint">
                  Free for veterans and families. Your page is yours. Delete it any time.
                </p>
              </>
            ) : (
              <AuthCard key={view} initialMode={view} bare onBack={() => setView("intro")} />
            )}
          </section>
        </div>

        <footer className="border-t border-line py-7 text-sm leading-relaxed text-muted">
          {/* 🔴 THE FIVE-SECOND TEST: free, not the VA, nothing sold, said
              plainly on the screen most veterans arrive on. */}
          <p className="max-w-3xl">
            Free, and always free. This is not the VA, and nothing here is sold. Run by Operation Whole Health, a
            501(c)(3) nonprofit founded by a civilian and built alongside veterans.{" "}
            <Link href="/trust" className="font-semibold text-brand hover:underline">What this is</Link>
          </p>
          <p className="mt-3 text-ink">
            In crisis? <a href="tel:988" className="font-semibold hover:underline">Dial 988, then press 1.</a>
          </p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-faint">
            <Link href="/privacy" className="hover:text-brand hover:underline">Privacy</Link>
            <Link href="/terms" className="hover:text-brand hover:underline">Terms</Link>
            <Link href="/support" className="hover:text-brand hover:underline">Support</Link>
            <Link href="/help" className="hover:text-brand hover:underline sm:hidden">How it works</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
