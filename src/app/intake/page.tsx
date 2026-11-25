import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import IntakeFormView from "@/components/IntakeFormView";
import Link from "next/link";

export default async function IntakePage() {
  const supabase = await createClient();

  // Page zero: a brand-new veteran with no service data yet and who has never
  // confirmed the /welcome screen sees it once, before the wizard. Reading
  // this defensively (migration 0023) — any error here means "don't gate,
  // just show intake" so a migration that hasn't run yet never blocks anyone.
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: m, error } = await supabase
      .from("members")
      .select("branch, service_start, intro_seen_at")
      .eq("auth_id", user.id)
      .maybeSingle();
    if (!error && (!m || (!m.branch && !m.service_start && !m.intro_seen_at))) {
      redirect("/welcome");
    }
  }

  const { data: sites } = await supabase
    .from("known_exposure_sites")
    .select("name, geom, exposure_classes, date_from, date_to")
    .order("name");

  return (
    <AppShell title="Your service">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[15px] leading-relaxed text-muted">
          Everything saves to your private record and feeds into your claim packet.
        </p>
        <Link href="/intake/ai" className="btn btn-secondary flex-none">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-brand" aria-hidden="true">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
          </svg>
          Prefer to talk? Voice guided intake
        </Link>
      </div>
      <IntakeFormView sites={sites ?? []} />
    </AppShell>
  );
}
