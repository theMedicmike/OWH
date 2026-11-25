import Link from "next/link";

// The public reading layout: Trust, Privacy, Terms, Support, and the two
// printable primers. Same type, buttons and footer as the app proper, so a
// veteran who lands here from a search does not feel he has left.
export default function InfoPage({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro?: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 border-b border-line bg-white/92 backdrop-blur print:static print:bg-white">
        <div className="mx-auto flex min-h-14 max-w-3xl items-center justify-between gap-3 px-5">
          <Link href="/" className="flex items-center gap-3 rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/owh-round.png" alt="" className="h-9 w-9 object-contain" />
            <span className="text-[15px] font-semibold tracking-tight text-ink">Connecting the Dots</span>
          </Link>
          <Link href="/" className="btn btn-secondary btn-sm print:hidden">Back to the app</Link>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
        <h1 className="display text-[2rem] text-ink sm:text-[2.375rem]">{title}</h1>
        {updated && <p className="mt-2 text-sm text-muted">Last updated {updated}</p>}
        {intro && <p className="mt-4 text-[17px] leading-relaxed text-muted">{intro}</p>}
        <div className="mt-8 space-y-4">{children}</div>

        <footer className="mt-12 border-t border-line pt-6 text-sm leading-relaxed text-muted print:hidden">
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            <Link href="/trust" className="hover:text-brand hover:underline">What this is</Link>
            <Link href="/privacy" className="hover:text-brand hover:underline">Privacy</Link>
            <Link href="/terms" className="hover:text-brand hover:underline">Terms</Link>
            <Link href="/support" className="hover:text-brand hover:underline">Support</Link>
            <a href="mailto:michael@operationwholehealth.org?subject=Connecting%20the%20Dots%20feedback" className="hover:text-brand hover:underline">Send feedback</a>
          </div>
          <p className="mt-4">
            Operation Whole Health is a 501(c)(3) nonprofit. Connecting the Dots of Service is a record, not a
            diagnosis, medical advice, legal advice, or a determination of service connection. Veterans Crisis
            Line: dial 988, then press 1.
          </p>
        </footer>
      </div>
    </main>
  );
}

export function H({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-5 text-xl font-semibold tracking-tight text-ink">{children}</h2>;
}
export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[16px] leading-relaxed text-muted">{children}</p>;
}
