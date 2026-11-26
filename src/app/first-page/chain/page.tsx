import AppShell from "@/components/AppShell";
import ChainEditor from "@/components/firstpage/ChainEditor";

export const metadata = { title: "The line between them" };

export default function FirstPageChainPage() {
  return (
    <AppShell title="The line between them">
      <ChainEditor />
    </AppShell>
  );
}
