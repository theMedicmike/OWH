import AppShell from "@/components/AppShell";
import Link from "next/link";
import InjuriesListCard from "@/components/InjuriesListCard";

export default function InjuriesPage() {
  return (
    <AppShell title="Injuries & events">
      <p className="mb-1 text-[0.9375rem] text-muted">What happened to you — not just where you were.</p>
      <p className="mb-4 text-sm leading-relaxed text-muted">
        Nothing here is submitted automatically. Nothing you write is touched by AI — not a suggestion, not a
        rewrite, not a polish. It stays in your own words until you choose to bring it to a VSO.
      </p>

      <div className="space-y-4">
        <Link
          href="/injuries/add"
          className="block rounded-xl border border-brand/30 bg-brand/5 p-5 transition hover:border-brand/50"
        >
          <h2 className="text-lg font-semibold tracking-tight text-ink">Log an injury or event</h2>
          <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted">
            A single day, or something that happened over and over — blast, fall, assault, training injury, and
            more. Your best recollection is real evidence, with or without paperwork.
          </p>
        </Link>

        <InjuriesListCard />

        <Link
          href="/injuries/library"
          className="card flex min-h-14 items-center p-4 text-[0.9375rem] font-semibold text-ink transition hover:border-brand/40"
        >
          The library: what VA looks for, by injury type
        </Link>

        <div className="card p-5">
          <h2 className="text-lg font-semibold tracking-tight text-ink">If it wasn&apos;t written down at the time</h2>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink">
            That&apos;s the normal case, not a problem. Combat veterans get real legal weight for their own honest
            account under 38 U.S.C. §1154(b) — sometimes that alone is enough. For events without that
            presumption, a unit record, a medical record from around that time, or a fellow service member&apos;s
            account (VA Form 21-10210) all help build the picture.
          </p>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
            Official unit-record requests (JSRRC) exist too, and can corroborate what happened even years later —
            they can take up to a year and what&apos;s available depends on your branch. Your VSO handles that
            request; this app doesn&apos;t file or track it for you.
          </p>
        </div>

        <p className="px-1 text-sm leading-relaxed text-muted">
          This section documents. It does not diagnose, does not advise you, does not file for you, and is not
          your representative (38 CFR 14.629). If you or someone you know is struggling, the Veterans Crisis Line
          is here 24/7 — dial 988, then press 1. Text 838255.
        </p>
      </div>
    </AppShell>
  );
}
