import AppShell from "@/components/AppShell";
import ConditionsView from "@/components/ConditionsView";

// NOT "Condition library" -- ConditionsView reads the veteran's own conditions
// row and explains each one. The Dashboard CTA that lands here says "Connect a
// condition to an exposure", so the destination has to sound like the button.
export default function ConditionsPage() {
  return (
    <AppShell title="How your conditions connect">
      <ConditionsView />
    </AppShell>
  );
}
