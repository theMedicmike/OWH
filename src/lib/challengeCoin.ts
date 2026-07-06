// "The Challenge Coin" — mint a book passage into a navy-and-gold keepsake card,
// then share it. All canvas + share logic lives here so components stay
// declarative. No new deps; pure browser APIs.
//
// NOTE: we intentionally do NOT import from src/content/book.ts (1.6 MB) — the
// title/author are tiny and stable, so we hold them here to keep the manuscript
// out of the client bundle.

export const PUBLIC_URL = "https://owh-three.vercel.app";
const CARD_TITLE = "What Happened to Our Veterans";
const CARD_AUTHOR = "Michael Andrew Feller Jones";

// The author speaks in serif; the app speaks in sans. Georgia (+ generic serif
// fallback) is on virtually every target device, so the card keeps its
// cream-serif-on-navy soul with zero bundled font. A custom brand serif can be
// dropped in later by swapping this one constant.
const SERIF = 'Georgia, "Times New Roman", serif';

export type CardStyle = "standard" | "night" | "memoriam";
export type CardSize = "post" | "story";

export type CardOpts = {
  passage: string;
  chapterNumber: number;
  chapterTitle: string;
  style: CardStyle;
  size: CardSize;
  heavy: boolean;
  memoriamOnly: boolean; // chapter is memoriam-only → always suppress promo/seal
};

export const CARD_DIMS: Record<CardSize, { w: number; h: number }> = {
  post: { w: 1080, h: 1350 },
  story: { w: 1080, h: 1920 },
};

const COLORS = {
  gold: "#c1873d",
  scarlet: "#9e2a2b",
  cream: "#f3ead6",
  flag: "#3a6ea5",
  white: "#ffffff",
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  const flush = () => { if (line) { lines.push(line); line = ""; } };
  for (let word of words) {
    // Hard-break any single word wider than the line (e.g. a long URL/token),
    // wherever it occurs — not only when it's first on a line.
    while (ctx.measureText(word).width > maxW) {
      flush();
      let chunk = "";
      let broke = false;
      for (let k = 0; k < word.length; k++) {
        if (ctx.measureText(chunk + word[k]).width > maxW && chunk) {
          lines.push(chunk);
          word = word.slice(k);
          broke = true;
          break;
        }
        chunk += word[k];
      }
      if (!broke) break; // a single glyph already exceeds maxW — give up gracefully
    }
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxW || !line) line = test;
    else { lines.push(line); line = word; }
  }
  flush();
  return lines;
}

function fitOneLine(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  return t.trim() + "…";
}

function drawSeal(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.strokeStyle = COLORS.gold;
  ctx.fillStyle = COLORS.gold;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, 66, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, 54, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 0.5;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 34px ${SERIF}`;
  ctx.fillText("250", cx, cy - 8);
  ctx.font = `700 14px ${SERIF}`;
  ctx.fillText("1776–2026", cx, cy + 20);
  ctx.restore();
}

// Draws the full card at native resolution into the given context.
export function drawCard(ctx: CanvasRenderingContext2D, opts: CardOpts) {
  const { w: W, h: H } = CARD_DIMS[opts.size];
  const memoriam = opts.memoriamOnly || opts.style === "memoriam";
  const navy = opts.style === "night" ? "#102438" : "#16314f";
  const PAD = 96;

  ctx.clearRect(0, 0, W, H);
  // ground (flat — a gradient cheapens it)
  ctx.fillStyle = navy;
  ctx.fillRect(0, 0, W, H);

  // inset gold hairline frame, squared corners
  ctx.strokeStyle = COLORS.gold;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.globalAlpha = 1;

  // 250th seal, top-right — the single flourish (suppressed on memoriam)
  if (!memoriam) drawSeal(ctx, W - 175, 150);

  // eyebrow: chapter number + title
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = COLORS.gold;
  ctx.font = `600 23px ${SERIF}`;
  const eyebrow = `CHAPTER ${opts.chapterNumber} · ${opts.chapterTitle.toUpperCase()}`;
  ctx.fillText(fitOneLine(ctx, eyebrow, W - PAD - 190), PAD, 250);

  // scarlet tick — the only scarlet on a standard card
  ctx.fillStyle = COLORS.scarlet;
  ctx.fillRect(PAD, 272, 68, 6);

  // the passage — the hero. cream serif, auto-fit, vertically centered.
  const footerY = H - 180;
  const regionTop = 340;
  const regionBottom = footerY - (opts.heavy && !memoriam ? 96 : 48);
  const maxW = W - PAD * 2;
  const sizes = [62, 56, 50, 44, 40, 36, 32];
  let fs = sizes[sizes.length - 1];
  let lines: string[] = [];
  for (const candidate of sizes) {
    ctx.font = `600 ${candidate}px ${SERIF}`;
    const wrapped = wrapText(ctx, opts.passage, maxW);
    fs = candidate;
    lines = wrapped;
    if (wrapped.length * candidate * 1.34 <= regionBottom - regionTop) break;
  }
  ctx.font = `600 ${fs}px ${SERIF}`;
  const lh = fs * 1.34;
  // Even at the smallest font, a very long passage could run past the footer —
  // clamp to the lines that fit and ellipsize the last one.
  const maxLines = Math.max(1, Math.floor((regionBottom - regionTop) / lh));
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    let tail = lines[maxLines - 1];
    while (tail.length > 1 && ctx.measureText(tail + "…").width > maxW) tail = tail.slice(0, -1);
    lines[maxLines - 1] = tail.replace(/\s+$/, "") + "…";
  }
  const blockH = lines.length * lh;
  let y = regionTop + Math.max(0, (regionBottom - regionTop - blockH) / 2) + fs;
  ctx.fillStyle = COLORS.cream;
  for (const line of lines) {
    ctx.fillText(line, PAD, y);
    y += lh;
  }

  // footer rule
  ctx.strokeStyle = COLORS.gold;
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(PAD, footerY); ctx.lineTo(W - PAD, footerY); ctx.stroke();
  ctx.globalAlpha = 1;

  // footer left — title over author
  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.white;
  ctx.font = `600 26px ${SERIF}`;
  ctx.fillText(fitOneLine(ctx, CARD_TITLE, W - PAD * 2 - 240), PAD, footerY + 48);
  ctx.globalAlpha = 0.62;
  ctx.fillStyle = COLORS.cream;
  ctx.font = `20px ${SERIF}`;
  ctx.fillText(CARD_AUTHOR, PAD, footerY + 82);
  ctx.globalAlpha = 1;

  // footer right — promo, or crisis line on memoriam
  ctx.textAlign = "right";
  if (!memoriam) {
    ctx.fillStyle = COLORS.flag;
    ctx.font = `17px ${SERIF}`;
    ctx.fillText("READ FREE", W - PAD, footerY + 46);
    ctx.fillStyle = COLORS.gold;
    ctx.font = `22px ${SERIF}`;
    ctx.fillText("owh-three.vercel.app", W - PAD, footerY + 80);
  } else {
    ctx.fillStyle = COLORS.scarlet;
    ctx.font = `600 20px ${SERIF}`;
    ctx.fillText("Veterans Crisis Line", W - PAD, footerY + 46);
    ctx.fillStyle = COLORS.cream;
    ctx.font = `20px ${SERIF}`;
    ctx.fillText("988 · then press 1", W - PAD, footerY + 80);
  }

  // heavy (non-memoriam): crisis line rides with the quote, below the footer
  // block (clear of the author line, above the frame's bottom edge).
  if (opts.heavy && !memoriam) {
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.scarlet;
    ctx.font = `600 20px ${SERIF}`;
    ctx.fillText("Veterans Crisis Line — 988, then press 1", W / 2, H - 58);
  }
  ctx.textAlign = "left";
}

// Ensure any declared web fonts are ready, then draw. (Georgia is a system font,
// so this is belt-and-suspenders for when a custom serif is later bundled.)
export async function ensureFonts() {
  try {
    const fonts = (document as unknown as { fonts?: FontFaceSet }).fonts;
    if (fonts?.ready) await fonts.ready;
  } catch { /* ignore */ }
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not render the card image."))), "image/png"),
  );
}

export function buildCaption(passage: string, heavy: boolean): string {
  const base = `"${passage}"\n— ${CARD_TITLE}, by ${CARD_AUTHOR}\nRead it free · ${PUBLIC_URL}`;
  return heavy ? `${base}\nVeterans Crisis Line — 988, then press 1.` : base;
}

// Native share (mobile magic path). Returns 'shared' when the OS sheet handled
// it (or the user cancelled), 'fallback' when native file-share isn't available.
export async function shareCard(blob: Blob, caption: string): Promise<"shared" | "fallback"> {
  const file = new File([blob], "owh-quote.png", { type: "image/png" });
  const nav = navigator as Navigator & {
    canShare?: (d?: ShareData) => boolean;
    share?: (d: ShareData) => Promise<void>;
  };
  const data = { files: [file], text: caption, url: `${PUBLIC_URL}?ref=card` } as ShareData;
  if (nav.canShare && nav.share && nav.canShare(data)) {
    try {
      await nav.share(data);
      return "shared";
    } catch (e) {
      if ((e as DOMException)?.name === "AbortError") return "shared"; // user cancelled
      return "fallback";
    }
  }
  return "fallback";
}

export function canShareFiles(): boolean {
  const nav = navigator as Navigator & { canShare?: (d?: ShareData) => boolean };
  try {
    return !!nav.canShare && nav.canShare({ files: [new File([new Blob()], "x.png", { type: "image/png" })] });
  } catch {
    return false;
  }
}

export function downloadBlob(blob: Blob, filename = "owh-quote.png") {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function copyImage(blob: Blob): Promise<boolean> {
  try {
    const CI = (window as unknown as { ClipboardItem?: typeof ClipboardItem }).ClipboardItem;
    if (!CI || !navigator.clipboard?.write) return false;
    // Safari needs a Promise entry; Promise.resolve works everywhere.
    await navigator.clipboard.write([new CI({ "image/png": Promise.resolve(blob) })]);
    return true;
  } catch {
    return false;
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export const tweetHref = (caption: string) =>
  `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}&url=${encodeURIComponent(`${PUBLIC_URL}?ref=card`)}`;
export const facebookHref = () =>
  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${PUBLIC_URL}?ref=card`)}`;
export const smsHref = (caption: string) => `sms:?&body=${encodeURIComponent(caption)}`;
