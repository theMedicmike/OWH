import AppShell from "@/components/AppShell";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BOOK_CHAPTERS, BOOK_TITLE, BOOK_AUTHOR } from "@/content/book";

export function generateStaticParams() {
  return BOOK_CHAPTERS.map((c) => ({ slug: c.slug }));
}

export default async function ChapterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const idx = BOOK_CHAPTERS.findIndex((c) => c.slug === slug);
  if (idx === -1) notFound();
  const chapter = BOOK_CHAPTERS[idx];
  const prev = BOOK_CHAPTERS[idx - 1];
  const next = BOOK_CHAPTERS[idx + 1];

  return (
    <AppShell title="The Book">
      <article className="mx-auto max-w-2xl">
        <Link href="/book" className="text-xs font-medium text-brand hover:underline">← All chapters</Link>
        <div className="mt-3 text-xs font-bold uppercase tracking-widest text-accent">Chapter {chapter.number}</div>
        <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight text-ink">{chapter.title}</h1>

        <div className="mt-5 space-y-4">
          {chapter.paragraphs.map((p, i) =>
            p.type === "h" ? (
              <h2 key={i} className="pt-3 text-lg font-bold text-ink">{p.text}</h2>
            ) : (
              <p key={i} className="text-[15px] leading-7 text-ink/90">{p.text}</p>
            )
          )}
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
