import Link from "next/link";
import AppShell from "@/components/AppShell";
import { SHOTS, GROUP_LABEL, type ShotGroup } from "@/lib/shotlibrary";

const GROUPS: ShotGroup[] = ["basic", "posted", "yearly", "other"];

export default function ShotLibraryPage() {
  return (
    <AppShell title="What these shots were">
      <p className="mb-4 text-sm text-muted">
        The FDA-approved label for each one, word for word — plus what the government said about it, and when.
      </p>
      <div className="space-y-5">
        {GROUPS.map((g) => {
          const items = SHOTS.filter((s) => s.group === g).sort((a, b) => a.name.localeCompare(b.name));
          if (!items.length) return null;
          return (
            <div key={g}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{GROUP_LABEL[g]}</h2>
              <div className="divide-y divide-line rounded-xl border border-line bg-surface">
                {items.map((s) => (
                  <Link key={s.slug} href={`/shots/library/${s.slug}`} className="flex items-baseline justify-between gap-2 px-4 py-3 text-sm hover:bg-canvas">
                    <span className="font-medium text-ink">{s.name}</span>
                    <span className="text-xs text-muted">{s.hook}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <Link href="/shots" className="mt-6 block text-center text-xs font-medium text-brand hover:underline">← Your shot record</Link>
    </AppShell>
  );
}
