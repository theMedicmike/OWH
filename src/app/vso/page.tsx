import AppShell from "@/components/AppShell";
import VsoLocatorCard from "@/components/VsoLocatorCard";

export default function VsoPage() {
  return (
    <AppShell title="Find a VSO">
      <p className="mb-4 text-sm text-muted">
        A Veteran Service Officer reviews your packet and files with you — free, every time, no matter which VSO you pick.
      </p>
      <VsoLocatorCard />
    </AppShell>
  );
}
