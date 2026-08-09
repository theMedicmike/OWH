import Link from "next/link";
import WitnessStatementCard from "@/components/WitnessStatementCard";

// Where a witness lands from a link a veteran sent them — a spouse, a battle
// buddy, a commander. No account, no sign-in. Deliberately outside AppShell,
// same reasoning as /reset: one card, one job, no record navigation to get lost in.
export const metadata = {
  title: "Confirm a veteran's record",
};

export default async function StatementPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 block text-center">
          <span className="text-lg font-bold tracking-tight text-ink">Connecting the Dots</span>
          <span className="block text-xs font-medium uppercase tracking-widest text-muted">of Service</span>
        </Link>

        <WitnessStatementCard token={token} />

        <p className="mt-6 text-center text-[11px] leading-relaxed text-faint">
          If you or someone you know is struggling, the Veterans Crisis Line is here 24/7 — dial 988, then press 1.
        </p>
      </div>
    </main>
  );
}
