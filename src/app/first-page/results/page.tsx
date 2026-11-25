import AppShell from "@/components/AppShell";
import ResultsEditor from "@/components/firstpage/ResultsEditor";

export default function FirstPageResultsEditorPage() {
  return (
    <AppShell title="Results that changed">
      <ResultsEditor />
    </AppShell>
  );
}
