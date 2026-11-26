import type { jsPDF as JsPDF } from "jspdf";
import { TIER_LABEL, type PageData, type PageRow } from "@/lib/firstPage";

// The First Page as a two-page US Letter PDF: page 1 is side 1, page 2 is
// side 2. It draws the same content, in the same order, under the same
// headings and footer lines as the print layout in
// components/firstpage/FirstPagePrint.tsx (Side1, Side2, PRINT_CSS). Sizes
// there are CSS px; here 1px = 0.75pt, and the page padding, gaps, column
// fractions and font sizes are copied from PRINT_CSS.
//
// Rules this file keeps, the same ones the print keeps:
//   - it copies the assembled page; it adds no words of its own, ranks
//     nothing and concludes nothing;
//   - side 1 never names the format steward; that line is on side 2 only;
//   - no links of any kind;
//   - each side is exactly one page. When a side is too full it shrinks step
//     by step, like a print shrink-to-fit, down to a 7pt body. If it is still
//     too full, the longest lists are cut short and end with a line saying
//     how many rows are left on the full record. Never a third page.
//
// Drawn with jsPDF primitives and its standard fonts only: helvetica for the
// body, times for the serif lines. jsPDF is loaded on demand, so it stays out
// of the first bundle.

type RGB = [number, number, number];
type Face = "helvetica" | "times";
type Style = "normal" | "bold" | "italic" | "bolditalic";

const NAVY: RGB = [22, 49, 79]; // #16314f rules and section heads
const FLAG: RGB = [178, 34, 52]; // #b22234 "Bring to every visit" and the chain
const INK: RGB = [21, 33, 46]; // #15212e body text
const MUTED: RGB = [92, 107, 122]; // #5c6b7a secondary text
const ALLERGY: RGB = [139, 30, 30]; // #8b1e1e the allergy box, as printed
const ROWLINE: RGB = [184, 184, 184]; // #b8b8b8 table row rules
const TAGLINE: RGB = [118, 118, 118]; // #767676 tier tags and write-on lines

const PX = 0.75; // one CSS px in pt
const PAGE_W = 612;
const PAGE_H = 792;
const PAD_T = 0.4 * 72;
const PAD_B = 0.36 * 72;
const PAD_X = 0.46 * 72;
const CW = PAGE_W - PAD_X * 2;
const AVAIL_H = PAGE_H - PAD_T - PAD_B;
const BODY_FLOOR_PT = 7;

// Line metrics close to the browser's: half-leading around an
// ascent + descent box, so baselines land where CSS puts them.
const ASC = 0.905;
const DESC = 0.212;

type Ctx = {
  doc: JsPDF;
  s: number; // shrink factor, 1 = the print's own sizes
  basePx: number; // body font size in px (13.5 side 1, 12.5 side 2)
  lhMul: number; // body line-height (1.3 side 1, 1.28 side 2)
  h2Px: number;
  tdPadPx: number;
  draw: boolean;
};

type Limits = Record<string, number>;

// Font sizes and vertical spacing shrink with the page; horizontal geometry
// (page padding, column split, cell padding) stays put, so a shrunk page
// gains words per line as well as lines per page.
const v = (c: Ctx, px: number) => px * PX * c.s;
const hx = (px: number) => px * PX;

// jsPDF's standard fonts are cp1252. Map the common typographic characters
// and drop anything the font cannot draw.
function clean(s: string | null | undefined): string {
  return (s ?? "")
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[\u00A0\u2007\u202F]/g, " ")
    .replace(/[^\x00-\xFF]/g, "");
}

function setFont(doc: JsPDF, face: Face, style: Style, size: number, color?: RGB) {
  doc.setFont(face, style);
  doc.setFontSize(size);
  if (color) doc.setTextColor(color[0], color[1], color[2]);
}

function baselineIn(top: number, lh: number, size: number) {
  return top + (lh - (ASC + DESC) * size) / 2 + ASC * size;
}

// ── wrapping ─────────────────────────────────────────────────────────────────
type Run = { text: string; face?: Face; style?: Style; color?: RGB; tag?: boolean };
type Piece = { t: string; w: number; run: Run; before: number };
type Line = { pieces: Piece[]; width: number };

const tagSize = (size: number) => size * (11.5 / 13.5);

function tagWidth(doc: JsPDF, text: string, size: number) {
  setFont(doc, "helvetica", "normal", tagSize(size));
  return doc.getTextWidth(text) + hx(4) * 2 + hx(1) * 2;
}

function wrap(doc: JsPDF, runs: Run[], width: number, size: number, nowrap = false): Line[] {
  // A hair of tolerance, so a column sized exactly to its longest word keeps it whole.
  const maxW = width + 0.01;
  const lines: Line[] = [];
  let cur: Piece[] = [];
  let curW = 0;
  const flush = () => {
    if (cur.length) lines.push({ pieces: cur, width: curW });
    cur = [];
    curW = 0;
  };
  const add = (p: Piece) => {
    if (!cur.length) p.before = 0;
    cur.push(p);
    curW += p.before + p.w;
  };
  for (const run of runs) {
    if (run.tag) {
      setFont(doc, "helvetica", "normal", size);
      const before = doc.getTextWidth(" ") + hx(3);
      const w = tagWidth(doc, run.text, size);
      if (!nowrap && cur.length && curW + before + w > maxW) flush();
      add({ t: run.text, w, run, before });
      continue;
    }
    setFont(doc, run.face ?? "helvetica", run.style ?? "normal", size);
    const space = doc.getTextWidth(" ");
    const words = clean(run.text).split(/\s+/).filter(Boolean);
    for (const word of words) {
      const w = doc.getTextWidth(word);
      if (nowrap || curW + (cur.length ? space : 0) + w <= maxW) {
        add({ t: word, w, run, before: space });
        continue;
      }
      if (w <= maxW) {
        flush();
        add({ t: word, w, run, before: 0 });
        continue;
      }
      // A single word wider than the column: break it by characters.
      flush();
      let chunk = "";
      for (const ch of word) {
        if (chunk && doc.getTextWidth(chunk + ch) > maxW) {
          add({ t: chunk, w: doc.getTextWidth(chunk), run, before: 0 });
          flush();
          chunk = "";
        }
        chunk += ch;
      }
      if (chunk) add({ t: chunk, w: doc.getTextWidth(chunk), run, before: 0 });
    }
  }
  flush();
  return lines;
}

function drawLine(c: Ctx, line: Line, x: number, top: number, lh: number, size: number) {
  const { doc } = c;
  const base = baselineIn(top, lh, size);
  let cx = x;
  for (let k = 0; k < line.pieces.length; k++) {
    const p = line.pieces[k];
    cx += p.before;
    if (!p.run.tag) {
      // Consecutive words of one run go out as one string, so the viewer sets
      // the spaces with the font it actually draws.
      let t = p.t;
      let w = p.w;
      while (k + 1 < line.pieces.length && line.pieces[k + 1].run === p.run && line.pieces[k + 1].before > 0) {
        const n = line.pieces[++k];
        t += " " + n.t;
        w += n.before + n.w;
      }
      setFont(doc, p.run.face ?? "helvetica", p.run.style ?? "normal", size, p.run.color ?? INK);
      doc.text(t, cx, base);
      cx += w;
      continue;
    }
    {
      const ts = tagSize(size);
      const th = v(c, 16);
      const mid = base - size * 0.32;
      doc.setDrawColor(TAGLINE[0], TAGLINE[1], TAGLINE[2]);
      doc.setLineWidth(hx(1));
      doc.roundedRect(cx + hx(0.5), mid - th / 2, p.w - hx(1), th, hx(3), hx(3), "S");
      setFont(doc, "helvetica", "normal", ts, MUTED);
      doc.text(p.t, cx + p.w / 2, mid + ts * 0.35, { align: "center" });
    }
    cx += p.w;
  }
}

type ParaOpts = { size: number; lh: number; color?: RGB; face?: Face; style?: Style; align?: "left" | "right"; nowrap?: boolean };

// A block of text. Returns its height; draws it when the context draws.
function para(c: Ctx, runs: Run[] | string, x: number, y: number, w: number, o: ParaOpts): number {
  const rs: Run[] = typeof runs === "string" ? [{ text: runs }] : runs;
  const styled = rs.map((r) => ({ face: o.face, style: o.style, color: o.color, ...r }));
  const lines = wrap(c.doc, styled, w, o.size, o.nowrap);
  if (c.draw) {
    lines.forEach((ln, i) => {
      const lx = o.align === "right" ? x + w - ln.width : x;
      drawLine(c, ln, lx, y + i * o.lh, o.lh, o.size);
    });
  }
  return lines.length * o.lh;
}

function textW(doc: JsPDF, s: string, face: Face, style: Style, size: number) {
  setFont(doc, face, style, size);
  return doc.getTextWidth(clean(s));
}

function longestWord(doc: JsPDF, s: string, face: Face, style: Style, size: number) {
  setFont(doc, face, style, size);
  return clean(s)
    .split(/\s+/)
    .filter(Boolean)
    .reduce((m, wd) => Math.max(m, doc.getTextWidth(wd)), 0);
}

function measure(c: Ctx, fn: () => number): number {
  const was = c.draw;
  c.draw = false;
  try {
    return fn();
  } finally {
    c.draw = was;
  }
}

// Children stacked with a CSS flex gap. A child may carry an extra top margin
// in px (negative pulls it up, as the medications note does).
type Child = ((y: number) => number) | [(y: number) => number, number];

function stack(c: Ctx, y: number, gapPx: number, children: Child[]): number {
  let h = 0;
  children.forEach((ch, i) => {
    const [fn, mt] = Array.isArray(ch) ? ch : [ch, 0];
    if (i > 0) h += v(c, gapPx);
    h += v(c, mt);
    h += fn(y + h);
  });
  return h;
}

// ── pieces of the sheet ──────────────────────────────────────────────────────
const bodyPt = (c: Ctx) => v(c, c.basePx);
const bodyLh = (c: Ctx) => bodyPt(c) * c.lhMul;
const smallPt = (c: Ctx) => v(c, 12);

function body(c: Ctx, text: Run[] | string, x: number, y: number, w: number) {
  return para(c, text, x, y, w, { size: bodyPt(c), lh: bodyLh(c) });
}

function small(c: Ctx, text: string, x: number, y: number, w: number) {
  return para(c, text, x, y, w, { size: smallPt(c), lh: smallPt(c) * c.lhMul, color: MUTED });
}

function h2(c: Ctx, text: string, x: number, y: number, w: number) {
  const size = v(c, c.h2Px);
  return para(c, text, x, y, w, { size, lh: size * c.lhMul, style: "bold", color: NAVY });
}

function hline(c: Ctx, x1: number, x2: number, y: number, color: RGB, width: number, dotted = false) {
  if (!c.draw) return;
  const { doc } = c;
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(width);
  if (dotted) doc.setLineDashPattern([width, width * 2], 0);
  doc.line(x1, y, x2, y);
  if (dotted) doc.setLineDashPattern([], 0);
}

// The sheet head: "The First Page", the line under it, and on the right
// "Bring to every visit" and the date. A 2px navy rule closes it.
function sheetHead(c: Ctx, p: PageData, what: string, x: number, y: number, w: number): number {
  const { doc } = c;
  const bring = "Bring to every visit";
  const updated = `Updated ${p.versionDate}`;
  const bSize = v(c, 13);
  const uSize = smallPt(c);
  const metaW = Math.max(textW(doc, bring, "helvetica", "bold", bSize), textW(doc, updated, "helvetica", "normal", uSize));
  const metaH = bSize * 1.4 + uSize * 1.4;
  const leftW = w - metaW - hx(16);
  const tSize = v(c, 26);
  const leftH = measure(c, () => para(c, "The First Page", x, y, leftW, { size: tSize, lh: tSize, face: "times", style: "bold" }) + v(c, 4) + small(c, what, x, y, leftW));
  const contentH = Math.max(leftH, metaH);
  if (c.draw) {
    const ly = y + contentH - leftH;
    const th = para(c, "The First Page", x, ly, leftW, { size: tSize, lh: tSize, face: "times", style: "bold", color: INK });
    small(c, what, x, ly + th + v(c, 4), leftW);
    const my = y + contentH - metaH;
    para(c, bring, x + w - metaW, my, metaW, { size: bSize, lh: bSize * 1.4, style: "bold", color: FLAG, align: "right", nowrap: true });
    para(c, updated, x + w - metaW, my + bSize * 1.4, metaW, { size: uSize, lh: uSize * 1.4, color: MUTED, align: "right", nowrap: true });
  }
  const pad = v(c, 6);
  hline(c, x, x + w, y + contentH + pad + hx(2) / 2, NAVY, hx(2));
  return contentH + pad + hx(2);
}

type BoxOpts = { label: string; labelColor?: RGB; border?: RGB; borderPx?: number; minH?: number };

// A bordered box: bold label, then its lines, 2px apart.
function box(c: Ctx, x: number, y: number, w: number, o: BoxOpts, lines: ((y: number, w: number) => number)[]): number {
  const bw = hx(o.borderPx ?? 1);
  const padV = v(c, 6);
  const padH = hx(9);
  const ix = x + bw + padH;
  const iw = w - 2 * (bw + padH);
  const inner = (yy: number) =>
    stack(c, yy, 2, [
      (cy) => para(c, o.label, ix, cy, iw, { size: bodyPt(c), lh: bodyLh(c), style: "bold", color: o.labelColor ?? INK }),
      ...lines.map((fn) => (cy: number) => fn(cy, iw)),
    ]);
  const natural = measure(c, () => inner(0)) + 2 * (padV + bw);
  const h = Math.max(natural, o.minH ?? 0);
  if (c.draw) {
    const col = o.border ?? INK;
    c.doc.setDrawColor(col[0], col[1], col[2]);
    c.doc.setLineWidth(bw);
    c.doc.roundedRect(x + bw / 2, y + bw / 2, w - bw, h - bw, hx(4), hx(4), "S");
    inner(y + bw + padV);
  }
  return h;
}

type Col = { head?: string; num?: boolean; src?: boolean; headRight?: boolean };

// A table laid out the way a browser lays out an auto-width table at 100%:
// each column's narrowest and widest content set its share of the width.
function table(c: Ctx, cols: Col[], rows: string[][], x: number, y: number, w: number): number {
  const { doc } = c;
  const bSize = bodyPt(c);
  const sSize = smallPt(c);
  const hSize = smallPt(c);
  const lhMul = c.lhMul;
  const padR = hx(6);
  const hasHead = cols.some((col) => col.head);
  const cellFont = (col: Col): [Face, Style, number] => ["helvetica", "normal", col.src ? sSize : bSize];
  const cellPadR = (col: Col) => (col.src ? 0 : padR);
  const nowrapCol = (col: Col) => !!(col.num || col.src);

  const mins: number[] = [];
  const maxs: number[] = [];
  cols.forEach((col, j) => {
    const [f, st, sz] = cellFont(col);
    let mx = 0;
    let mn = 0;
    for (const r of rows) {
      const t = r[j] ?? "";
      const tw = textW(doc, t, f, st, sz) + cellPadR(col);
      mx = Math.max(mx, tw);
      mn = Math.max(mn, nowrapCol(col) ? tw : longestWord(doc, t, f, st, sz) + cellPadR(col));
    }
    if (col.head) {
      mx = Math.max(mx, textW(doc, col.head, "helvetica", "bold", hSize) + padR);
      mn = Math.max(mn, longestWord(doc, col.head, "helvetica", "bold", hSize) + padR);
    }
    maxs.push(mx);
    mins.push(Math.min(mn, mx));
  });
  const sumMax = maxs.reduce((a, b) => a + b, 0);
  const sumMin = mins.reduce((a, b) => a + b, 0);
  let widths: number[];
  if (sumMax <= 0) widths = cols.map(() => w / cols.length);
  else if (sumMax <= w) widths = maxs.map((m) => (m * w) / sumMax);
  else if (sumMin <= w) widths = mins.map((m, j) => m + ((w - sumMin) * (maxs[j] - m)) / Math.max(sumMax - sumMin, 0.0001));
  else widths = mins.map((m) => (m * w) / sumMin);
  const xs: number[] = [];
  widths.reduce((acc, wd, j) => {
    xs[j] = acc;
    return acc + wd;
  }, x);

  let h = 0;
  if (hasHead) {
    const lh = hSize * lhMul;
    const heads = cols.map((col, j) => (col.head ? wrap(doc, [{ text: col.head, style: "bold", color: MUTED }], widths[j] - padR, hSize) : []));
    const textH = Math.max(...heads.map((l) => l.length * lh));
    const headH = v(c, 2) + textH + v(c, 3);
    if (c.draw) {
      heads.forEach((lines, j) => {
        const top = y + v(c, 2) + textH - lines.length * lh; // vertical-align: bottom
        lines.forEach((ln, i) => {
          const lx = cols[j].headRight ? xs[j] + widths[j] - padR - ln.width : xs[j];
          drawLine(c, ln, lx, top + i * lh, lh, hSize);
        });
      });
    }
    hline(c, x, x + w, y + headH + hx(1.5) / 2, INK, hx(1.5));
    h += headH + hx(1.5);
  }

  const pad = v(c, c.tdPadPx);
  for (const r of rows) {
    const cells = cols.map((col, j) => {
      const [f, st, sz] = cellFont(col);
      const lines = wrap(doc, [{ text: r[j] ?? "", face: f, style: st, color: col.src ? MUTED : INK }], widths[j] - cellPadR(col), sz, nowrapCol(col));
      return { lines, sz, lh: sz * lhMul };
    });
    const textH = Math.max(0, ...cells.map((cl) => cl.lines.length * cl.lh));
    const rowH = pad + textH + pad;
    if (c.draw) {
      cells.forEach((cl, j) => {
        cl.lines.forEach((ln, i) => {
          const lx = cols[j].num ? xs[j] + widths[j] - cellPadR(cols[j]) - ln.width : xs[j];
          drawLine(c, ln, lx, y + h + pad + i * cl.lh, cl.lh, cl.sz);
        });
      });
    }
    hline(c, x, x + w, y + h + rowH + hx(1) / 2, ROWLINE, hx(1));
    h += rowH + hx(1);
  }
  return h;
}

const srcText = (r: PageRow) => (r.sourceNumber != null ? `${r.sourceNumber} ${TIER_LABEL[r.tier]}` : TIER_LABEL[r.tier]);
const shown = (rows: PageRow[]) => rows.filter((r) => r.show);

function take<T>(key: string, items: T[], limits: Limits): { items: T[]; more: number } {
  const lim = limits[key] ?? items.length;
  if (lim >= items.length) return { items, more: 0 };
  return { items: items.slice(0, lim), more: items.length - lim };
}

const moreLine = (n: number) => (n === 1 ? "1 more row on the full record." : `${n} more rows on the full record.`);

function withMore(c: Ctx, more: number, x: number, w: number): Child[] {
  return more > 0 ? [(yy: number) => small(c, moreLine(more), x, yy, w)] : [];
}

// Lays out one whole side. Returns the natural height of its content; when
// the context draws, it draws the side with the foot held to the bottom of
// the page, as the print's flex column does.
function layoutSide(c: Ctx, top: Child[], grid: (y: number) => number, bottom: Child[]): number {
  const gap = v(c, 8);
  const topH = top.map((ch) => measure(c, () => (Array.isArray(ch) ? ch[0] : ch)(0)));
  const gridH = measure(c, () => grid(0));
  const botH = bottom.map((ch) => measure(c, () => (Array.isArray(ch) ? ch[0] : ch)(0)));
  const all = [...topH, gridH, ...botH];
  const natural = all.reduce((a, b) => a + b, 0) + gap * (all.length - 1);
  if (!c.draw) return natural;

  let y = PAD_T;
  top.forEach((ch, i) => {
    (Array.isArray(ch) ? ch[0] : ch)(y);
    y += topH[i] + gap;
  });
  const gridTop = y;
  let by = PAGE_H - PAD_B;
  const botY: number[] = [];
  for (let i = bottom.length - 1; i >= 0; i--) {
    by -= botH[i];
    botY[i] = by;
    by -= gap;
  }
  const gridRoom = by - gridTop;
  if (gridH > gridRoom + 0.5) {
    // Only reached if the side is still too full after shrinking and cutting
    // every list it can cut. The overflow is clipped, never carried over.
    const { doc } = c;
    doc.saveGraphicsState();
    doc.rect(0, gridTop, PAGE_W, Math.max(gridRoom, 0), null);
    doc.clip();
    doc.discardPath();
    grid(gridTop);
    doc.restoreGraphicsState();
  } else {
    grid(gridTop);
  }
  bottom.forEach((ch, i) => (Array.isArray(ch) ? ch[0] : ch)(botY[i]));
  return natural;
}

function twoCols(c: Ctx, y: number, x: number, w: number, fr: [number, number], gapPx: number, left: (y: number, x: number, w: number) => number, right: (y: number, x: number, w: number, rowH: number) => number): number {
  const g = hx(gapPx);
  const lw = ((w - g) * fr[0]) / (fr[0] + fr[1]);
  const rw = w - g - lw;
  const lh = measure(c, () => left(0, x, lw));
  const rh = measure(c, () => right(0, x + lw + g, rw, 0));
  const rowH = Math.max(lh, rh);
  if (c.draw) {
    left(y, x, lw);
    right(y, x + lw + g, rw, rowH);
  }
  return rowH;
}

function foot(c: Ctx, left: string, right: string, rightPx: number, x: number, y: number, w: number): number {
  const size = smallPt(c);
  const lh = size * 1.3;
  const rw = hx(rightPx);
  const lw = w - rw - hx(20);
  const a = para(c, left, x, y, lw, { size, lh, color: INK });
  const b = para(c, right, x + w - rw, y, rw, { size, lh, color: INK, align: "right" });
  return Math.max(a, b);
}

function rule(c: Ctx, x: number, y: number, w: number): number {
  hline(c, x, x + w, y + hx(1) / 2, NAVY, hx(1));
  return hx(1);
}

// ── side 1 ───────────────────────────────────────────────────────────────────
function side1(c: Ctx, p: PageData, limits: Limits): number {
  const x = PAD_X;
  const w = CW;
  const { doc } = c;
  const what = `Service Health Summary, side 1 of 2. Fixed format v1. Page made ${p.versionDate}${p.assembledBy ? ` by helper ${p.assembledBy}` : ""}, signed by the veteran.`;

  const hdr = (y: number) => {
    const g = hx(12);
    const fr = [1.35, 1, 1.1];
    const unit = (w - 2 * g) / (fr[0] + fr[1] + fr[2]);
    const [w1, w2, w3] = fr.map((f) => f * unit);
    const x2 = x + w1 + g;
    const x3 = x2 + w2 + g;
    const who = (yy: number) =>
      stack(c, yy, 2, [
        (cy) => {
          const size = v(c, 24);
          return para(c, p.name, x, cy, w1, { size, lh: size * 1.1, style: "bold", color: INK });
        },
        (cy) => body(c, p.line1, x, cy, w1),
        (cy) => body(c, p.line2, x, cy, w1),
      ]);
    const allergies = (yy: number, minH?: number) =>
      box(
        c,
        x2,
        yy,
        w2,
        { label: "Allergies", labelColor: ALLERGY, border: ALLERGY, borderPx: 2, minH },
        shown(p.allergies).map((a) => (cy: number, iw: number) => body(c, [{ text: a.cells[0] }, { text: TIER_LABEL[a.tier], tag: true }], x2 + hx(2) + hx(9), cy, iw)),
      );
    const partner = (yy: number, minH?: number) =>
      box(c, x3, yy, w3, { label: "Care partner in the room", minH }, [
        (cy, iw) => body(c, p.carePartner?.line ?? "", x3 + hx(1) + hx(9), cy, iw),
        (cy, iw) => small(c, p.carePartner?.contact ?? "", x3 + hx(1) + hx(9), cy, iw),
      ]);
    const H = Math.max(measure(c, () => who(0)), measure(c, () => allergies(0)), measure(c, () => partner(0)));
    if (c.draw) {
      who(y);
      allergies(y, H);
      partner(y, H);
    }
    return H;
  };

  const readFirst = (y: number) => {
    const bar = hx(3);
    const ix = x + bar + hx(12);
    const iw = w - bar - hx(12) - hx(2);
    const wSize = v(c, 18);
    const inner = (yy: number) =>
      stack(c, yy, 4, [
        (cy) => para(c, "Read this first. In my own words. I chose these lines.", ix, cy, iw, { size: smallPt(c), lh: smallPt(c) * c.lhMul, style: "bold", color: NAVY }),
        (cy) => para(c, p.readFirst.join(" "), ix, cy, iw, { size: wSize, lh: wSize * 1.3, face: "times", style: "italic", color: INK }),
      ]);
    const h = v(c, 4) + measure(c, () => inner(0)) + v(c, 4);
    if (c.draw) {
      doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
      doc.rect(x, y, bar, h, "F");
      inner(y + v(c, 4));
    }
    return h;
  };

  const returnLine = (y: number) => {
    const bw = hx(1);
    const padV = v(c, 4);
    const ix = x + bw + hx(9);
    const iw = w - 2 * (bw + hx(9));
    const right = "Rows the veteran chose not to show are left off.";
    const rSize = smallPt(c);
    const rw = textW(doc, right, "helvetica", "normal", rSize);
    const lw = iw - rw - hx(16);
    const runs: Run[] = [{ text: "Return your note to:", style: "bold" }, { text: p.returnNoteTo }];
    const lh = measure(c, () => body(c, runs, ix, 0, lw));
    const textH = Math.max(lh, rSize * c.lhMul);
    const h = textH + 2 * (padV + bw);
    if (c.draw) {
      doc.setDrawColor(INK[0], INK[1], INK[2]);
      doc.setLineWidth(bw);
      doc.roundedRect(x + bw / 2, y + bw / 2, w - bw, h - bw, hx(4), hx(4), "S");
      const top = y + bw + padV;
      body(c, runs, ix, top, lw);
      // align-items: baseline. The right note sits on the first line's baseline.
      setFont(doc, "helvetica", "normal", rSize, MUTED);
      doc.text(right, ix + iw, baselineIn(top, bodyLh(c), bodyPt(c)), { align: "right" });
    }
    return h;
  };

  const problems = take("problems", shown(p.problems), limits);
  const meds = take("medications", shown(p.medications), limits);
  const studies = take("studies", shown(p.studies), limits);
  const tried = take("tried", shown(p.tried), limits);

  const grid = (y: number) =>
    twoCols(
      c,
      y,
      x,
      w,
      [1.22, 1],
      18,
      (yy, lx, lw) =>
        stack(c, yy, 10, [
          (sy) =>
            stack(c, sy, 5, [
              (cy) => h2(c, "Problems, active first", lx, cy, lw),
              (cy) =>
                table(
                  c,
                  [{ head: "Problem" }, { head: "Onset", num: true }, { head: "Diagnosed by" }, { head: "Status" }, { head: "Source", src: true, headRight: true }],
                  problems.items.map((r) => [r.cells[0], r.cells[1], r.cells[2], r.cells[3], srcText(r)]),
                  lx,
                  cy,
                  lw,
                ),
              ...withMore(c, problems.more, lx, lw),
            ]),
          (sy) =>
            stack(c, sy, 5, [
              (cy) => h2(c, "Medications, copied word for word from the pharmacy printout", lx, cy, lw),
              [(cy) => small(c, `${p.medicationsAsOf ? `As of ${p.medicationsAsOf}. ` : ""}Verify with the pharmacy. Printout is in the folder.`, lx, cy, lw), -3],
              (cy) =>
                table(
                  c,
                  [{ head: "Medication and directions as printed" }, { head: "Since", num: true }, { head: "Source", src: true, headRight: true }],
                  meds.items.map((r) => [r.cells[0], r.cells[1], srcText(r)]),
                  lx,
                  cy,
                  lw,
                ),
              ...withMore(c, meds.more, lx, lw),
            ]),
        ]),
      (yy, rx, rw) =>
        stack(c, yy, 10, [
          (sy) =>
            stack(c, sy, 5, [
              (cy) => h2(c, "Key studies, reports in the folder", rx, cy, rw),
              (cy) => table(c, [{}, { num: true }, { src: true }], studies.items.map((r) => [r.cells[0], r.cells[1], srcText(r)]), rx, cy, rw),
              ...withMore(c, studies.more, rx, rw),
            ]),
          (sy) =>
            stack(c, sy, 5, [
              (cy) => h2(c, p.triedTitle, rx, cy, rw),
              (cy) => table(c, [{}, { src: true }], tried.items.map((r) => [r.cells[0], srcText(r)]), rx, cy, rw),
              ...withMore(c, tried.more, rx, rw),
            ]),
          (sy) => stack(c, sy, 5, [(cy) => h2(c, "Open today", rx, cy, rw), (cy) => body(c, p.openToday, rx, cy, rw)]),
          (sy) =>
            box(
              c,
              rx,
              sy,
              rw,
              { label: "My two questions" },
              p.questions.map((q, i) => (cy: number, iw: number) => body(c, `${i + 1}. ${q}`, rx + hx(1) + hx(9), cy, iw)),
            ),
        ]),
    );

  const footLeft =
    "From my own records. This is my record, not a diagnosis. Every line names its source and date. Record: a document in the folder. Recalled: the veteran's memory. Witness: a signed statement. Clinic: a clinician's note. This page organizes records; it does not interpret them. Corrections go to the helper on side 2; a corrected page is re-issued, never hand-edited.";
  const footRight = "Side 2: service, exposures, results that changed, specimens, what could not be found, sources.";

  return layoutSide(
    c,
    [(y) => sheetHead(c, p, what, x, y, w), hdr, readFirst, returnLine],
    grid,
    [(y) => rule(c, x, y, w), (y) => foot(c, footLeft, footRight, 210, x, y, w)],
  );
}

// ── side 2 ───────────────────────────────────────────────────────────────────
const STATUS_WORD: Record<PageData["sources"][number]["status"], string> = {
  received: "Received.",
  pending: "Pending.",
  not_requested: "Not yet requested.",
  not_found: "Not found.",
  closed: "Closed.",
};

function chainBlock(c: Ctx, items: { word: string; detail: string }[], x: number, y: number, w: number): number {
  const { doc } = c;
  const tx = x + hx(20);
  const tw = w - hx(20);
  const sSize = v(c, 15.5);
  const dSize = v(c, 11.5);
  const one = (it: { word: string; detail: string }, yy: number) => {
    let h = para(c, it.word, tx, yy, tw, { size: sSize, lh: sSize * 1.15, face: "times", style: "bold", color: INK });
    if (it.detail) h += para(c, it.detail, tx, yy + h, tw, { size: dSize, lh: dSize * c.lhMul, color: MUTED });
    return h + v(c, 9);
  };
  const hs = items.map((it) => measure(c, () => one(it, 0)));
  const total = hs.reduce((a, b) => a + b, 0);
  if (!c.draw) return total;
  const tops: number[] = [];
  hs.reduce((acc, h, i) => {
    tops[i] = acc;
    return acc + h;
  }, y);
  const cx = x + v(c, 6);
  // the red line from each dot down to the next, then the dots over it
  doc.setDrawColor(FLAG[0], FLAG[1], FLAG[2]);
  doc.setLineWidth(v(c, 2));
  items.forEach((_, i) => {
    if (i === items.length - 1) return;
    doc.line(cx, tops[i] + v(c, 10), cx, tops[i] + hs[i] + v(c, 8));
  });
  const r = v(c, 6);
  const ring = v(c, 2.5);
  items.forEach((_, i) => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(FLAG[0], FLAG[1], FLAG[2]);
    doc.setLineWidth(ring);
    doc.circle(cx, tops[i] + v(c, 4) + r, r - ring / 2, "FD");
  });
  items.forEach((it, i) => one(it, tops[i]));
  return total;
}

function side2(c: Ctx, p: PageData, limits: Limits): number {
  const x = PAD_X;
  const w = CW;
  const what = `Service Health Summary, side 2 of 2. ${p.name}${p.born ? `, born ${p.born}` : ""}. Page made ${p.versionDate}. The second look: where the veteran served, what was around, what changed, and where each fact came from.`;
  const immunNote = p.sources.some((s) => /service treatment record/i.test(s.label) && s.status === "pending") ? "The service treatment record that would confirm these is requested, not yet received." : "";

  const service = take("service", shown(p.service), limits);
  const exposures = take("exposures", shown(p.exposures), limits);
  const results = take("results", shown(p.results), limits);
  const shots = take("shots", shown(p.shots), limits);
  const chain = take("chain", p.chain, limits);
  const sources = take("sources", p.sources, limits);

  const boxIn = (bx: number) => bx + hx(1) + hx(9);

  const grid = (y: number) =>
    twoCols(
      c,
      y,
      x,
      w,
      [1.15, 1],
      18,
      (yy, lx, lw) =>
        stack(c, yy, 10, [
          (sy) =>
            stack(c, sy, 5, [
              (cy) => h2(c, "Service history, one line per posting", lx, cy, lw),
              (cy) =>
                table(
                  c,
                  [{ head: "Years", num: true }, { head: "Where and with whom" }, { head: "Role" }, { head: "Source", src: true, headRight: true }],
                  service.items.map((r) => [r.cells[0], r.cells[1], r.cells[2], srcText(r)]),
                  lx,
                  cy,
                  lw,
                ),
              ...withMore(c, service.more, lx, lw),
            ]),
          (sy) =>
            stack(c, sy, 5, [
              (cy) => h2(c, "Toxic exposure screening, with the where, when and who VA does not record", lx, cy, lw),
              (cy) =>
                table(
                  c,
                  [{ head: "Exposure" }, { head: "Where and when" }, { head: "Unit" }, { head: "Source", src: true, headRight: true }],
                  exposures.items.map((r) => [r.cells[0], r.cells[1], r.cells[2], srcText(r)]),
                  lx,
                  cy,
                  lw,
                ),
              ...withMore(c, exposures.more, lx, lw),
            ]),
          (sy) =>
            stack(c, sy, 5, [
              (cy) => h2(c, "Results that changed, two values, two dates, two sources", lx, cy, lw),
              (cy) =>
                table(
                  c,
                  [{ head: "Measure" }, { head: "Earlier", num: true, headRight: true }, { head: "Later", num: true, headRight: true }, { head: "Source", src: true, headRight: true }],
                  results.items.map((r) => [r.cells[0], r.cells[1], r.cells[2], r.cells[3] || srcText(r)]),
                  lx,
                  cy,
                  lw,
                ),
              ...withMore(c, results.more, lx, lw),
              (cy) => small(c, "Values are copied as written in the source. Nothing on this page says whether a change matters. That is the clinician's call.", lx, cy, lw),
            ]),
        ]),
      (yy, rx, rw, rowH) => {
        const secs: Child[] = [];
        if (chain.items.length > 0) {
          secs.push((sy) =>
            stack(c, sy, 5, [
              (cy) => h2(c, "The line between them, in my words and my order", rx, cy, rw),
              (cy) => v(c, 2) + chainBlock(c, chain.items, rx, cy + v(c, 2), rw),
              ...withMore(c, chain.more, rx, rw),
            ]),
          );
        }
        secs.push((sy) =>
          stack(c, sy, 5, [
            (cy) => h2(c, "Immunizations and medications given in service", rx, cy, rw),
            (cy) => table(c, [{}, { num: true }, { src: true }], shots.items.map((r) => [r.cells[0], r.cells[1], srcText(r)]), rx, cy, rw),
            ...withMore(c, shots.more, rx, rw),
            ...(immunNote ? [(cy: number) => small(c, immunNote, rx, cy, rw)] : []),
          ]),
        );
        if (p.specimens) secs.push((sy) => stack(c, sy, 5, [(cy) => h2(c, "Stored blood specimens", rx, cy, rw), (cy) => body(c, p.specimens, rx, cy, rw)]));
        if (p.noRecordFoundFor) secs.push((sy) => stack(c, sy, 5, [(cy) => h2(c, "No record found for", rx, cy, rw), (cy) => body(c, p.noRecordFoundFor, rx, cy, rw)]));
        if (p.helpMe) secs.push((sy) => box(c, rx, sy, rw, { label: "How to help me in the room" }, [(cy, iw) => body(c, p.helpMe, boxIn(rx), cy, iw)]));
        if (p.sinceLastVisit) secs.push((sy) => box(c, rx, sy, rw, { label: "Since last visit" }, [(cy, iw) => body(c, p.sinceLastVisit, boxIn(rx), cy, iw)]));
        const writeLine = (cy: number, iw: number) => {
          const lh = v(c, 20);
          hline(c, boxIn(rx), boxIn(rx) + iw, cy + lh - hx(1) / 2, TAGLINE, hx(1), true);
          return lh;
        };
        const notes = (sy: number, minH: number) => box(c, rx, sy, rw, { label: "Notes from this visit (optional)", minH }, [writeLine, writeLine, writeLine]);
        // The notes box grows to the foot of the taller column (flex-grow).
        const before = measure(c, () => stack(c, 0, 10, secs));
        const gapBefore = secs.length ? v(c, 10) : 0;
        const notesMin = Math.max(v(c, 40), rowH - before - gapBefore);
        secs.push((sy) => notes(sy, notesMin));
        return stack(c, yy, 10, secs);
      },
    );

  const sourcesSec = (y: number) => {
    const size = smallPt(c);
    const lh = size * 1.28;
    const g = hx(20);
    const cw = (w - g) / 2;
    const lines = sources.items.map((s) => `${s.number}. ${s.label}${s.source_date ? `, ${s.source_date}` : ""}${s.author ? `. ${s.author}` : ""}. ${STATUS_WORD[s.status]}`);
    const grid2 = (yy: number) => {
      let h = 0;
      for (let i = 0; i < lines.length; i += 2) {
        if (i > 0) h += v(c, 1);
        const a = para(c, lines[i], x, yy + h, cw, { size, lh, color: INK });
        const b = i + 1 < lines.length ? para(c, lines[i + 1], x + cw + g, yy + h, cw, { size, lh, color: INK }) : 0;
        h += Math.max(a, b);
      }
      return h;
    };
    return stack(c, y, 5, [(cy) => h2(c, "Sources, and where each request stands", x, cy, w), grid2, ...withMore(c, sources.more, x, w)]);
  };

  const footLeft = `Signed by the veteran, ${p.name}, ${p.versionDate}, after every row was read back. ${p.assembledBy ? `Assembled by ${p.assembledBy}. ` : ""}Originals are in the veteran's folder and are one request away.`;
  const footRight = `Service Health Summary v1, public domain. Page version ${p.versionDate}.${p.correctionsTo ? ` Corrections to ${p.correctionsTo}.` : ""} Format steward: Operation Whole Health, until a public body takes it over. The steward certifies nothing.`;

  return layoutSide(
    c,
    [(y) => sheetHead(c, p, what, x, y, w)],
    grid,
    [sourcesSec, (y) => rule(c, x, y, w), (y) => foot(c, footLeft, footRight, 290, x, y, w)],
  );
}

// ── fit: shrink, then cut the longest lists, never a third page ──────────────
type SideFn = (c: Ctx, p: PageData, limits: Limits) => number;

function fitSide(doc: JsPDF, p: PageData, fn: SideFn, base: Omit<Ctx, "doc" | "s" | "draw">, counts: Record<string, number>): { s: number; limits: Limits } {
  const ctx = (s: number): Ctx => ({ doc, s, draw: false, ...base });
  const floor = BODY_FLOOR_PT / (base.basePx * PX);
  const steps: number[] = [];
  for (let s = 1; s > floor; s -= 0.03) steps.push(s);
  steps.push(floor);
  for (const s of steps) {
    if (fn(ctx(s), p, {}) <= AVAIL_H) return { s, limits: {} };
  }
  const limits: Limits = { ...counts };
  const c = ctx(floor);
  while (fn(c, p, limits) > AVAIL_H) {
    let key = "";
    for (const k of Object.keys(limits)) if (limits[k] > 1 && (!key || limits[k] > limits[key])) key = k;
    if (!key) break;
    limits[key] -= 1;
  }
  return { s: floor, limits };
}

export async function buildFirstPagePdf(p: PageData): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter", orientation: "portrait" });
  doc.setProperties({ title: "The First Page" });

  const one = { basePx: 13.5, lhMul: 1.3, h2Px: 15, tdPadPx: 3 };
  const two = { basePx: 12.5, lhMul: 1.28, h2Px: 14.5, tdPadPx: 2 };

  const f1 = fitSide(doc, p, side1, one, {
    problems: shown(p.problems).length,
    medications: shown(p.medications).length,
    studies: shown(p.studies).length,
    tried: shown(p.tried).length,
  });
  side1({ doc, s: f1.s, draw: true, ...one }, p, f1.limits);

  doc.addPage("letter", "portrait");
  const f2 = fitSide(doc, p, side2, two, {
    service: shown(p.service).length,
    exposures: shown(p.exposures).length,
    results: shown(p.results).length,
    shots: shown(p.shots).length,
    sources: p.sources.length,
    chain: p.chain.length,
  });
  side2({ doc, s: f2.s, draw: true, ...two }, p, f2.limits);

  return doc.output("blob");
}

export function firstPagePdfName(p: PageData): string {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(p.versionDate) ? p.versionDate : new Date().toISOString().slice(0, 10);
  return `First-Page-${d}.pdf`;
}
