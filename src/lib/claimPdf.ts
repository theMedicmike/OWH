// Builds a clean, downloadable PDF of the claim-support packet using jsPDF.
// This generates a real file the veteran can save and print from — it does not
// rely on the browser's print dialog (which in-app browsers like Gmail's block).

export type PdfTimelineRow = { year: string; place: string; exposures: string; note?: string };
export type PdfExposure = { label: string; presumptive: boolean; places: string; basis: string };
export type PdfCondition = { label: string; tag?: string; presumptive?: boolean; status: string; matches: string; cite?: string; veteranLine?: string; latency?: string };
export type PdfContention = { label: string; matches: string; cite?: string };
export type PdfAttachment = { name: string; isImage: boolean; url: string };

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
  conditions: PdfCondition[];
  corroborations: string[];
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
    const lines = doc.splitTextToSize(s, contentW - indent) as string[];
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
    const lines = doc.splitTextToSize(s, contentW - 16) as string[];
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
  sectionHeading("2 · Documented basis for each exposure");
  if (data.exposures.length === 0) text("Log exposures on the map to populate this.", { color: MUTED });
  else
    data.exposures.forEach((e) => {
      text(`${e.label}${e.presumptive ? "  (presumptive pathway)" : ""}`, { size: 10, style: "bold", gapAfter: 0 });
      if (e.places) text(e.places, { size: 8.5, color: FAINT, indent: 12, gapAfter: 0 });
      text(e.basis, { size: 9, color: MUTED, indent: 12, gapAfter: 5 });
    });

  // ---- 3. Conditions ----
  sectionHeading("3 · Conditions & their documented links");
  if (data.conditions.length === 0) text("No conditions recorded.", { color: MUTED });
  else
    data.conditions.forEach((c) => {
      text(`${c.label}${c.tag ? `  —  ${c.tag}` : ""}${c.status !== "none" ? `  (VA claim ${c.status})` : ""}`, { size: 10, style: "bold", gapAfter: 0 });
      if (c.veteranLine) text(`${c.veteranLine}  (Veteran-reported)`, { size: 9, color: INK, indent: 12, gapAfter: 0 });
      if (c.latency) text(c.latency, { size: 9, style: "italic", color: MUTED, indent: 12, gapAfter: 0 });
      text(c.matches || "No logged exposure linked yet.", { size: 9, color: MUTED, indent: 12, gapAfter: 0 });
      if (c.cite) text(c.cite, { size: 8, color: FAINT, indent: 12, gapAfter: 5 });
      else y += 5;
    });

  // ---- 4. Corroboration ----
  sectionHeading("4 · Corroboration by fellow service members");
  if (data.corroborations.length === 0)
    text("No corroboration yet. In Battle buddies, others who served where you did can confirm your exposures — each confirmation strengthens this record.", { color: MUTED });
  else data.corroborations.forEach((c) => bullet(c, { size: 9.5 }));
  text("Lay statements consistent with VA Form 21-10210. Corroborators are kept anonymous unless they consent to be named.", { size: 8, color: FAINT, gapAfter: 4 });

  // ---- 5. Clinician hand-off ----
  newPage();
  sectionHeading("5 · For the reviewing clinician");
  text(
    "The veteran requests your medical opinion on whether the following condition(s) are at least as likely as not (50% or greater probability) connected to the documented service exposures below. A signed nexus statement, or a completed Disability Benefits Questionnaire (DBQ), supports this claim.",
    { size: 9.5, gapAfter: 6 }
  );
  if (data.contentions.length === 0) text("Add conditions and exposures to generate the contentions list.", { color: MUTED });
  else
    data.contentions.forEach((c) => {
      text(`${c.label} — ${c.matches}`, { size: 10, style: "bold", gapAfter: 0 });
      if (c.cite) text(c.cite, { size: 8, color: FAINT, indent: 12, gapAfter: 5 });
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
    data.attachments.forEach((a) =>
      bullet(`${a.name}${a.isImage ? " (image — printed at the end)" : " — attach this file when you submit"}`, { size: 9.5 })
    );
  }

  // ---- Footer disclaimer ----
  y += 10;
  ensure(50);
  doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 12;
  text(
    "This packet assembles veteran-entered facts with documented sources. It states associations and presumptive pathways; it does not assert medical causation, which requires a licensed clinician's opinion. Citations are general and depend on your specific dates and locations — confirm with your VSO. Sources: PACT Act of 2022, 38 CFR Part 3, Camp Lejeune Justice Act, and ATSDR toxicological profiles (VA.gov, 2026). Veterans Crisis Line: dial 988, then press 1.",
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

  doc.save(`Claim-Support-Packet-${data.today.replace(/[ ,]+/g, "-")}.pdf`);
}
