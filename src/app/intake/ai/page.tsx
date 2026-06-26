import AppShell from "@/components/AppShell";
import IntakeView from "@/components/IntakeView";
import Link from "next/link";

export default function AiIntakePage() {
  return (
    <AppShell title="AI-guided intake">
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          Talk it through instead of clicking. Your guide asks the questions and turns your answers
          into check-ins you can save.
        </p>
        <Link
          href="/intake"
          className="shrink-0 rounded-xl border border-line px-4 py-2 text-xs font-semibold text-muted transition hover:border-brand hover:text-brand"
        >
          ← Use the written form instead
        </Link>
      </div>
      <IntakeView />
    </AppShell>
  );
}
