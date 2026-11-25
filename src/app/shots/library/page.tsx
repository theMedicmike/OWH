import Link from "next/link";
import AppShell from "@/components/AppShell";
import { Chevron } from "@/components/ui";
import { SHOTS, GROUP_LABEL, type ShotGroup } from "@/lib/shotlibrary";

const GROUPS: ShotGroup[] = ["basic", "posted", "yearly", "other"];

export default function ShotLibraryPage() {
  return (
    <AppShell title="Shot library">
      <div className="space-y-7">
        <div>
          <h2 className="display text-[1.75rem] text-ink sm:text-[2rem]">Shot library</h2>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
            The FDA-approved label for each one, word for word, plus what the government said about it, and when.
            Open any shot to add it to your record in one tap.
          </p>
        </div>
        {GROUPS.map((g) => {
          const items = SHOTS.filter((s) => s.group === g).sort((a, b) => a.name.localeCompare(b.name));
          if (!items.length) return null;
          return (
            <section key={g}>
              <h3 className="text-lg font-semibold tracking-tight text-ink">{GROUP_LABEL[g]}</h3>
              <div className="card mt-3 overflow-hidden">
                {items.map((s) => (
                  <Link key={s.slug} href={`/shots/library/${s.slug}`} className="row group">
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.9375rem] font-semibold leading-snug">{s.name}</span>
                      <span className="mt-0.5 block text-sm leading-snug text-muted">{s.hook}</span>
                    </span>
                    <Chevron className="text-faint transition-colors group-hover:text-ink" />
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
        <Link href="/shots" className="btn btn-secondary w-full">Your shot record</Link>
      </div>
    </AppShell>
  );
}
