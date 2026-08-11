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
        <p className="text-sm text-muted">
          Fill out your service history, locations, and health conditions. Everything saves to your
          private record and feeds directly into your claim packet.
        </p>
        <Link
          href="/intake/ai"
          className="group inline-flex shrink-0 items-center gap-2.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-105"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
          </svg>
          Prefer to talk? Voice guided intake
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </div>
      <IntakeFormView sites={sites ?? []} />
    </AppShell>
  );
}
