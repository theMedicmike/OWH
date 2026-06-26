import Link from "next/link";
import { ServiceRibbon } from "./Patriotic";

// Public, no-login page shell for legal/trust/support pages — so skeptics,
// clinicians, and veterans can read them before ever creating an account.
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
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <Link href="/"><img src="/owh-logo.png" alt="Operation Whole Health" className="h-9 w-auto object-contain" /></Link>
          <Link href="/" className="text-sm font-medium text-brand hover:underline">← Back to app</Link>
        </div>
      </header>
      <ServiceRibbon />
      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {updated && <p className="mt-1 text-xs text-faint">Last updated: {updated}</p>}
        {intro && <p className="mt-3 text-sm leading-relaxed text-muted">{intro}</p>}
        <div className="mt-6 space-y-3">{children}</div>

        <footer className="mt-10 border-t border-line pt-5 text-xs leading-relaxed text-faint">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/trust" className="hover:text-brand hover:underline">What this is</Link>
            <Link href="/privacy" className="hover:text-brand hover:underline">Privacy</Link>
            <Link href="/terms" className="hover:text-brand hover:underline">Terms</Link>
            <Link href="/support" className="hover:text-brand hover:underline">Support</Link>
            <a href="mailto:michael@operationwholehealth.org?subject=Connecting%20the%20Dots%20feedback" className="hover:text-brand hover:underline">Send feedback</a>
          </div>
          <p className="mt-3">
            Operation Whole Health is a Patriot-founded 501(c)(3) nonprofit. Connecting the Dots of
            Service is an estimate and a record — not a diagnosis, medical advice, legal advice, or a
            determination of service connection. Veterans Crisis Line: dial 988, then press 1.
          </p>
        </footer>
      </div>
    </main>
  );
}

export function H({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-3 text-base font-bold text-ink">{children}</h2>;
}
export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-muted">{children}</p>;
}
