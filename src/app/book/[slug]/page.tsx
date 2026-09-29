import AppShell from "@/components/AppShell";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { BOOK_CHAPTERS, BOOK_TITLE, BOOK_AUTHOR, type BookChapter } from "@/content/book";
import ReaderClient from "@/components/ReaderClient";
import { BOOK_PUBLIC } from "@/lib/bookVisibility";
import { isHeavy, isMemoriamOnly, canShareChapter } from "@/content/heavyChapters";

export function generateStaticParams() {
  return BOOK_PUBLIC ? BOOK_CHAPTERS.map((c) => ({ slug: c.slug })) : [];
}

// CHAPTER NUMBERS DRIFT; TITLES DO NOT. Every chapter URL carries its ordinal
// ("38-the-work-that-went-first"), so inserting a chapter silently changes the
// address of every chapter after it. That happened on 2026-09-23: a 74 -> 81
// update moved 65 of them, and 65 URLs that Google had already indexed — most
// of the book — became 404s at once. For a site whose whole point is that the
// chapters are publicly readable, that is the worst possible failure, and it is
// completely silent.
//
// So an unknown slug is not automatically a 404. If its TITLE portion still
// matches a real chapter, the request is an old address for a chapter that
// still exists, and it gets a permanent redirect to the current one. 308 tells
// a crawler to move the ranking to the new address rather than drop the page.
// This is general, not a list of the 65: it fixes every past renumber and every
// future one without anyone having to remember to add redirects.
const baseSlug = (slug: string) => slug.replace(/^\d+-/, "");

// The one case base-slug matching cannot catch: a RETITLE changes the title
// portion too, so there is nothing left to match on. "A Letter to the Veteran"
// became "Roll Call" in the 2026-09-23 update. Add an entry here whenever a
// published chapter is renamed, keyed old -> new base slug.
const RETITLED: Record<string, string> = {
  "a-letter-to-the-veteran": "roll-call",
};

function canonicalFor(slug: string): BookChapter | undefined {
  const key = baseSlug(slug);
  const target = RETITLED[key] ?? key;
  return BOOK_CHAPTERS.find((c) => baseSlug(c.slug) === target);
}

function clip(text: string, max: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const trimmed = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${trimmed.replace(/[\s,;:.—-]+$/, "")}…`;
}

// A chapter's search description is its own opening line. That gives 74
// distinct snippets instead of 74 copies of one blurb, and a chapter's first
// sentence is the most honest one-line summary it has.
//
// TWO exceptions, and both reuse an existing list rather than re-listing slugs
// here, so they cannot drift from the rules the reader already enforces.
//
// isHeavy() — the suicide and MST chapters plus MEMORIAM_ONLY, the real people
// this book buries. The reader gates those behind a content warning and strips
// their share buttons. An opening line lifted out of that gating and dropped
// into a Google result arrives with no warning, no context, and no crisis line
// under it.
//
// !canShareChapter() — NO_SHARE: real named people and private first-person
// testimony. That list exists because in-app reading consent is not consent to
// redistribute a private person's name and words, and a meta description is
// redistribution — it is the one line of the chapter that leaves the site and
// lands in a search index. Today "in-their-own-words" happens to open on a
// crisis-line note, so nothing leaks; that is luck, not design, and one
// regeneration of book.ts (scripts/genbook.cjs) would spend it.
function chapterDescription(chapter: BookChapter): string {
  const fallback = `Chapter ${chapter.number} of ${BOOK_TITLE} by ${BOOK_AUTHOR}. Free to read, no sign-in.`;
  if (isHeavy(chapter.slug)) {
    return `Chapter ${chapter.number} of ${BOOK_TITLE}. This chapter covers difficult material and opens with a content note. Free to read. Veterans Crisis Line: dial 988, then press 1.`;
  }
  if (!canShareChapter(chapter.slug)) return fallback;
  const body = chapter.paragraphs.find((p) => p.type === "p")?.text;
  return body ? clip(body, 155) : fallback;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  if (!BOOK_PUBLIC) return { title: BOOK_TITLE, robots: { index: false, follow: false } };
  const { slug } = await params;
  const chapter = BOOK_CHAPTERS.find((c) => c.slug === slug) ?? canonicalFor(slug);
  if (!chapter) return { title: BOOK_TITLE };
  return {
    title: chapter.title,
    description: chapterDescription(chapter),
    alternates: { canonical: `/book/${chapter.slug}` },
  };
}

export default async function ChapterPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!BOOK_PUBLIC) notFound();
  const { slug } = await params;
  const idx = BOOK_CHAPTERS.findIndex((c) => c.slug === slug);
  if (idx === -1) {
    const moved = canonicalFor(slug);
    if (moved) permanentRedirect(`/book/${moved.slug}`);
    notFound();
  }
  const chapter = BOOK_CHAPTERS[idx];
  const prev = BOOK_CHAPTERS[idx - 1];
  const next = BOOK_CHAPTERS[idx + 1];

  return (
    <AppShell title="The Book" publicPage>
      <article className="mx-auto max-w-2xl">
        <Link href="/book" className="text-xs font-medium text-brand hover:underline">← All chapters</Link>
        <div className="mt-3 text-xs font-bold uppercase tracking-widest text-accent">Chapter {chapter.number}</div>
        <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight text-ink">{chapter.title}</h1>

        <div className="mt-5">
          <ReaderClient
            key={chapter.slug}
            chapter={chapter}
            prevSlug={prev?.slug}
            nextSlug={next?.slug}
            heavy={isHeavy(chapter.slug)}
            memoriamOnly={isMemoriamOnly(chapter.slug)}
            canShare={canShareChapter(chapter.slug)}
          />
        </div>

        <nav className="mt-8 flex items-stretch justify-between gap-3 border-t border-line pt-5">
          {prev ? (
            <Link href={`/book/${prev.slug}`} className="flex-1 rounded-xl border border-line bg-surface px-4 py-3 transition hover:border-brand/40 hover:shadow-sm">
              <div className="text-[11px] text-faint">← Previous</div>
              <div className="mt-0.5 text-sm font-medium text-ink">{prev.title}</div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
          {next ? (
            <Link href={`/book/${next.slug}`} className="flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-right transition hover:border-brand/40 hover:shadow-sm">
              <div className="text-[11px] text-faint">Next →</div>
              <div className="mt-0.5 text-sm font-medium text-ink">{next.title}</div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </nav>

        <p className="mt-6 text-xs leading-relaxed text-faint">
          From <em>{BOOK_TITLE}</em> by {BOOK_AUTHOR} — early edition. Veterans Crisis Line: dial 988, then press 1.
        </p>
      </article>
    </AppShell>
  );
}
