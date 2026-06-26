import AppShell from "@/components/AppShell";
import BuddiesView from "@/components/BuddiesView";

export default function BuddiesPage() {
  return (
    <AppShell title="Battle buddies">
      <p className="mb-4 text-sm text-muted">
        Find the veterans who served where you did, and confirm each other&apos;s exposures — privately.
      </p>
      <BuddiesView />
    </AppShell>
  );
}
