import AppShell from "@/components/AppShell";
import InjuryCaptureFlow from "@/components/InjuryCaptureFlow";

export default function InjuriesAddPage() {
  return (
    <AppShell title="Log an injury or event">
      <InjuryCaptureFlow />
    </AppShell>
  );
}
