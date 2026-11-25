import AppShell from "@/components/AppShell";
import ReportView from "@/components/ReportView";

// The intro now lives in the packet's own top card; the line that stays here
// is the one promise the card does not repeat.
export default function ReportPage() {
  return (
    <AppShell title="Claim packet">
      <ReportView />
      <p className="mt-6 text-sm leading-relaxed text-muted print:hidden">
        Facts and sources, never a diagnosis. The last page is a hand-off sheet for your clinician.
      </p>
    </AppShell>
  );
}
