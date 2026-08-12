import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingTableError } from "./supabaseErrors";
import { resolveMemberId } from "./serviceEvents";

// THE "WHAT YOU'VE NOTICED SINCE" LOG — 38 CFR 3.303(b) continuity of
// symptomatology. The single highest-value addition the injury-page council
// found: a dated, repeatable, human-typed note attached to an incident.
// Never AI-touched, same as every other free-text field a veteran signs their
// name to in this app.
//
// "logged on" (created_at) and "noticed" (noticed_year/month) are kept
// deliberately separate and both immutable after creation — an undisclosed
// edit to either would quietly undermine the exact credibility signal this
// table exists to provide. There is no update() here on purpose.

export type IncidentNote = {
  id: string;
  incident_id: string;
  noticed_year: number | null;
  noticed_month: number | null;
  note: string;
  created_at: string;
};

export async function listIncidentNotes(
  supabase: SupabaseClient,
  incidentId: string,
): Promise<{ notes: IncidentNote[] } | { error: string }> {
  const { data, error } = await supabase
    .from("incident_notes")
    .select("*")
    .eq("incident_id", incidentId)
    .order("noticed_year", { ascending: true, nullsFirst: true });
  if (error) return { error: isMissingTableError(error) ? "not-set-up" : error.message };
  return { notes: (data ?? []) as IncidentNote[] };
}

export async function createIncidentNote(
  supabase: SupabaseClient,
  opts: { incidentId: string; noticedYear: number | null; noticedMonth: number | null; note: string },
): Promise<{ status: "saved" } | { status: "error"; message: string }> {
  const memberId = await resolveMemberId(supabase);
  if (!memberId) return { status: "error", message: "Couldn't find your record — try again." };
  const trimmed = opts.note.trim();
  if (!trimmed) return { status: "error", message: "Say a little about what you noticed." };
  const { error } = await supabase.from("incident_notes").insert({
    incident_id: opts.incidentId,
    member_id: memberId,
    noticed_year: opts.noticedYear,
    noticed_month: opts.noticedMonth,
    note: trimmed,
  });
  if (error) return { status: "error", message: isMissingTableError(error) ? "This feature isn't switched on yet — nothing was saved." : error.message };
  return { status: "saved" };
}

export async function deleteIncidentNote(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from("incident_notes").delete().eq("id", id);
}
