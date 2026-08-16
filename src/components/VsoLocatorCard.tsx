"use client";

import { useState } from "react";
import Link from "next/link";
import { VSO_LOCATOR_URL } from "@/lib/nextaction";
import type { VsoSearch, VsoResult } from "@/lib/vsoDirectory";

const card = "rounded-xl border border-line bg-surface p-5";

// FIND A VSO — now an actual search, not a link to someone else's search.
//
// This page used to explain what a VSO is and then hand the veteran off to
// VA's website, with a note in the code saying a stale copy of thousands of
// listings would be worse than no directory. That reasoning was right, and
// this is the answer to it rather than a reversal of it: the listings are
// regenerated from VA's OWN published accreditation lists, the page prints
// the date they were taken, and every result still points at VA's live
// search to confirm. A veteran is never told this is current — he is shown
// how fresh it is and where the authoritative copy lives.
//
// What this deliberately does NOT do: rank by quality, rate, review, or
// recommend anyone. Free representatives sort first because they are free —
// that is a fact about cost, not a judgement — and the app states plainly
// that it has no relationship with any organization listed.

const KIND_LABEL: Record<VsoResult["kind"], string> = {
  vso: "Veterans Service Organization — free",
  agent: "Accredited claims agent — may charge a fee",
  attorney: "Accredited attorney — may charge a fee",
};

function prettyPhone(p: string): string {
  const d = p.replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return p;
}

export default function VsoLocatorCard() {
  const [zip, setZip] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<VsoSearch | null>(null);
  const [err, setErr] = useState("");

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!/^\d{5}$/.test(zip.trim())) {
      setErr("Enter a five-digit ZIP code.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(`/api/vso-search?zip=${encodeURIComponent(zip.trim())}`);
      setRes((await r.json()) as VsoSearch);
    } catch {
      setErr("Couldn't run that search just now. VA's own search below always works.");
    } finally {
      setBusy(false);
    }
  }

  const freeCount = res?.status === "ok" ? res.results.filter((r) => r.kind === "vso").length : 0;

  return (
    <div className="space-y-4">
      <div className={`${card} surface-raise border-brand/30 bg-brand/5`}>
        <div className="text-sm font-semibold text-ink">Find accredited help near you</div>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Enter your ZIP code. Every Veterans Service Organization listed helps you for{" "}
          <strong className="text-ink">free</strong> — that is what accreditation means, and it never changes.
        </p>

        <form onSubmit={search} className="mt-4 flex flex-wrap items-center gap-2">
          <label htmlFor="vso-zip" className="sr-only">ZIP code</label>
          <input
            id="vso-zip"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
            placeholder="ZIP code"
            className="w-36 rounded-lg border border-line bg-white px-3 py-2.5 text-base text-ink placeholder:text-faint focus:border-brand focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy}
            className="press rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand-600 disabled:opacity-50"
          >
            {busy ? "Searching…" : "Search"}
          </button>
        </form>
        {err && <p className="mt-2 text-xs text-scarlet">{err}</p>}
      </div>

      {res?.status === "invalid" && (
        <p className="px-1 text-sm text-muted">That doesn&apos;t look like a ZIP code — try five digits.</p>
      )}

      {res?.status === "none" && (
        <div className={card}>
          <div className="text-sm font-semibold text-ink">Nothing listed around {res.zip}</div>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            That doesn&apos;t mean there&apos;s no help near you — this list is organized by where a
            representative is registered, which isn&apos;t always where they work. Use VA&apos;s live search
            below, or call your county veterans office.
          </p>
        </div>
      )}

      {res?.status === "ok" && (
        <div className={card}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="text-sm font-semibold text-ink">
              {res.scope === "exact"
                ? `Accredited in ${res.zip}`
                : `Accredited near ${res.zip}`}
            </div>
            <span className="text-xs text-muted">
              {freeCount > 0 && <>{freeCount} free {freeCount === 1 ? "option" : "options"} · </>}
              VA list of {res.generated}
            </span>
          </div>
          {res.scope === "nearby" && (
            <p className="mt-1 text-xs leading-relaxed text-faint">
              Nothing was registered in {res.zip} exactly, so this is the wider area around it.
            </p>
          )}

          <ul className="mt-3 space-y-2">
            {res.results.map((r, i) => (
              <li key={`${r.name}-${r.zip}-${i}`} className="rounded-lg border border-line bg-canvas p-3">
                <div className="text-sm font-semibold text-ink">{r.name}</div>
                <div className="mt-0.5 text-xs text-muted">
                  {KIND_LABEL[r.kind]}
                  {r.reps > 1 && <> · {r.reps} representatives here</>}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <span>{[r.city, r.state].filter(Boolean).join(", ")} {r.zip}</span>
                  {r.phone && (
                    <a href={`tel:${r.phone.replace(/\D/g, "")}`} className="font-semibold text-brand hover:underline">
                      {prettyPhone(r.phone)}
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-faint">
            From VA&apos;s published accreditation lists, taken {res.generated}. Accreditation can change — confirm
            on VA&apos;s live search before you rely on it. Operation Whole Health has no relationship with any
            organization here and receives nothing from any of them. Which representative you choose is your
            decision.
          </p>
        </div>
      )}

      <div className={card}>
        <div className="text-sm font-semibold text-ink">VA&apos;s own live search</div>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          The authoritative copy, updated continuously. Always worth checking before you call.
        </p>
        <a
          href={VSO_LOCATOR_URL}
          target="_blank"
          rel="noreferrer"
          className="press mt-3 inline-block rounded-lg border border-line px-4 py-2 text-sm font-semibold text-brand hover:bg-canvas"
        >
          Open VA&apos;s search →
        </a>
      </div>

      <div className={card}>
        <div className="text-sm font-semibold text-ink">Why bring your packet to a VSO</div>
        <ul className="mt-3 space-y-2.5 text-sm text-ink">
          <li><span className="font-semibold">Free, every time.</span> DAV, VFW, American Legion, your county veterans office, and hundreds of others are accredited to help you at no cost.</li>
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
