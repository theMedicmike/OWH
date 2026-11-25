import AppShell from "@/components/AppShell";
import SimpleRowsEditor from "@/components/firstpage/SimpleRowsEditor";

export default function FirstPageSimpleRowsEditorPage() {
  return (
    <AppShell title="What has been tried">
      <SimpleRowsEditor kind="tried" />
    </AppShell>
  );
}
