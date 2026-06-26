import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import IntakeFormView from "@/components/IntakeFormView";
import Link from "next/link";

export default async function IntakePage() {
  const supabase = await createClient();
  const { data: sites } = await supabase
    .from("known_exposure_sites")
    .select("name, exposure_classes, date_from, date_to")
    .order("name");

  return (
    <AppShell title="Intake form">
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          Fill out your service history, locations, and health conditions. Everything saves to your
          private record and feeds directly into your claim packet.
        </p>
        <Link
          href="/intake/ai"
          className="shrink-0 rounded-xl border border-line px-4 py-2 text-xs font-semibold text-muted transition hover:border-brand hover:text-brand"
        >
          Talk it through with AI instead →
        </Link>
      </div>
      <IntakeFormView sites={sites ?? []} />
    </AppShell>
  );
}
