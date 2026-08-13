import AppShell from "@/components/AppShell";
import MedicationCaptureFlow from "@/components/MedicationCaptureFlow";

export default function AddMedicationPage() {
  return (
    <AppShell title="Add a medication">
      <MedicationCaptureFlow />
    </AppShell>
  );
}
