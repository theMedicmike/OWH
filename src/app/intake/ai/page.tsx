import AppShell from "@/components/AppShell";
import IntakeView from "@/components/IntakeView";
import Link from "next/link";

export default function AiIntakePage() {
  return (
    <AppShell title="Voice guided intake">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="text-[0.9375rem] leading-relaxed text-muted">
          Talk it through instead of clicking. Your guide asks the questions and turns your answers
          into check-ins you can save.
        </p>
        <Link href="/intake" className="btn btn-secondary shrink-0">
          Use the written form instead
        </Link>
      </div>
      <IntakeView />
    </AppShell>
  );
}
