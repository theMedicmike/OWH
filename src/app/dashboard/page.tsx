import AppShell from "@/components/AppShell";
import DashboardView from "@/components/DashboardView";

export default function DashboardPage() {
  return (
    <AppShell title="Home" wide>
      <DashboardView />
    </AppShell>
  );
}
