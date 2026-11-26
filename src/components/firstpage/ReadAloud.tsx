"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { pauseSpeaking, resumeSpeaking, speakChunks, stopSpeaking, ttsSupported } from "@/lib/voice";
import { TIER_LABEL, type PageData, type PageRow } from "@/lib/firstPage";

// "Read my page aloud": the browser's own voice reads the page's text in print
// order, side 1 then side 2. Pause and Stop, nothing else. The words never
// leave the device; no model is involved.

const shown = (rows: PageRow[]) => rows.filter((r) => r.show);
const src = (r: PageRow) => (r.sourceNumber != null ? `Source ${r.sourceNumber}, ${TIER_LABEL[r.tier].toLowerCase()}.` : `${TIER_LABEL[r.tier]}.`);
const end = (t: string) => (/[.!?]$/.test(t) ? t : `${t}.`);
const line = (...xs: (string | null | undefined)[]) => xs.filter((x) => x && x.trim()).map((x) => end(x!.trim())).join(" ");

export function pageChunks(p: PageData): string[] {
  const out: string[] = [];
  const add = (s: string) => { if (s.trim()) out.push(s); };
  add(line("The First Page", p.name, p.line1, p.line2));
  add(line("Allergies", ...shown(p.allergies).map((a) => a.cells[0])));
  if (p.carePartner) add(line("Care partner in the room", p.carePartner.line));
  if (p.readFirst.length) add(line("Read this first, in my own words", ...p.readFirst));
  if (p.returnNoteTo) add(line("Return your note to", p.returnNoteTo));
  if (shown(p.problems).length) { add("Problems, active first."); shown(p.problems).forEach((r) => add(line(r.cells[0], r.cells[1] && `Since ${r.cells[1]}`, r.cells[2] && `Diagnosed by ${r.cells[2]}`, r.cells[3], src(r)))); }
  if (shown(p.medications).length) { add("Medications, copied word for word from the pharmacy printout."); shown(p.medications).forEach((r) => add(line(r.cells[0], r.cells[1] && `Since ${r.cells[1]}`, src(r)))); }
  if (shown(p.studies).length) { add("Key studies."); shown(p.studies).forEach((r) => add(line(r.cells[0], r.cells[1], src(r)))); }
  if (shown(p.tried).length) { add(line(p.triedTitle)); shown(p.tried).forEach((r) => add(line(r.cells[0], src(r)))); }
  if (p.openToday) add(line("Open today", p.openToday));
  if (p.questions.length) add(line("My two questions", ...p.questions.map((q, i) => `${i + 1}. ${q}`)));
  if (shown(p.service).length) { add("Side two. Service history, one line per posting."); shown(p.service).forEach((r) => add(line(r.cells[0], r.cells[1], r.cells[2], src(r)))); }
  if (shown(p.exposures).length) { add("Toxic exposure screening."); shown(p.exposures).forEach((r) => add(line(r.cells[0], r.cells[1], r.cells[2], src(r)))); }
  if (shown(p.results).length) { add("Results that changed."); shown(p.results).forEach((r) => add(line(r.cells[0], r.cells[1] && `Earlier, ${r.cells[1]}`, r.cells[2] && `Later, ${r.cells[2]}`))); }
  if (p.chain.length) add(line("The line between them, in my words and my order", ...p.chain.map((c) => [c.word, c.detail].filter(Boolean).join(", "))));
  if (shown(p.shots).length) { add("Immunizations and medications given in service."); shown(p.shots).forEach((r) => add(line(r.cells[0], r.cells[1], src(r)))); }
  if (p.specimens) add(line("Stored blood specimens", p.specimens));
  if (p.noRecordFoundFor) add(line("No record found for", p.noRecordFoundFor));
  if (p.helpMe) add(line("How to help me in the room", p.helpMe));
  if (p.sinceLastVisit) add(line("Since last visit", p.sinceLastVisit));
  add("From my own records. This is my record, not a diagnosis. Ask me about any line.");
  return out;
}

const noSubscribe = () => () => {};

export default function ReadAloud({ page, className = "btn btn-outline min-h-11" }: { page: PageData | null; className?: string }) {
  const supported = useSyncExternalStore(noSubscribe, ttsSupported, () => false);
  const [state, setState] = useState<"idle" | "playing" | "paused">("idle");
  useEffect(() => () => stopSpeaking(), []);
  if (!supported || !page) return null;

  if (state === "idle") {
    return (
      <button type="button" className={className} onClick={() => { setState("playing"); speakChunks(pageChunks(page), 0, { onDone: () => setState("idle") }); }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 flex-none" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /></svg>
        Read my page aloud
      </button>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2" role="group" aria-label="Reading your page aloud">
      {state === "playing" ? (
        <button type="button" className={className} onClick={() => { pauseSpeaking(); setState("paused"); }}>Pause</button>
      ) : (
        <button type="button" className={className} onClick={() => { resumeSpeaking(); setState("playing"); }}>Keep reading</button>
      )}
      <button type="button" className="btn btn-secondary min-h-11" onClick={() => { stopSpeaking(); setState("idle"); }}>Stop</button>
    </span>
  );
}
