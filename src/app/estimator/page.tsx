import AppShell from "@/components/AppShell";
import EstimatorView from "@/components/EstimatorView";

export default function EstimatorPage() {
  return (
    <AppShell title="Exposure summary">
      <p className="mb-4 text-sm text-muted">
        A plain-language summary built from where you served and what you logged — a starting point to take to your
        clinician. An estimate, not a diagnosis.
      </p>
      <EstimatorView />
    </AppShell>
  );
}
