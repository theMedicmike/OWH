// Builds a clean, downloadable PDF of the claim-support packet using jsPDF.
// This generates a real file the veteran can save and print from — it does not
// rely on the browser's print dialog (which in-app browsers like Gmail's block).

export type PdfTimelineRow = { year: string; place: string; exposures: string; note?: string };
export type PdfExposure = { label: string; presumptive: boolean; places: string; basis: string };
export type PdfEvent = { label: string; note: string };
export type PdfCondition = { label: string; tag?: string; presumptive?: boolean; status: string; matches: string; cite?: string; veteranLine?: string; latency?: string; noiseLine?: string; diagnosisLine?: string };
export type PdfContention = { label: string; matches: string; cite?: string; elementLine?: string };
export type PdfAttachment = { name: string; isImage: boolean; url: string };
export type PdfWitnessStatement = { subject: string; witnessName: string; relationship: string; statement: string; detail?: string };
/** One printed line per medication. Assembled in ReportView so the browser
 *  sheet and this PDF can never disagree — same rule as the contentions list. */
export type PdfMedication = { line: string; note?: string };

export type ClaimPdfData = {
  name: string;
  branch: string | null;
  years: string | null;
  /** e.g. "MOS 11B · Current VA rating: 70% (veteran-reported)" */
  subline?: string;
  today: string;
  summary: string;
  nextStep: string;
  timeline: PdfTimelineRow[];
  exposures: PdfExposure[];
  events: PdfEvent[];
  conditions: PdfCondition[];
  medications: PdfMedication[];
  corroborations: string[];
  witnessStatements: PdfWitnessStatement[];
  contentions: PdfContention[];
  attachments: PdfAttachment[];
};

const NAVY: [number, number, number] = [22, 49, 79];
const GOLD: [number, number, number] = [193, 135, 61];
const INK: [number, number, number] = [21, 33, 46];
const MUTED: [number, number, number] = [92, 107, 122];
const FAINT: [number, number, number] = [138, 151, 165];
const LINE: [number, number, number] = [229, 233, 239];
const RIBBON = [
  [158, 42, 43], [243, 234, 214], [58, 110, 165], [193, 135, 61], [58, 110, 165], [243, 234, 214], [158, 42, 43],
] as [number, number, number][];

// jsPDF's built-in helvetica is cp1252 — emoji or non-Latin glyphs in the
// veteran's narrative would print as garbage inside a quoted line. Map the
// common typographic characters, drop the rest.
function sanitize(s: string): string {
  return s
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x00-\xFF]/g, "");
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

function imageDims(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 0, h: 0 });
    img.src = dataUrl;
  });
}

async function fetchImage(url: string): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const data = await blobToDataURL(blob);
    const { w, h } = await imageDims(data);
    if (!w || !h) return null;
    return { data, w, h };
  } catch {
    return null;
  }
}

import { currencyLine } from "./accuracyOwner";

export async function downloadClaimPdf(data: ClaimPdfData) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 54;
  const contentW = pageW - margin * 2;
  let y = margin;

  const ribbon = () => {
    const seg = pageW / RIBBON.length;
    RIBBON.forEach((c, i) => {
      doc.setFillColor(c[0], c[1], c[2]);
      doc.rect(i * seg, 0, seg + 1, 6, "F");
    });
  };

  const newPage = () => {
    doc.addPage();
    ribbon();
    y = margin;
  };

  const ensure = (space: number) => {
    if (y + space > pageH - margin) newPage();
  };

  const text = (
    s: string,
    opts: { size?: number; color?: [number, number, number]; style?: "normal" | "bold" | "italic"; indent?: number; gapAfter?: number; lh?: number } = {}
  ) => {
    const size = opts.size ?? 10;
    const color = opts.color ?? INK;
    const style = opts.style ?? "normal";
    const indent = opts.indent ?? 0;
    const lh = opts.lh ?? size * 1.45;
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(sanitize(s), contentW - indent) as string[];
    for (const ln of lines) {
      ensure(lh);
      doc.text(ln, margin + indent, y);
      y += lh;
    }
    if (opts.gapAfter) y += opts.gapAfter;
  };

  const bullet = (s: string, opts: { size?: number; color?: [number, number, number] } = {}) => {
    const size = opts.size ?? 10;
    const color = opts.color ?? INK;
    const lh = size * 1.45;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(sanitize(s), contentW - 16) as string[];
    lines.forEach((ln, i) => {
      ensure(lh);
      if (i === 0) {
        doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
        doc.text("•", margin, y);
        doc.setTextColor(color[0], color[1], color[2]);
      }
      doc.text(ln, margin + 16, y);
      y += lh;
    });
  };

  const sectionHeading = (label: string) => {
    ensure(34);
    y += 6;
    doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageW - margin, y);
    y += 16;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.text(label.toUpperCase(), margin, y);
    y += 16;
  };

  // ---- Letterhead ----
  ribbon();

  const logo = await fetchImage("/owh-logo.png");
  if (logo) {
    const h = 34;
    const w = (logo.w / logo.h) * h;
    doc.addImage(logo.data, "PNG", margin, y, w, h);
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text(`Prepared ${data.today}`, pageW - margin, y + 10, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.text("America's 250th  ·  1776–2026", pageW - margin, y + 24, { align: "right" });
  y += 52;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.text("CONNECTING THE DOTS OF SERVICE  ·  OPERATION WHOLE HEALTH", margin, y);
  y += 20;
  doc.setFontSize(20);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.text("Claim Support Packet", margin, y);
  y += 18;
  text([data.name, data.branch, data.years].filter(Boolean).join("  ·  "), { size: 10, color: MUTED, gapAfter: data.subline ? 0 : 6 });
  if (data.subline) text(data.subline, { size: 9, color: MUTED, gapAfter: 6 });

  text(
    "Prepared from veteran-entered data. This is a self-reported record with documented-source citations to assist an accredited VSO and a clinician. It is not a diagnosis or a determination of service connection.",
    { size: 8.5, color: FAINT, gapAfter: 10 }
  );

  // ---- What this means ----
  ensure(70);
  const boxTop = y;
  doc.setFillColor(247, 249, 251);
  const boxLines = doc.splitTextToSize(data.summary, contentW - 24) as string[];
  const nextLines = doc.splitTextToSize("Your next step: " + data.nextStep, contentW - 24) as string[];
  const boxH = 26 + boxLines.length * 13 + 8 + nextLines.length * 13 + 14;
  doc.rect(margin, boxTop, contentW, boxH, "F");
  y = boxTop + 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.text("WHAT THIS MEANS", margin + 12, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  for (const ln of boxLines) { doc.text(ln, margin + 12, y); y += 13; }
  y += 8;
  doc.setFont("helvetica", "bold");
  for (const ln of nextLines) { doc.text(ln, margin + 12, y); y += 13; }
  y = boxTop + boxH + 6;

  // ---- 1. Timeline ----
  sectionHeading("1 · Service & exposure timeline");
  if (data.timeline.length === 0) text("No locations logged yet.", { color: MUTED });
  else
    data.timeline.forEach((r) => {
      text(`${r.year}  ·  ${r.place}`, { size: 10, style: "bold", gapAfter: 0 });
      text(r.exposures || "—", { size: 9, color: MUTED, indent: 12, gapAfter: r.note ? 0 : 4 });
      // The veteran's own account is the strongest thing this page carries.
      if (r.note) text(`In the veteran's words — "${r.note}"  (Veteran-reported)`, { size: 9, style: "italic", color: INK, indent: 12, gapAfter: 4 });
    });

  // ---- 2. Documented basis ----
  // Facts only: what the veteran logged and where. The science and legal
  // citation that EXPLAINS why an association is studied moves to Appendix A
  // — inline, this paragraph reads to a rater as advocacy, not a record.
  sectionHeading("2 · Exposures documented at your locations");
  if (data.exposures.length === 0) text("Log exposures on the map to populate this.", { color: MUTED });
  else {
    data.exposures.forEach((e) => {
      text(`${e.label}${e.presumptive ? "  (presumptive pathway)" : ""}`, { size: 10, style: "bold", gapAfter: 0 });
      text(e.places || "—", { size: 8.5, color: FAINT, indent: 12, gapAfter: 5 });
    });
    text("The documented basis for each of these — the toxicological and legal source — is in Appendix A.", { size: 8, color: FAINT, gapAfter: 4 });
  }

  // ---- 3. Conditions ----
  sectionHeading("3 · Conditions & their documented links");
  if (data.conditions.length === 0) text("No conditions recorded.", { color: MUTED });
  else
    data.conditions.forEach((c) => {
      text(`${c.label}${c.tag ? `  —  ${c.tag}` : ""}${c.status !== "none" ? `  (VA claim ${c.status})` : ""}`, { size: 10, style: "bold", gapAfter: 0 });
      // Element 1 (current diagnosis) — the single fact that most decides
      // whether a claim survives, printed where a rater looks first.
      if (c.diagnosisLine) {
        text(c.diagnosisLine, { size: 9, style: "bold", color: c.diagnosisLine.startsWith("NEEDS DIAGNOSIS") ? GOLD : INK, indent: 12, gapAfter: 0 });
      }
      if (c.veteranLine) text(`${c.veteranLine}  (Veteran-reported)`, { size: 9, color: INK, indent: 12, gapAfter: 0 });
      if (c.latency) text(c.latency, { size: 9, style: "italic", color: MUTED, indent: 12, gapAfter: 0 });
      if (c.noiseLine) text(c.noiseLine, { size: 9, color: INK, indent: 12, gapAfter: 0 });
      text(c.matches || "No logged exposure or event linked yet.", { size: 9, color: MUTED, indent: 12, gapAfter: 0 });
      if (c.cite) text("See Appendix A for the documented basis.", { size: 8, color: FAINT, indent: 12, gapAfter: 5 });
      else y += 5;
    });

  // ---- 3b. Medications (veteran-reported) ----
  // Prints WHAT and WHAT FOR, never "this drug caused that condition." A
  // clinician or rater can raise 38 CFR 3.310 from these facts themselves;
  // the packet asserting it would be the app practicing representation.
  if (data.medications.length > 0) {
    sectionHeading("3b · Medications reported by the veteran");
    data.medications.forEach((m) => {
      bullet(m.line, { size: 9.5 });
      if (m.note) text(m.note, { size: 8.5, color: MUTED, indent: 12, gapAfter: 3 });
    });
    text(
      "Veteran-reported. Listed because a condition caused or aggravated by treatment for a service-connected disability may be claimable as secondary under 38 CFR 3.310 — a question for the reviewing clinician and an accredited VSO, not a claim made here.",
      { size: 8, color: FAINT, gapAfter: 4 },
    );
  }

  // ---- 4. Corroboration ----
  sectionHeading("4 · Corroboration by fellow service members");
  if (data.corroborations.length === 0)
    text("No corroboration yet. In Battle buddies, others who served where you did can confirm your exposures — each confirmation strengthens this record.", { color: MUTED });
  else data.corroborations.forEach((c) => bullet(c, { size: 9.5 }));
  text("Lay statements consistent with VA Form 21-10210. Corroborators are kept anonymous unless they consent to be named.", { size: 8, color: FAINT, gapAfter: 4 });

  // ---- 4b. Statements from people who aren't on this app ----
  // Collected through a private, no-login link the veteran sent directly (see
  // lib/statementRequests.ts). Deliberately NOT folded into "corroborations"
  // above — those are anonymous same-location matches between two members of
  // this app; these are named, attributed statements from someone the veteran
  // chose, so they must never be presented as the veteran's own words.
  if (data.witnessStatements.length > 0) {
    sectionHeading("4b · Statements from people who weren't on this app");
    data.witnessStatements.forEach((w) => {
      text(`Regarding: ${w.subject}`, { size: 8.5, color: FAINT, gapAfter: 0 });
      text(`${w.witnessName}  ·  ${w.relationship}`, { size: 9.5, style: "bold", gapAfter: 0 });
      if (w.detail) text(w.detail, { size: 8.5, color: MUTED, gapAfter: 0 });
      text(`"${w.statement}"`, { size: 9, style: "italic", color: INK, indent: 12, gapAfter: 6 });
    });
    text("Collected via a private, no-login link the veteran sent directly. Not the veteran's own words.", { size: 8, color: FAINT, gapAfter: 4 });
  }

  // ---- 5. Clinician hand-off ----
  newPage();
  sectionHeading("5 · For the reviewing clinician");
  // Two DIFFERENT questions, because the contentions list below mixes two kinds of
  // claim. Asking only the exposure question left every secondary contention —
  // a condition caused or worsened by an ALREADY service-connected one — without
  // the question a clinician has to answer for it under 38 CFR 3.310.
  text(
    "The veteran requests your medical opinion on whether the following condition(s) are at least as likely as not (50% or greater probability) connected to his service. A signed nexus statement, or a completed Disability Benefits Questionnaire (DBQ), supports this claim.",
    { size: 9.5, gapAfter: 4 }
  );
  text(
    "For a condition tied to a documented exposure:  Is the condition at least as likely as not (50% or greater) related to the veteran's documented in-service exposure?",
    { size: 9.5, gapAfter: 3 }
  );
  text(
    "For a condition listed as secondary to another:  Is the condition at least as likely as not (50% or greater) proximately due to, OR AGGRAVATED BY, the veteran's service-connected condition?  (38 CFR 3.310 — aggravation counts, and is frequently missed.)",
    { size: 9.5, gapAfter: 6 }
  );
  if (data.contentions.length === 0) text("Add conditions and exposures to generate the contentions list.", { color: MUTED });
  else
    data.contentions.forEach((c) => {
      text(`${c.label} — ${c.matches}`, { size: 10, style: "bold", gapAfter: 0 });
      if (c.elementLine) text(c.elementLine, { size: 8.5, color: MUTED, indent: 12, gapAfter: 0 });
      if (c.cite) text("See Appendix A for the documented basis.", { size: 8, color: FAINT, indent: 12, gapAfter: 5 });
      else y += 5;
    });
  y += 24;
  ensure(60);
  doc.setDrawColor(INK[0], INK[1], INK[2]);
  doc.setLineWidth(0.7);
  doc.line(margin, y, margin + 220, y);
  doc.line(pageW - margin - 220, y, pageW - margin, y);
  y += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text("Clinician signature", margin, y);
  doc.text("Date  ·  License #", pageW - margin - 220, y);
  y += 6;

  // ---- 6. Attachments ----
  sectionHeading("6 · Attached records");
  if (data.attachments.length === 0)
    text("Upload your DD-214 and any service or medical records under Account — they'll be listed here and image scans will print with this packet.", { color: MUTED });
  else {
    text("The following records accompany this packet:", { size: 9.5, color: MUTED, gapAfter: 2 });
    text("Before sharing, check printed images for your Social Security Number (DD-214 Box 3) — cover it or re-upload a copy with it covered.", { size: 8, color: GOLD, gapAfter: 2 });
    data.attachments.forEach((a) =>
      bullet(`${a.name}${a.isImage ? " (image — printed at the end)" : " — attach this file when you submit"}`, { size: 9.5 })
    );
  }

  // ---- Appendix A: Documented Associations (Educational Reference) ----
  // The science and legal citation that EXPLAIN why an association is
  // studied — pulled out of the fact sections above and gathered here, under
  // its own label, so nothing on pages one through six reads like an essay
  // arguing the veteran's case instead of a record of what happened to him.
  const appendixExposures = data.exposures.filter((e) => e.basis);
  const appendixEvents = data.events;
  const appendixConditions = data.conditions.filter((c) => c.cite);
  if (appendixExposures.length > 0 || appendixEvents.length > 0 || appendixConditions.length > 0) {
    newPage();
    sectionHeading("Appendix A · Documented associations (educational reference)");
    text(
      "The following explains WHY an association is studied — the toxicological and legal source. It is background reading, not a sworn statement by the veteran, and it does not appear in the factual record on the pages above.",
      { size: 8.5, color: FAINT, gapAfter: 8 }
    );
    if (appendixExposures.length > 0) {
      text("Exposures", { size: 9.5, style: "bold", color: NAVY, gapAfter: 3 });
      appendixExposures.forEach((e) => {
        text(e.label, { size: 9.5, style: "bold", gapAfter: 0 });
        text(e.basis, { size: 8.5, color: MUTED, indent: 12, gapAfter: 5 });
      });
    }
    if (appendixEvents.length > 0) {
      text("Reported events", { size: 9.5, style: "bold", color: NAVY, gapAfter: 3 });
      appendixEvents.forEach((e) => {
        text(e.label, { size: 9.5, style: "bold", gapAfter: 0 });
        text(e.note, { size: 8.5, color: MUTED, indent: 12, gapAfter: 5 });
      });
    }
    if (appendixConditions.length > 0) {
      text("Conditions", { size: 9.5, style: "bold", color: NAVY, gapAfter: 3 });
      appendixConditions.forEach((c) => {
        text(c.label, { size: 9.5, style: "bold", gapAfter: 0 });
        text(c.cite as string, { size: 8.5, color: MUTED, indent: 12, gapAfter: 5 });
      });
    }
  }

  // ---- Footer disclaimer ----
  y += 10;
  ensure(50);
  doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 12;
  text(
    "This packet assembles veteran-entered facts with documented sources. It states documented ASSOCIATIONS; it does not assert medical causation (which requires a licensed clinician's opinion) and it does not determine eligibility for any presumption. Whether a VA presumption applies depends on where and when this veteran served — an accredited VSO should confirm that against the veteran's service record. GULF WAR DEADLINE: under 38 CFR §3.317(a)(1)(i) a qualifying chronic disability must have become manifest during Southwest Asia service, or to 10 percent or more not later than December 31, 2026 — confirm with a VSO whether VA has extended it. Sources: 38 U.S.C. §§1116, 1119, 1120; 38 CFR §§3.307, 3.309, 3.311, 3.317, 3.320; and ATSDR toxicological profiles. " +
      currencyLine() +
      " Veterans Crisis Line: dial 988, then press 1.",
    { size: 7.5, color: FAINT }
  );

  // ---- Image attachments on their own pages ----
  for (const a of data.attachments.filter((x) => x.isImage && x.url)) {
    const img = await fetchImage(a.url);
    if (!img) continue;
    doc.addPage();
    ribbon();
    let iy = margin;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.text(a.name, margin, iy);
    iy += 14;
    const maxW = contentW;
    const maxH = pageH - iy - margin;
    const scale = Math.min(maxW / img.w, maxH / img.h);
    const w = img.w * scale;
    const h = img.h * scale;
    const fmt = img.data.includes("image/png") ? "PNG" : "JPEG";
    doc.addImage(img.data, fmt, margin, iy, w, h);
  }

  // ---- Page footer: prepared date + page number, stamped last so the total
  // page count is known (a rater citing "page 4" needs the number to be real). ----
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(FAINT[0], FAINT[1], FAINT[2]);
    doc.text(`Prepared ${data.today}`, margin, pageH - 20);
    doc.text(`Page ${p} of ${totalPages}`, pageW - margin, pageH - 20, { align: "right" });
  }

  doc.save(`Claim-Support-Packet-${data.today.replace(/[ ,]+/g, "-")}.pdf`);
}
