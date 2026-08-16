import AppShell from "@/components/AppShell";
import SolutionsView from "@/components/SolutionsView";

export const metadata = {
  title: "Whole health",
  description:
    "The ordinary, unglamorous ground floor of veteran health — sleep, movement, blood pressure, blood sugar, smoking. General education for every veteran, matched to no one's record. Free, and nothing here is for sale.",
  alternates: { canonical: "/solutions" },
};

export default function SolutionsPage() {
  return (
    <AppShell title="Whole health" publicPage>
      <SolutionsView />
    </AppShell>
  );
}
