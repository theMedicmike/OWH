import AppShell from "@/components/AppShell";
import ReportView from "@/components/ReportView";

export default function ReportPage() {
  return (
    <AppShell title="Report">
      <p className="mb-4 text-sm text-muted print:hidden">
        Your service, exposures, conditions, and the connections between them, on one page to print or save.
      </p>
      <ReportView />
    </AppShell>
  );
}
