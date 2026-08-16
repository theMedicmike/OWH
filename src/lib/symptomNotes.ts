import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingTableError, isMissingColumnError } from "./supabaseErrors";
import { resolveMemberId } from "./serviceEvents";

// THE UNFILED SYMPTOM NOTE — "capture first, classify later."
//
// A veteran having a bad night should be able to write down what's happening
// without first deciding which condition it belongs to. Requiring that
// decision up front is why the fact gets lost: he doesn't know, so he closes
// the app.
//
// Deliberately absent, per the 2026-08-14 council ruling on symptom logging:
// no severity field, no mood score, no streak, no "logged N days running."
// Nudged density produces a record that reads manufactured rather than lived,
// which is worse for a claim than a sparse honest one. The only fields here
// are the veteran's own words and the day it happened.

export type SymptomNote = {
  id: string;
  note: string;
  noticed_on: string;
  created_at: string;
};

export async function listSymptomNotes(
  supabase: SupabaseClient,
): Promise<{ notes: SymptomNote[] } | { error: string }> {
  const { data, error } = await supabase
    .from("symptom_notes")
    .select("*")
    .order("noticed_on", { ascending: false });
  if (error) return { error: isMissingTableError(error) ? "not-set-up" : error.message };
  return { notes: (data ?? []) as SymptomNote[] };
}

export async function createSymptomNote(
  supabase: SupabaseClient,
  opts: { note: string; noticedOn: string },
): Promise<{ status: "saved" } | { status: "error"; message: string }> {
  const memberId = await resolveMemberId(supabase);
  if (!memberId) return { status: "error", message: "Couldn't find your record — try again." };
  const trimmed = opts.note.trim();
  if (!trimmed) return { status: "error", message: "Write a line about what's going on." };
  const { error } = await supabase.from("symptom_notes").insert({
    member_id: memberId,
    note: trimmed,
    noticed_on: opts.noticedOn,
  });
  if (error) {
    return {
      status: "error",
      message: isMissingTableError(error)
        ? "This isn't switched on yet — nothing was saved."
        : error.message,
    };
  }
  return { status: "saved" };
}

export async function deleteSymptomNote(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from("symptom_notes").delete().eq("id", id);
}

/**
 * File an unfiled note against a condition. The row MOVES: it is written into
 * condition_notes carrying its original date, then deleted here, so a
 * condition's journal has exactly one source and there is no duplicate left
 * behind to drift out of sync.
 *
 * The insert is attempted with the exact date first and retried without it,
 * because `condition_notes.noticed_on` arrives in migration 0029 — on a
 * database where that hasn't run yet, filing still works and simply keeps the
 * year instead of the day.
 */
export async function fileSymptomNote(
  supabase: SupabaseClient,
  opts: { id: string; note: SymptomNote; conditionId: string },
): Promise<{ status: "filed" } | { status: "error"; message: string }> {
  const memberId = await resolveMemberId(supabase);
  if (!memberId) return { status: "error", message: "Couldn't find your record — try again." };

  const d = new Date(opts.note.noticed_on);
  const row = {
    condition_id: opts.conditionId,
    member_id: memberId,
    noticed_year: d.getUTCFullYear(),
    noticed_month: d.getUTCMonth() + 1,
    note: opts.note.note,
  };

  let error = (await supabase.from("condition_notes").insert({ ...row, noticed_on: opts.note.noticed_on })).error;
  if (error && isMissingColumnError(error)) {
    error = (await supabase.from("condition_notes").insert(row)).error;
  }
  if (error) return { status: "error", message: error.message };

  // Only remove the original once the copy is safely written — a failed
  // delete leaves a duplicate to clean up, a failed insert after an early
  // delete would lose the veteran's words entirely.
  await supabase.from("symptom_notes").delete().eq("id", opts.id);
  return { status: "filed" };
}
