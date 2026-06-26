import AppShell from "@/components/AppShell";
import IntakeView from "@/components/IntakeView";

export default function IntakePage() {
  return (
    <AppShell title="Guided intake">
      <p className="mb-4 text-sm text-muted">
        Talk it through instead of clicking the map. Your guide asks the questions and turns your answers into
        check-ins you can save.
      </p>
      <IntakeView />
    </AppShell>
  );
}
