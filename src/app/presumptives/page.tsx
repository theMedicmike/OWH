import AppShell from "@/components/AppShell";
import PresumptiveLookupView from "@/components/PresumptiveLookupView";

export const metadata = { title: "What VA already presumes" };

export default function PresumptivesPage() {
  return (
    <AppShell title="What VA already presumes">
      <PresumptiveLookupView />
    </AppShell>
  );
}
