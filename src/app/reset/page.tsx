import Link from "next/link";
import ResetPasswordCard from "@/components/ResetPasswordCard";

// The destination of the "set a new password" email. The PKCE callback at
// /auth/callback exchanges the recovery code for a session and forwards here.
// Deliberately outside AppShell: a man arriving from his inbox at 11pm should see
// one card and one job, not the whole record navigation.
export const metadata = {
  title: "Set a new password",
};

export default function ResetPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 block text-center">
          <span className="text-lg font-bold tracking-tight text-ink">Connecting the Dots</span>
          <span className="block text-xs font-medium uppercase tracking-widest text-muted">of Service</span>
        </Link>

        <ResetPasswordCard />

        <p className="mt-6 text-center text-[11px] leading-relaxed text-faint">
          If you&apos;re struggling, the Veterans Crisis Line is here 24/7 — dial 988, then press 1.
        </p>
      </div>
    </main>
  );
}
