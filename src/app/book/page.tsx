import AppShell from "@/components/AppShell";
import Link from "next/link";
import { ServiceRibbon } from "@/components/Patriotic";
import { BOOK_CHAPTERS, BOOK_TITLE, BOOK_SUBTITLE, BOOK_AUTHOR } from "@/content/book";

export const metadata = {
  title: BOOK_TITLE,
  description: `${BOOK_SUBTITLE}. ${BOOK_AUTHOR}'s book on what service costs the body — all ${BOOK_CHAPTERS.length} chapters free to read, no sign-in, nothing for sale.`,
  alternates: { canonical: "/book" },
};

export default function BookPage() {
  return (
    <AppShell title="The Book" publicPage>
      <div className="mx-auto max-w-2xl">
        <ServiceRibbon className="mb-5 w-40 rounded-full opacity-90" />
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Read it free — our thanks for your service</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">{BOOK_TITLE}</h2>
        <p className="mt-1 text-sm text-muted">{BOOK_SUBTITLE} · by {BOOK_AUTHOR}</p>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          This is the book behind everything in this app — the science, the stories, and the reason it
          exists. It&apos;s yours to read, free. This is an early edition still being refined, so a few
          pages may read a little rough. Take it at your own pace.
        </p>

        <div className="mt-6 space-y-1.5">
          {BOOK_CHAPTERS.map((c) => (
            <Link
              key={c.slug}
              href={`/book/${c.slug}`}
              className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 transition hover:border-brand/40 hover:shadow-sm"
            >
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                {c.number}
              </span>
              <span className="text-sm font-medium text-ink">{c.title}</span>
            </Link>
          ))}
        </div>

        <p className="mt-6 border-t border-line pt-4 text-xs leading-relaxed text-faint">
          © {BOOK_AUTHOR}. An early, pre-release edition shared with the veterans using this app. If
          anything here feels heavy, the Veterans Crisis Line is one tap away: dial 988, then press 1.
        </p>
      </div>
    </AppShell>
  );
}
