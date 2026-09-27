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
const chapters = src.chapters.map((c) => ({
  slug: c.slug,
  number: c.number,
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
