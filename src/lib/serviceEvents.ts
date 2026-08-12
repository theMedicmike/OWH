import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingTableError, isMissingColumnError } from "./supabaseErrors";

// The ONE file allowed to say "service_events" — enforced by
// scripts/coi-firewall.cjs's query-isolation rule. A shot must never be
// queryable as though it were an exposure; routing every read/write through
// here is what keeps that true.

export type ServiceEventKind = "vaccination" | "medication" | "blast" | "head_injury" | "injury" | "other";
export type DatePrecision = "year" | "month" | "day" | "unsure";
export type Provenance = "recalled" | "in_record" | "document_held";
export type InformedConsent = "informed_choice" | "informed_mandatory" | "not_informed_mandatory" | "not_informed" | "unsure";

export type ServiceEvent = {
  id: string;
  kind: ServiceEventKind;
  ref_slug: string | null;
  label: string;
  event_year: number | null;
  event_month: number | null;
  event_day: number | null;
  date_precision: DatePrecision;
  provenance: Provenance;
  informed_consent: InformedConsent | null;
  note: string | null;
  created_at: string;
};

export const PROVENANCE_LABEL: Record<Provenance, string> = {
  recalled: "You remember this",
  in_record: "Your service record shows this",
  document_held: "You hold the document",
};

// Order matters here — it's the order the pills render in, chosen so the two
// axes (told anything at all / had a real choice) read as a spectrum rather
// than a random list.
export const INFORMED_CONSENT_OPTIONS: { value: InformedConsent; label: string }[] = [
  { value: "informed_choice", label: "Yes — told what it was, could ask questions" },
  { value: "informed_mandatory", label: "Told what it was, but mandatory" },
  { value: "not_informed_mandatory", label: "Mandatory, nothing explained" },
  { value: "not_informed", label: "Nobody explained anything" },
  { value: "unsure", label: "I don't remember" },
];
export const INFORMED_CONSENT_LABEL: Record<InformedConsent, string> = Object.fromEntries(
  INFORMED_CONSENT_OPTIONS.map((o) => [o.value, o.label]),
) as Record<InformedConsent, string>;

export async function listServiceEvents(
  supabase: SupabaseClient,
): Promise<{ events: ServiceEvent[] } | { error: "not-set-up" | string }> {
  const { data, error } = await supabase.from("service_events").select("*").order("event_year", { ascending: true, nullsFirst: false });
  if (error) return { error: isMissingTableError(error) ? "not-set-up" : error.message };
  return { events: (data ?? []) as ServiceEvent[] };
}

/** Resolve the signed-in veteran's member row, creating it on first use — the
 *  same lazy-create pattern every other feature in this app uses. */
export async function resolveMemberId(supabase: SupabaseClient): Promise<string | null> {
  const { data: u } = await supabase.auth.getUser();
  const authId = u.user?.id;
  if (!authId) return null;
  const { data: ex } = await supabase.from("members").select("id").eq("auth_id", authId).maybeSingle();
  if (ex?.id) return ex.id;
  const { data: cr } = await supabase.from("members").insert({ auth_id: authId }).select("id").single();
  return cr?.id ?? null;
}

export async function createServiceEvent(
  supabase: SupabaseClient,
  opts: {
    kind: ServiceEventKind;
    refSlug: string | null;
    label: string;
    eventYear: number | null;
    eventMonth: number | null;
    eventDay: number | null;
    datePrecision: DatePrecision;
    provenance: Provenance;
    informedConsent: InformedConsent;
    note: string;
  },
): Promise<{ status: "saved" } | { status: "error"; message: string }> {
  // 🔴 member_id was missing from every insert here — service_events.member_id
  // is NOT NULL with no database default, so this save could never have
  // succeeded; it would fail RLS/NOT NULL on every attempt. Found while
  // building the injuries page's near-identical save path. Fixed here.
  const memberId = await resolveMemberId(supabase);
  if (!memberId) return { status: "error", message: "Couldn't find your record — try again." };
  const wide = {
    member_id: memberId,
    kind: opts.kind,
    ref_slug: opts.refSlug,
    label: opts.label,
    event_year: opts.eventYear,
    event_month: opts.eventMonth,
    event_day: opts.eventDay,
    date_precision: opts.datePrecision,
    provenance: opts.provenance,
    informed_consent: opts.informedConsent,
    note: opts.note.trim() || null,
  };
  let error = (await supabase.from("service_events").insert(wide)).error;
  if (error && isMissingColumnError(error)) {
    // Migration 0021 or 0024 hasn't been run yet — drop the newer optional
    // fields one at a time and save the rest. An answer he gave is lost for
    // this entry only, never silently guessed at.
    const { event_day: _ed, ...withoutDay } = wide;
    void _ed;
    error = (await supabase.from("service_events").insert(withoutDay)).error;
    if (error && isMissingColumnError(error)) {
      const { informed_consent: _ic, ...rest } = withoutDay;
      void _ic;
      error = (await supabase.from("service_events").insert(rest)).error;
    }
  }
  if (error) return { status: "error", message: isMissingTableError(error) ? "not-set-up" : error.message };
  return { status: "saved" };
}

export async function deleteServiceEvent(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from("service_events").delete().eq("id", id);
}
