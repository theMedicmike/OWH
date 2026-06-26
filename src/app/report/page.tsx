import AppShell from "@/components/AppShell";
import ReportView from "@/components/ReportView";

export default function ReportPage() {
  return (
    <AppShell title="Claim packet">
      <p className="mb-4 text-sm text-muted print:hidden">
        Everything you&apos;ve logged, assembled into a cited packet for your VSO and a hand-off sheet for your
        clinician. Facts and sources — never a diagnosis.
      </p>
      <ReportView />
    </AppShell>
  );
}
