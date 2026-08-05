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
  { field: "MOS / job code", block: "Block 11", hint: "Primary Specialty — the code at the start, e.g. 11B" },
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
    <div className="rounded-xl border border-line bg-surface p-5">
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center justify-between gap-2 text-left">
        <span>
          <span className="text-sm font-semibold text-ink">Read it off your DD-214</span>
          <span className="mt-0.5 block text-xs text-muted">
            Your DD-214 never leaves this app — no AI reads it, nothing is sent anywhere. We point to the
            block that has each answer; you read it, you type it, you own it.
          </span>
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className={`h-4 w-4 flex-none text-muted transition-transform ${open ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6" /></svg>
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
                  <p className="p-4 text-sm text-muted">
                    Your browser can&apos;t show the PDF here —{" "}
                    <a href={url} target="_blank" rel="noreferrer" className="font-semibold text-brand hover:underline">open it in a new tab</a>{" "}
                    and keep this window beside it.
                  </p>
                </object>
              )
            ) : (
              <p className="rounded-lg border border-line bg-canvas p-4 text-sm text-muted">
                {checked
                  ? "No document found — upload your DD-214 below first, then come back here."
                  : "Loading your newest uploaded document…"}
              </p>
            )}
            {url && (
              <a href={url} target="_blank" rel="noreferrer" className="mt-1.5 inline-block text-xs font-semibold text-brand hover:underline">
                Open full size in a new tab (easier to zoom) →
              </a>
            )}
          </div>

          <div className="mt-4 lg:mt-0 lg:w-[300px] lg:flex-none">
            <div className="text-xs font-bold uppercase tracking-wide text-accent">Where each answer lives</div>
            <ul className="mt-2 space-y-2">
              {BLOCKS.map((b) => (
                <li key={b.field} className="rounded-lg border border-line bg-canvas px-3 py-2 text-sm">
                  <span className="font-semibold text-ink">{b.field}</span>
                  <span className="text-muted"> — {b.block}</span>
                  <span className="block text-[11px] leading-snug text-faint">{b.hint}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] leading-relaxed text-faint">
              Older DD-214s number these blocks differently — look for the block title. Breaks in service?
              Use your most recent DD-214 and tell your VSO about earlier periods. Type what you read into
              the profile fields above — they save to your record.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
