import AppShell from "@/components/AppShell";
import Link from "next/link";
import MedicationsListCard from "@/components/MedicationsListCard";

export default function MedicationsPage() {
  return (
    <AppShell title="Your medications">
      <p className="mb-1 text-sm text-muted">What you take — and what the FDA&apos;s own label says about it.</p>
      <p className="mb-4 text-xs leading-relaxed text-faint">
        Nothing here is submitted automatically, and nothing you write is touched by AI. This documents what you
        take; it never tells you what you have or what to claim.
      </p>

      <div className="space-y-4">
        <Link
          href="/medications/add"
          className="block rounded-xl border border-brand/30 bg-brand/5 p-5 transition hover:border-brand/50"
        >
          <div className="text-sm font-semibold text-ink">Add a medication →</div>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Generic or brand name, what you take it for, and roughly when. Open it afterward to read the FDA&apos;s
            own label.
          </p>
        </Link>

        <MedicationsListCard />

        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="text-sm font-semibold text-ink">Why a medication list belongs in your record</div>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            Under <strong>38 CFR §3.310</strong>, a condition that was <em>caused or made worse by treatment</em> for
            a condition already connected to your service can sometimes be claimed as secondary. Long-term
            anti-inflammatories prescribed for a service-connected back, for example, are a well-recognized route to
            a separate stomach claim.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            That route still needs three things this app cannot supply: a current diagnosis in your medical records,
            documentation of what you took and for how long, and a medical opinion connecting the two. What this
            page does is put the first piece of paper on the table.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-faint">
            Never stop or change a prescription because of anything you read here. That conversation belongs with
            the clinician who prescribed it.
          </p>
        </div>

        <p className="px-1 text-xs leading-relaxed text-faint">
          This section documents. It does not diagnose, does not advise you, does not file for you, and is not your
          representative (38 CFR 14.629). If you or someone you know is struggling, the Veterans Crisis Line is
          here 24/7 — dial 988, then press 1. Text 838255.
        </p>
      </div>
    </AppShell>
  );
}
