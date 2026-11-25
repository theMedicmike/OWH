import AppShell from "@/components/AppShell";
import MedicationCaptureFlow from "@/components/MedicationCaptureFlow";
import MedicationQuickAdd from "@/components/MedicationQuickAdd";

// Default: the tap-to-add list. ?full=1 opens the longer form with start and
// stop years, for anyone who wants to record those at the same time.
export default async function AddMedicationPage({ searchParams }: { searchParams: Promise<{ full?: string }> }) {
  const { full } = await searchParams;
  return (
    <AppShell title="Add a medication">
      {full ? <MedicationCaptureFlow /> : <MedicationQuickAdd />}
    </AppShell>
  );
}
