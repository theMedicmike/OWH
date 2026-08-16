import AppShell from "@/components/AppShell";
import PresumptiveLookupView from "@/components/PresumptiveLookupView";

export const metadata = {
  title: "What VA already presumes",
  description:
    "Look up what VA already presumes is connected to service, by where you served and when. If a condition sits on a presumptive list, you don't have to prove the link yourself — this shows you which ones do.",
  alternates: { canonical: "/presumptives" },
};

export default function PresumptivesPage() {
  return (
    <AppShell title="What VA already presumes" publicPage>
      <PresumptiveLookupView />
    </AppShell>
  );
}
