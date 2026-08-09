"use client";

import Link from "next/link";
import { VSO_LOCATOR_URL } from "@/lib/nextaction";

const card = "rounded-xl border border-line bg-surface p-5";

// A dedicated page for something that used to be one link buried in the claim
// packet. We don't host our own directory of VSO offices — VA's own search is
// the authoritative, kept-current source, and a stale copy of 3,000+ office
// listings would be worse than no directory at all. This page is the on-ramp:
// why a VSO, what to bring, then straight to VA's real search.
export default function VsoLocatorCard() {
  return (
    <div className="space-y-4">
      <div className={`${card} border-brand/30 bg-brand/5`}>
        <div className="text-sm font-semibold text-ink">Search VA&apos;s official directory</div>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Search by zip code, city, or county. Every VSO listed provides free claims help — no cost, ever.
        </p>
        <a
          href={VSO_LOCATOR_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand-600"
        >
          Open VA&apos;s VSO search →
        </a>
      </div>

      <div className={card}>
        <div className="text-sm font-semibold text-ink">Why bring your packet to a VSO</div>
        <ul className="mt-3 space-y-2.5 text-sm text-ink">
          <li><span className="font-semibold">Free, every time.</span> DAV, VFW, American Legion, and hundreds of other VSOs are congressionally chartered to help you at no cost.</li>
          <li><span className="font-semibold">Accredited.</span> VA-trained representatives know what evidence a rater actually needs to see.</li>
          <li><span className="font-semibold">They file it.</span> This app documents your record — a VSO is who actually submits the claim with you.</li>
        </ul>
      </div>

      <div className={card}>
        <div className="text-sm font-semibold text-ink">What to bring</div>
        <ul className="mt-3 space-y-1.5 text-sm text-muted">
          <li>Your claim packet from this app (the PDF or the printed page)</li>
          <li>Your DD-214 (discharge papers)</li>
          <li>Any medical records or diagnoses you already have</li>
        </ul>
        <Link href="/report" className="mt-3 inline-block text-xs font-semibold text-brand hover:underline">Build your packet →</Link>
      </div>
    </div>
  );
}
