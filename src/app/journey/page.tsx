import AppShell from "@/components/AppShell";
import JourneyView from "@/components/JourneyView";
import { cascadeFloors } from "@/content/cascadeFloors";

export default function JourneyPage() {
  // Resolved HERE (server side) so the 1.6 MB manuscript never reaches the
  // client bundle — the view only ever sees four small objects.
  return (
    <AppShell title="Connect the dots">
      <JourneyView floors={cascadeFloors()} />
    </AppShell>
  );
}
