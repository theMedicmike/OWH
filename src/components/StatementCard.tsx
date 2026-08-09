"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { veteranWords, otherExposure } from "@/lib/veteranWords";

// ─────────────────────────────────────────────────────────────────────────────
// "MY STATEMENT — IN MY OWN WORDS" (council ruling: option b).
//
// Assembles the veteran's check-in narratives VERBATIM into a standalone,
// printable draft for their accredited VSO. Bright lines, non-negotiable:
//   • NOT a VA form: no form number as title, no form facsimile, no penalty-
//     certification block, no OWH logo presented as preparer.
//   • Verbatim only — no AI touches the words, structurally (no API route in
//     this path). Edits happen at the source check-in.
//   • The checkbox pass is veteran CONSENT (include/exclude), never app
//     curation — a 2 AM note was written to a map pin, not the federal
//     government.
// ─────────────────────────────────────────────────────────────────────────────

export type StatementRow = { place: string; range: string; exposures: string; notes: string | null };
export type StatementCondition = { label: string; onset: number | null; secondaryTo: string | null };

type Props = {
  name: string;
  branch: string | null;
  years: string | null;
  rows: StatementRow[];
  conditions: StatementCondition[];
  /** Set when a spouse/caregiver (population_layer) is building this record — the
   *  document is no longer "in my own words," and every label on it must say so. */
  proxyRelationship?: string | null;
};

function sanitize(s: string): string {
  return s.replace(/[‘’ʼ]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/…/g, "...").replace(/[^\x00-\xFF]/g, "");
}

export default function StatementCard({ name, branch, years, rows, conditions, proxyRelationship }: Props) {
  const isProxy = !!proxyRelationship;
  const usable = useMemo(
    () => rows.map((r, i) => ({ ...r, words: veteranWords(r.notes), other: otherExposure(r.notes), i })).filter((r) => r.words || r.other),
    [rows],
  );
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "letter" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 64;
      const contentW = pageW - margin * 2;
      let y = margin;

      const footer = () => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(138, 151, 165);
        const footerLine = isProxy
          ? `Assembled word-for-word from what ${proxyRelationship} wrote in Connecting the Dots of Service, on behalf of the veteran named above. Nothing was written or reworded by AI. Not a VA form. Veterans Crisis Line: dial 988, then press 1.`
          : "Assembled word-for-word from what this veteran wrote in Connecting the Dots of Service. Nothing was written or reworded by AI or by anyone but the veteran. Not a VA form. Veterans Crisis Line: dial 988, then press 1.";
        const f = doc.splitTextToSize(footerLine, contentW) as string[];
        let fy = pageH - margin + 14;
        for (const ln of f) { doc.text(ln, margin, fy); fy += 9; }
      };
      const ensure = (space: number) => {
        if (y + space > pageH - margin) { footer(); doc.addPage(); y = margin; }
      };
      const text = (s: string, size = 10, style: "normal" | "bold" | "italic" = "normal", color: [number, number, number] = [21, 33, 46], gap = 0) => {
        doc.setFont("helvetica", style);
        doc.setFontSize(size);
        doc.setTextColor(color[0], color[1], color[2]);
        const lines = doc.splitTextToSize(sanitize(s), contentW) as string[];
        for (const ln of lines) { ensure(size * 1.5); doc.text(ln, margin, y); y += size * 1.5; }
        y += gap;
      };

      text(isProxy ? `Statement — Prepared by ${proxyRelationship}` : "My Statement — In My Own Words", 18, "bold", [21, 33, 46], 4);
      text(
        [isProxy ? `For ${name}` : name, branch, years].filter(Boolean).join("  ·  ") +
          `  ·  prepared ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
        9.5, "normal", [92, 107, 122], 8,
      );

      // The boxed draft label — what keeps this unmistakably not-the-form.
      ensure(52);
      doc.setDrawColor(193, 135, 61);
      doc.setLineWidth(1);
      const label = doc.splitTextToSize(
        sanitize(
          isProxy
            ? `DRAFT for your accredited VSO — prepared by ${proxyRelationship}, not the veteran, and not yet filed with VA. Review it with ${name} before it goes anywhere near VA Form 21-4138 or 21-10210.`
            : "DRAFT for your accredited VSO — this is not a VA form and has not been filed with VA. Your VSO can help you move it onto the right official form (often VA Form 21-4138, or 21-10210 for a witness).",
        ),
        contentW - 20,
      ) as string[];
      const boxH = label.length * 12 + 16;
      doc.rect(margin, y, contentW, boxH);
      let ly = y + 14;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(133, 79, 11);
      for (const ln of label) { doc.text(ln, margin + 10, ly); ly += 12; }
      y += boxH + 14;

      for (const r of usable.filter((u) => !excluded.has(u.i))) {
        text(`${r.place}${r.range ? `, ${r.range}` : ""}`, 11, "bold", [22, 49, 79]);
        if (r.exposures) text(`Exposures I logged: ${r.exposures}`, 9, "normal", [92, 107, 122]);
        if (r.words) text(`"${r.words}"`, 10.5, "normal", [21, 33, 46], r.other ? 0 : 8);
        if (r.other) text(`I was also around: ${r.other}`, 9.5, "normal", [21, 33, 46], 8);
      }

      const condLines = conditions.filter((c) => c.onset || c.secondaryTo);
      if (condLines.length) {
        text("What I live with now", 11, "bold", [22, 49, 79], 2);
        for (const c of condLines) {
          const parts = [c.label];
          if (c.onset) parts.push(`began about ${c.onset}`);
          if (c.secondaryTo) parts.push(`came after my ${c.secondaryTo}`);
          text(parts.join(" — "), 10, "normal", [21, 33, 46]);
        }
        y += 8;
      }

      // Plain signature lines — no certification language of any kind.
      ensure(60);
      y += 18;
      doc.setDrawColor(21, 33, 46);
      doc.setLineWidth(0.7);
      doc.line(margin, y, margin + 200, y);
      doc.line(pageW - margin - 160, y, pageW - margin, y);
      y += 12;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(92, 107, 122);
      doc.text("Signature", margin, y);
      doc.text("Date", pageW - margin - 160, y);

      footer();
      doc.save(`My-Statement-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setBusy(false);
    }
  }

  const heading = isProxy ? `Statement, prepared by ${proxyRelationship}` : "My statement, in my words";

  if (usable.length === 0) {
    return (
      <div className="mb-4 rounded-xl border border-line bg-surface p-5 print:hidden">
        <div className="text-[13px] font-bold uppercase tracking-wide text-brand">{heading}</div>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          {isProxy ? "This statement builds from what you write on the check-ins you add" : "Your statement builds from what you write on your check-ins"} — even two sentences about what
          {isProxy ? " they were" : " you were"} around is a statement.{" "}
          <Link href="/map" className="font-semibold text-brand hover:underline">Add {isProxy ? "their" : "your"} words on the map →</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-xl border border-line bg-surface p-5 print:hidden">
      <div className="text-[13px] font-bold uppercase tracking-wide text-brand">{heading}</div>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">
        {isProxy ? (
          <>Assembled from what you&apos;ve entered here, <strong className="text-ink">exactly as you wrote
          it</strong> — labeled as coming from you, not from {name}. A draft to review with an accredited VSO.</>
        ) : (
          <>Assembled from what you&apos;ve already written here, <strong className="text-ink">exactly as you wrote
          it</strong>. A draft to review with your accredited VSO.</>
        )}
      </p>

      <p className="mt-3 text-xs leading-relaxed text-muted">
        {isProxy
          ? "These are the words you've entered on the check-ins you added. Uncheck anything you don't want in this statement. To change the words themselves, edit the check-in note — the statement always prints them exactly as written."
          : "These are your words from your check-ins. Uncheck anything you don't want in this statement. To change the words themselves, edit the check-in note — the statement always prints them exactly as written."}
      </p>
      <ul className="mt-2 space-y-2">
        {usable.map((r) => (
          <li key={r.i} className="flex items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={!excluded.has(r.i)}
              onChange={() =>
                setExcluded((prev) => {
                  const n = new Set(prev);
                  if (n.has(r.i)) n.delete(r.i); else n.add(r.i);
                  return n;
                })
              }
              className="mt-1 rounded accent-brand"
              aria-label={`Include your words from ${r.place}`}
            />
            <span className="min-w-0">
              <span className="font-semibold text-ink">{r.place}</span>
              {r.range && <span className="text-muted"> · {r.range}</span>}
              {r.words && <span className="block text-[13px] italic leading-relaxed text-ink/85">&ldquo;{r.words}&rdquo;</span>}
              {r.other && <span className="block text-[12px] text-muted">Also around: {r.other}</span>}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-[11px] leading-relaxed text-faint">
        Read it once before you share it. Make sure everything here is something you want in your VA file —
        including other people&apos;s names.
      </p>
      <button
        onClick={download}
        disabled={busy || usable.every((u) => excluded.has(u.i))}
        className="mt-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-600 disabled:opacity-50"
      >
        {busy ? "Building…" : "Save my statement (PDF)"}
      </button>
    </div>
  );
}
