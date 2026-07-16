#!/usr/bin/env node
/**
 * genbook — regenerate src/content/book.ts from the manuscript.
 *
 * Usage:  node scripts/genbook.cjs [--check]
 *   --check  print the chapter table and exit without writing
 *
 * This script is the ONLY supported way to update src/content/book.ts.
 * It has been lost twice by living in a temp scratchpad. It lives here now.
 *
 * SAFETY: src/content/heavyChapters.ts gates the crisis UI by TITLE slug
 * (number-independent). If a chapter title changes here, that gate silently
 * stops firing for it. After running this, always run:
 *     node scripts/genbook.cjs --check
 * and confirm every heavyChapters key still resolves. `npm run build` will
 * not catch a broken gate.
 *
 * Manuscript rules this reproduces (reverse-engineered from the prior output):
 *   - Everything before the first standalone '---' is the title page. Skipped.
 *   - '# Part X' immediately followed by '# Subtitle' is a part divider. Skipped.
 *   - '# Front Matter' is a container: its '##' sections each become a chapter.
 *   - 'Contents' (a stale TOC) and 'Foreword' (an unfilled [NEEDS:] placeholder)
 *     are excluded entirely. Including them would add two chapters and shift
 *     every number after them.
 *   - Any other '# Heading' is a chapter.
 *   - Inside a chapter, '##'/'###' become {type:'h'}; prose becomes {type:'p'}.
 *   - Titles drop ':' but keep em-dashes. Slug is NN-kebab of the title.
 *   - '@@FIG:...@@' markers and '---' rules are dropped (PDF-only constructs).
 *   - Bold/italic markers stripped; '- x' becomes '• x'; table rows flattened.
 */
const fs = require("path") && require("fs");
const path = require("path");

const MANUSCRIPT =
  "C:\\Users\\Michael Andrew Jones\\.claude\\projects\\C--Users-Michael-Andrew-Jones--claude\\knowledge\\What_Happened_To_Our_Veterans_FULL_MANUSCRIPT.md";
const OUT = path.join(__dirname, "..", "src", "content", "book.ts");

const BOOK_TITLE = "What Happened to Our Veterans";
const BOOK_SUBTITLE = "The Biological Cascade and the Price of Service";
const BOOK_AUTHOR = "Michael Andrew Feller Jones";

// Front-matter sections that are not chapters. See header note.
const FRONT_MATTER_SKIP = new Set(["contents", "foreword"]);

const slugify = (title) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const titleize = (raw) => raw.replace(/:/g, "").trim();

/** Convert one manuscript line to display text, or null to drop it. */
function clean(line) {
  let t = line.trim();
  if (!t) return null;
  if (/^@@FIG:/.test(t)) return null;
  if (t === "---") return null;

  if (/^\|/.test(t)) {
    if (/^\|[\s:\-|]+\|?\s*$/.test(t)) return null; // separator row
    t = t
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim())
      .join("  |  ");
  } else {
    t = t.replace(/^>\s?/, "");
    t = t.replace(/^[-*]\s+/, "• ");
  }

  t = t.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*([^*]+?)\*/g, "$1");
  return t.trim() || null;
}

function parse(lines) {
  const chapters = [];
  let cur = null;
  let inFrontMatter = false;

  // Skip the title page: everything through the first standalone '---'.
  let i = 0;
  while (i < lines.length && lines[i].trim() !== "---") i++;
  i++;

  const push = (rawTitle) => {
    const title = titleize(rawTitle);
    cur = { title, paragraphs: [] };
    chapters.push(cur);
  };

  for (; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t) continue;

    // Part divider: '# Part X' + immediate '# Subtitle'
    if (/^#\s+Part\s+/i.test(t) && (lines[i + 1] || "").trim().match(/^#\s+/)) {
      i++;
      continue;
    }

    const h1 = t.match(/^#\s+(.+)$/);
    if (h1) {
      if (/^front matter$/i.test(h1[1].trim())) {
        inFrontMatter = true;
        cur = null;
      } else {
        inFrontMatter = false;
        push(h1[1]);
      }
      continue;
    }

    const h2 = t.match(/^##\s+(.+)$/);
    if (h2 && inFrontMatter) {
      const name = titleize(h2[1]);
      if (FRONT_MATTER_SKIP.has(name.toLowerCase())) {
        cur = null; // drop this section's body too
      } else {
        push(h2[1]);
      }
      continue;
    }

    if (!cur) continue; // inside a skipped section

    const hx = t.match(/^#{2,6}\s+(.+)$/);
    if (hx) {
      const text = clean(hx[1]);
      if (text) cur.paragraphs.push({ type: "h", text });
      continue;
    }

    const text = clean(t);
    if (text) cur.paragraphs.push({ type: "p", text });
  }

  return chapters.map((c, idx) => ({
    slug: String(idx + 1).padStart(2, "0") + "-" + slugify(c.title),
    number: idx + 1,
    title: c.title,
    paragraphs: c.paragraphs,
  }));
}

const raw = fs.readFileSync(MANUSCRIPT, "utf8");
const chapters = parse(raw.split(/\r?\n/));

if (process.argv.includes("--check")) {
  console.log(`${chapters.length} chapters\n`);
  for (const c of chapters) {
    console.log(
      String(c.number).padStart(2) +
        "  " +
        c.slug.padEnd(58) +
        String(c.paragraphs.length).padStart(4) +
        " paras"
    );
  }
  process.exit(0);
}

const header = `// AUTO-GENERATED from the manuscript — do not edit by hand.
// Regenerate:  node scripts/genbook.cjs
// Verify:      node scripts/genbook.cjs --check   (confirm heavyChapters keys still resolve)

export type BookParagraph = { type: string; text: string };
export type BookChapter = { slug: string; number: number; title: string; paragraphs: BookParagraph[] };

export const BOOK_TITLE = ${JSON.stringify(BOOK_TITLE)};
export const BOOK_SUBTITLE = ${JSON.stringify(BOOK_SUBTITLE)};
export const BOOK_AUTHOR = ${JSON.stringify(BOOK_AUTHOR)};

export const BOOK_CHAPTERS: BookChapter[] = ${JSON.stringify(chapters)};
`;

fs.writeFileSync(OUT, header, "utf8");
console.log(
  `wrote ${OUT}\n${chapters.length} chapters, ${chapters.reduce(
    (n, c) => n + c.paragraphs.length,
    0
  )} paragraphs`
);
