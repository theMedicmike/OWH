import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingTableError } from "./supabaseErrors";
import { resolveMemberId } from "./serviceEvents";

// THE DATED IMPACT JOURNAL — one condition, an ongoing log of how it's
// actually affected day-to-day life, dated, in the veteran's own words.
// Same discipline as incidentNotes.ts: never AI-touched, no update() —
// "logged on" (created_at) and "noticed" (noticed_year/month) both immutable
// once written, so neither can be quietly edited after the fact.
//
// Evidentiary basis is broader than the incident-side log: continuity of
// symptomatology (38 CFR 3.303(b)) AND functional impact on ordinary
// activities (38 CFR 4.10) — exactly what a C&P examiner is trained to ask.

export type ConditionNote = {
  id: string;
  condition_id: string;
  noticed_year: number | null;
  noticed_month: number | null;
  note: string;
  created_at: string;
};

export async function listConditionNotes(
  supabase: SupabaseClient,
  conditionId: string,
): Promise<{ notes: ConditionNote[] } | { error: string }> {
  const { data, error } = await supabase
    .from("condition_notes")
    .select("*")
    .eq("condition_id", conditionId)
    .order("noticed_year", { ascending: true, nullsFirst: true });
  if (error) return { error: isMissingTableError(error) ? "not-set-up" : error.message };
  return { notes: (data ?? []) as ConditionNote[] };
}

export async function createConditionNote(
  supabase: SupabaseClient,
  opts: { conditionId: string; noticedYear: number | null; noticedMonth: number | null; note: string },
): Promise<{ status: "saved" } | { status: "error"; message: string }> {
  const memberId = await resolveMemberId(supabase);
  if (!memberId) return { status: "error", message: "Couldn't find your record — try again." };
  const trimmed = opts.note.trim();
  if (!trimmed) return { status: "error", message: "Say a little about how this has affected you." };
  const { error } = await supabase.from("condition_notes").insert({
    condition_id: opts.conditionId,
    member_id: memberId,
    noticed_year: opts.noticedYear,
    noticed_month: opts.noticedMonth,
    note: trimmed,
  });
  if (error) return { status: "error", message: isMissingTableError(error) ? "This feature isn't switched on yet — nothing was saved." : error.message };
  return { status: "saved" };
}

export async function deleteConditionNote(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from("condition_notes").delete().eq("id", id);
}
