import AppShell from "@/components/AppShell";
import HealthView from "@/components/HealthView";

export default function HealthPage() {
  return (
    <AppShell title="Health & connections">
      <p className="mb-4 text-sm text-muted">
        List what you live with now, and see where it lines up with the exposures you logged.
      </p>
      <HealthView />
    </AppShell>
  );
}
