import AppShell from "@/components/AppShell";
import BuddiesView from "@/components/BuddiesView";
import WitnessRequestsCard from "@/components/WitnessRequestsCard";

export default function BuddiesPage() {
  return (
    <AppShell title="Battle buddies">
      <p className="mb-4 text-sm text-muted">
        Find the veterans who served where you did, and confirm each other&apos;s exposures — privately.
      </p>
      <BuddiesView />

      <div className="mt-8 mb-4 border-t border-line pt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Not on this app? Ask them directly</h2>
      </div>
      <WitnessRequestsCard />
    </AppShell>
  );
}
