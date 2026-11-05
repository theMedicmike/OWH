#!/usr/bin/env node
/**
 * genbook — regenerate src/content/book.ts from the book's source of truth.
 *
 * Usage:  node scripts/genbook.cjs [--check]
 *   --check  print the chapter table and exit without writing
 *
 * This script is the ONLY supported way to update src/content/book.ts.
 * It has been lost twice by living in a temp scratchpad. It lives here now.
 *
 * WHERE THE BOOK COMES FROM (changed 2026-09-23 — read this before "fixing" it):
 * This used to re-parse the FULL_MANUSCRIPT markdown and reverse-engineer the
 * book's structure out of its headings. That worked until the manuscript and the
 * book stopped being the same document. Measured on 2026-09-23, the markdown was
 * missing "The Ringing" entirely and still called "Roll Call" by its old title,
 * "A Letter to the Veteran" — so this app shipped 74 chapters while both other
 * surfaces (the reader SPA and the Desktop static site) shipped 81. The app was
 * seven chapters behind the book its own learning pages quote from.
 *
 * book-data.json is the file the other two surfaces build from, and its chapter
 * records are ALREADY exactly the BookChapter shape below — same slug, number,
 * title, and {type,text} paragraphs. Re-deriving that from prose was inventing a
 * second parser to produce a file we already had. Now we read it. The whole class
 * of drift bug goes away: if the book changes, this app changes with it.
 *
 * The two book-data.json copies (Desktop site + wwtov-reader) are kept byte-
 * identical by the integrity harness; the Desktop one is the source of truth, so
 * that is the one read here.
 *
 * SAFETY: src/content/heavyChapters.ts gates the crisis UI by TITLE slug
 * (number-independent). If a chapter title changes upstream, that gate silently
 * stops firing for it. After running this, always run:
 *     node scripts/verify-gating.cjs
 * and confirm every heavyChapters key still resolves. `npm run build` will
 * not catch a broken gate.
 */
const fs = require("fs");
const path = require("path");

const BOOK_DATA =
  "C:/Users/Michael Andrew Jones/OneDrive/Desktop/What Happened to Our Veterans - Website/book-data.json";
const OUT = path.join(__dirname, "..", "src", "content", "book.ts");

const src = JSON.parse(fs.readFileSync(BOOK_DATA, "utf8"));

const BOOK_TITLE = src.title;
const BOOK_SUBTITLE = src.subtitle;
const BOOK_AUTHOR = src.author;

// Take only the fields this app renders, in a fixed order, so an upstream field
// addition cannot silently bloat the bundle or leak an editorial-only flag into
// the client. Anything new upstream must be added here deliberately.
// Since 2026-11-05 the book numbers only body chapters (industry standard): readers see
// "Chapter 1 of 67" and front/back matter carry no number. The reader SPA owns the list of
// front/back matter; read it so the two surfaces can never number differently.
// display = the number a reader sees (0 for front/back matter). number stays the internal
// sequence that slugs, gating and links key off.
const MATTER = JSON.parse(
  fs.readFileSync("C:/Users/Michael Andrew Jones/wwtov-reader/src/matter.json", "utf8")
);
const FRONT = new Set(MATTER.front);
const BACK = new Set(MATTER.back);
let bodyN = 0;
const kindOf = (slug) => {
  const base = slug.replace(/^\d+-/, "");
  return FRONT.has(base) ? "front" : BACK.has(base) ? "back" : "body";
};
const chapters = src.chapters.map((c) => ({
  slug: c.slug,
  number: c.number,
  display: kindOf(c.slug) === "body" ? ++bodyN : 0,
  kind: kindOf(c.slug),
  title: c.title,
  paragraphs: c.paragraphs.map((p) => ({ type: p.type, text: p.text })),
}));

// Fail loudly rather than write a book that cannot be gated or linked.
const problems = [];
const seen = new Set();
chapters.forEach((c, i) => {
  if (c.number !== i + 1) problems.push(`chapter ${i + 1} carries number ${c.number}`);
  if (!/^\d+-.+/.test(c.slug)) problems.push(`slug "${c.slug}" is not "NN-title"`);
  if (seen.has(c.slug)) problems.push(`duplicate slug "${c.slug}"`);
  seen.add(c.slug);
  if (!c.paragraphs.length) problems.push(`"${c.slug}" has no paragraphs`);
});
if (problems.length) {
  console.error("*** REFUSING TO WRITE book.ts ***");
  problems.forEach((p) => console.error("   " + p));
  process.exit(1);
}

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

const header = `// AUTO-GENERATED from book-data.json — do not edit by hand.
// Regenerate:  node scripts/genbook.cjs
// Verify:      node scripts/verify-gating.cjs   (confirm heavyChapters keys still resolve)

export type BookParagraph = { type: string; text: string };
export type BookChapter = { slug: string; number: number; display: number; kind: "front" | "back" | "body"; title: string; paragraphs: BookParagraph[] };

export const BOOK_TITLE = ${JSON.stringify(BOOK_TITLE)};
export const BOOK_SUBTITLE = ${JSON.stringify(BOOK_SUBTITLE)};
export const BOOK_AUTHOR = ${JSON.stringify(BOOK_AUTHOR)};

export const BOOK_CHAPTERS: BookChapter[] = ${JSON.stringify(chapters)};

/** Numbered body chapters only; front and back matter are unnumbered. */
export const BOOK_BODY_COUNT = ${bodyN};

/** "Chapter 12" for a body chapter, "Front matter" / "Back matter" otherwise. */
export function chapterLabel(c: Pick<BookChapter, "display" | "kind">): string {
  if (c.display) return "Chapter " + c.display;
  return c.kind === "front" ? "Front matter" : "Back matter";
}
`;

fs.writeFileSync(OUT, header, "utf8");
console.log(
  `wrote ${OUT}\n${chapters.length} chapters, ${chapters.reduce(
    (n, c) => n + c.paragraphs.length,
    0
  )} paragraphs`
);
