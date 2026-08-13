import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import MedicationDetailView from "@/components/MedicationDetailView";
import { createClient } from "@/lib/supabase/server";
import { getMedication } from "@/lib/medications";
import { fetchDrugLabel } from "@/lib/medicationLabels";

// Server component on purpose: the label fetch happens here, cached upstream
// for a day, so a veteran never watches a spinner and the openFDA quota is
// spent once per drug rather than once per view. RLS on the medications table
// is what scopes the row to the signed-in veteran — see migration 0028.
export default async function MedicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const res = await getMedication(supabase, id);
  if ("error" in res) {
    // "not-set-up" means migration 0028 hasn't run — say so plainly rather
    // than showing a veteran a 404 for a record they just created.
    if (res.error === "not-set-up") {
      return (
        <AppShell title="Your medications">
          <div className="mx-auto max-w-2xl rounded-xl border border-line bg-surface p-5">
            <div className="text-sm font-semibold text-ink">This feature isn&apos;t switched on yet</div>
            <p className="mt-2 text-sm text-muted">
              Nothing is wrong with your record — the database update for it hasn&apos;t been applied. Check back
              soon.
            </p>
          </div>
        </AppShell>
      );
    }
    notFound();
  }

  const medication = res.medication;
  // Prefer the generic name for the lookup — it is what the FDA indexes best —
  // and fall back to whatever the veteran actually typed.
  const label = await fetchDrugLabel(medication.generic_name || medication.name);

  return (
    <AppShell title="Your medications">
      <MedicationDetailView medication={medication} result={label} />
    </AppShell>
  );
}
