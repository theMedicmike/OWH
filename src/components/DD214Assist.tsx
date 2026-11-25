"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";

// ─────────────────────────────────────────────────────────────────────────────
// DD-214 GUIDED TRANSCRIPTION — the council's answer to "stop retyping."
//
// The AI-extraction version is GATED (a DD-214 carries the SSN in Box 3 on
// every copy; sending it to any external API contradicts the app's shipped
// privacy promise). This ships instead: the document renders LOCALLY beside
// the fields, with a callout telling the veteran exactly which block holds
// each answer. Zero egress — the signed URL is the same private path the
// packet already uses; no AI, no API, nothing leaves.
// ─────────────────────────────────────────────────────────────────────────────

const BLOCKS = [
  { field: "Branch", block: "Block 2", hint: "Department, Component and Branch" },
  { field: "MOS / job code", block: "Block 11", hint: "Primary Specialty. The code at the start, e.g. 11B" },
  { field: "Service start", block: "Block 12a", hint: "Date Entered AD This Period" },
  { field: "Service end", block: "Block 12b", hint: "Separation Date This Period" },
  { field: "Unit", block: "Block 8a", hint: "Last Duty Assignment and Major Command" },
];

export default function DD214Assist() {
  const { user, supabase } = useAuth();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [isImage, setIsImage] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!user || !open || url) return;
    (async () => {
      const files = await supabase.storage.from("records").list(user.id, { limit: 100 });
      const real = (files.data ?? []).filter((f) => f.name !== ".emptyFolderPlaceholder");
      setChecked(true);
      if (!real.length) return;
      // Newest upload is almost always the DD-214 they just added.
      real.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
      const f = real[0];
      const { data: signed } = await supabase.storage.from("records").createSignedUrl(`${user.id}/${f.name}`, 3600);
      if (signed?.signedUrl) {
        setUrl(signed.signedUrl);
        setIsImage(/\.(jpe?g|png|webp|gif)$/i.test(f.name));
      }
    })();
  }, [user, open, url, supabase]);

  return (
    <section className="card p-5 sm:p-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="-m-2 flex min-h-12 w-[calc(100%+1rem)] items-center justify-between gap-3 rounded-xl p-2 text-left hover:bg-canvas"
      >
        <span>
          <span className="block text-lg font-semibold tracking-tight text-ink">Read it off your DD-214</span>
          <span className="mt-1 block text-[0.9375rem] leading-relaxed text-muted">
            Your DD-214 never leaves this app. No AI reads it and nothing is sent anywhere. We point to the
            block that has each answer; you read it, you type it, you own it.
          </span>
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className={`h-5 w-5 flex-none text-muted transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
      </button>

      {open && (
        <div className="mt-4 gap-4 lg:flex lg:items-start">
          <div className="min-w-0 flex-1">
            {url ? (
              isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="Your uploaded DD-214" className="max-h-[480px] w-full rounded-lg border border-line object-contain" />
              ) : (
                <object data={url} type="application/pdf" className="h-[480px] w-full rounded-lg border border-line">
                  <p className="p-4 text-[0.9375rem] text-muted">
                    Your browser can&apos;t show the PDF here.{" "}
                    <a href={url} target="_blank" rel="noreferrer" className="font-semibold text-brand hover:underline">open it in a new tab</a>{" "}
                    and keep this window beside it.
                  </p>
                </object>
              )
            ) : (
              <p className="rounded-xl border border-line bg-canvas p-4 text-[0.9375rem] text-muted">
                {checked
                  ? "No document found. Upload your DD-214 in Your records first, then come back here."
                  : "Loading your newest uploaded document…"}
              </p>
            )}
            {url && (
              <a href={url} target="_blank" rel="noreferrer" className="btn btn-secondary mt-2">
                Open full size in a new tab (easier to zoom)
              </a>
            )}
          </div>

          <div className="mt-4 lg:mt-0 lg:w-[300px] lg:flex-none">
            <h3 className="text-[0.9375rem] font-semibold text-ink">Where each answer lives</h3>
            <ul className="mt-2 space-y-2">
              {BLOCKS.map((b) => (
                <li key={b.field} className="rounded-xl border border-line bg-canvas px-3.5 py-2.5">
                  <span className="flex items-baseline justify-between gap-2 text-[0.9375rem]">
                    <span className="font-semibold text-ink">{b.field}</span>
                    <span className="flex-none font-medium text-muted">{b.block}</span>
                  </span>
                  <span className="mt-0.5 block text-sm leading-snug text-muted">{b.hint}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Older DD-214s number these blocks differently, so look for the block title. Breaks in service?
              Use your most recent DD-214 and tell your VSO about earlier periods. Type what you read into
              the profile fields above. They save to your record.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
