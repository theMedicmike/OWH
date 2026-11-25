import AppShell from "@/components/AppShell";
import SimpleRowsEditor from "@/components/firstpage/SimpleRowsEditor";

export default function FirstPageSimpleRowsEditorPage() {
  return (
    <AppShell title="Key studies">
      <SimpleRowsEditor kind="studies" />
    </AppShell>
  );
}
