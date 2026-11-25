import AppShell from "@/components/AppShell";
import FirstPageHub from "@/components/firstpage/FirstPageHub";

export default function FirstPagePage() {
  return (
    <AppShell title="Your First Page">
      <p className="mb-1 text-sm text-muted">The one sheet you hand a specialist, built from your own record.</p>
      <p className="mb-4 text-xs leading-relaxed text-faint">
        Two sides of one page: who you are, what you were around, what the records say, and the three lines you
        want read first. Every row names its source. Nothing here is written by AI, and nothing is sent to one.
      </p>
      <FirstPageHub />
    </AppShell>
  );
}
