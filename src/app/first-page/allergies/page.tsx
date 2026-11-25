import AppShell from "@/components/AppShell";
import SimpleRowsEditor from "@/components/firstpage/SimpleRowsEditor";

export default function FirstPageSimpleRowsEditorPage() {
  return (
    <AppShell title="Allergies">
      <SimpleRowsEditor kind="allergies" />
    </AppShell>
  );
}
