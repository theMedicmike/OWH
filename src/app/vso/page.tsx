import AppShell from "@/components/AppShell";
import VsoLocatorCard from "@/components/VsoLocatorCard";

export const metadata = {
  title: "Find a VSO",
  description:
    "Find an accredited Veterans Service Officer near you by ZIP code. A VSO reviews your packet and files with you — free, every time, no matter which one you pick. Built from VA's own accreditation list.",
  alternates: { canonical: "/vso" },
};

// publicPage: this is a lookup over a static file of VA's own accreditation
// list — VsoLocatorCard reads no account and writes nothing. It was already
// listed in the sitemap while still sitting behind the sign-in wall, which
// pointed Google at a login screen; opening it here is the fix for that.
export default function VsoPage() {
  return (
    <AppShell title="Find a VSO" publicPage>
      <p className="mb-4 text-sm text-muted">
        A Veteran Service Officer reviews your packet and files with you — free, every time, no matter which VSO you pick.
      </p>
      <VsoLocatorCard />
    </AppShell>
  );
}
