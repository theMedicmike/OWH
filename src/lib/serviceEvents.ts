import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingTableError } from "./supabaseErrors";

// The ONE file allowed to say "service_events" — enforced by
// scripts/coi-firewall.cjs's query-isolation rule. A shot must never be
// queryable as though it were an exposure; routing every read/write through
// here is what keeps that true.

export type ServiceEventKind = "vaccination" | "medication" | "blast" | "head_injury" | "injury" | "other";
export type DatePrecision = "year" | "month" | "unsure";
export type Provenance = "recalled" | "in_record" | "document_held";

export type ServiceEvent = {
  id: string;
  kind: ServiceEventKind;
  ref_slug: string | null;
  label: string;
  event_year: number | null;
  event_month: number | null;
  date_precision: DatePrecision;
  provenance: Provenance;
  note: string | null;
  created_at: string;
};

export const PROVENANCE_LABEL: Record<Provenance, string> = {
  recalled: "You remember this",
  in_record: "Your service record shows this",
  document_held: "You hold the document",
};

export async function listServiceEvents(
  supabase: SupabaseClient,
): Promise<{ events: ServiceEvent[] } | { error: "not-set-up" | string }> {
  const { data, error } = await supabase.from("service_events").select("*").order("event_year", { ascending: true, nullsFirst: false });
  if (error) return { error: isMissingTableError(error) ? "not-set-up" : error.message };
  return { events: (data ?? []) as ServiceEvent[] };
}

export async function createServiceEvent(
  supabase: SupabaseClient,
  opts: {
    kind: ServiceEventKind;
    refSlug: string | null;
    label: string;
    eventYear: number | null;
    eventMonth: number | null;
    datePrecision: DatePrecision;
    provenance: Provenance;
    note: string;
  },
): Promise<{ status: "saved" } | { status: "error"; message: string }> {
  const { error } = await supabase.from("service_events").insert({
    kind: opts.kind,
    ref_slug: opts.refSlug,
    label: opts.label,
    event_year: opts.eventYear,
    event_month: opts.eventMonth,
    date_precision: opts.datePrecision,
    provenance: opts.provenance,
    note: opts.note.trim() || null,
  });
  if (error) return { status: "error", message: isMissingTableError(error) ? "not-set-up" : error.message };
  return { status: "saved" };
}

export async function deleteServiceEvent(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from("service_events").delete().eq("id", id);
}
