import AppShell from "@/components/AppShell";
import Link from "next/link";
import InjuriesListCard from "@/components/InjuriesListCard";

export default function InjuriesPage() {
  return (
    <AppShell title="Injuries & events">
      <p className="mb-1 text-sm text-muted">What happened to you — not just where you were.</p>
      <p className="mb-4 text-xs leading-relaxed text-faint">
        Nothing here is submitted automatically. Nothing you write is touched by AI — not a suggestion, not a
        rewrite, not a polish. It stays in your own words until you choose to bring it to a VSO.
      </p>

      <div className="space-y-4">
        <Link
          href="/injuries/add"
          className="block rounded-xl border border-brand/30 bg-brand/5 p-5 transition hover:border-brand/50"
        >
          <div className="text-sm font-semibold text-ink">Log an injury or event →</div>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            A single day, or something that happened over and over — blast, fall, assault, training injury, and
            more. Your best recollection is real evidence, with or without paperwork.
          </p>
        </Link>

        <InjuriesListCard />

        <Link
          href="/injuries/library"
          className="block rounded-lg border border-line bg-surface p-4 text-sm font-medium text-ink hover:bg-canvas"
        >
          What VA looks for, by injury type — the library →
        </Link>

        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="text-sm font-semibold text-ink">If it wasn&apos;t written down at the time</div>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            That&apos;s the normal case, not a problem. Combat veterans get real legal weight for their own honest
            account under 38 U.S.C. §1154(b) — sometimes that alone is enough. For events without that
            presumption, a unit record, a medical record from around that time, or a fellow service member&apos;s
            account (VA Form 21-10210) all help build the picture.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Official unit-record requests (JSRRC) exist too, and can corroborate what happened even years later —
            they can take up to a year and what&apos;s available depends on your branch. Your VSO handles that
            request; this app doesn&apos;t file or track it for you.
          </p>
        </div>

        <p className="px-1 text-xs leading-relaxed text-faint">
          This section documents. It does not diagnose, does not advise you, does not file for you, and is not
          your representative (38 CFR 14.629). If you or someone you know is struggling, the Veterans Crisis Line
          is here 24/7 — dial 988, then press 1. Text 838255.
        </p>
      </div>
    </AppShell>
  );
}
