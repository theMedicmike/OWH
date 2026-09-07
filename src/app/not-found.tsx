import Link from "next/link";
import InfoPage from "@/components/InfoPage";

// A branded 404. The public half of this site is designed to be shared by text
// message — a veteran sends his wife a book chapter, or his doctor the C&P page
// — and a mistyped or renamed link is the commonest way that fails. Until now
// it landed on Next's bare "404: This page could not be found", the one screen
// in the whole app with no logo, no way back, and no crisis line.
//
// Also an SEO nicety: Next returns a real 404 status with this, so a dead URL
// is dropped from the index instead of lingering as a soft-404.
export const metadata = {
  title: "That page isn't here",
  description: "The page you're looking for has moved or never existed. Here's the way back.",
  robots: { index: false, follow: true },
};

const LINKS: { href: string; label: string; blurb: string }[] = [
  { href: "/learn", label: "Exposure library", blurb: "What your service may have exposed you to, and what the government already links to it." },
  { href: "/presumptives", label: "What VA presumes", blurb: "The published lists, by where and when you served." },
  { href: "/book", label: "Read the book", blurb: "What Happened to Our Veterans — free, all chapters." },
  { href: "/vso", label: "Find a VSO", blurb: "Free, accredited help near you, from VA's own list." },
  { href: "/", label: "Start your free record", blurb: "Where you served, what happened, what it cost you." },
];

export default function NotFound() {
  return (
    <InfoPage
      title="That page isn't here"
      intro="The link may have been mistyped, or the page may have moved. Nothing is wrong with your record — this is just a wrong address. Here is everything worth reading, one tap away."
    >
      <ul className="mt-2 space-y-3">
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="block rounded-xl border border-line bg-surface p-4 transition hover:border-brand/40 hover:shadow-sm"
            >
              <span className="text-sm font-semibold text-brand">{l.label} →</span>
              <span className="mt-0.5 block text-xs leading-snug text-muted">{l.blurb}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm leading-relaxed text-muted">
        If you are in crisis, the Veterans Crisis Line is{" "}
        <strong className="text-ink">988, then press 1</strong> — free, confidential, 24 hours a day.
      </p>
    </InfoPage>
  );
}
