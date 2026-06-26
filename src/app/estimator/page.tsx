import AppShell from "@/components/AppShell";
import EstimatorView from "@/components/EstimatorView";

export default function EstimatorPage() {
  return (
    <AppShell title="Exposure insights">
      <div className="mb-4 rounded-lg border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
        <span className="font-semibold">Private — for you and your own doctor.</span> This is a personal estimate to
        guide questions and testing. It is <span className="font-semibold">not</span> part of your VA claim packet and
        is never shared with the VA.
      </div>
      <p className="mb-4 text-sm text-muted">
        A plain-language estimate built from where you served and what you logged. An estimate, not a diagnosis.
      </p>
      <EstimatorView />
    </AppShell>
  );
}
