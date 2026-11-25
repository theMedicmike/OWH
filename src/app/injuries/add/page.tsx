import AppShell from "@/components/AppShell";
import InjuryCaptureFlow from "@/components/InjuryCaptureFlow";

// ?class=<incident class> arrives from the "add the place, month and details"
// link on an injury library page, so the form opens with that event chosen.
export default async function InjuriesAddPage({ searchParams }: { searchParams: Promise<{ class?: string }> }) {
  const { class: initialClass } = await searchParams;
  return (
    <AppShell title="Log an injury or event">
      <InjuryCaptureFlow initialClass={initialClass} />
    </AppShell>
  );
}
