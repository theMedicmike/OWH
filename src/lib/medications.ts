import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingTableError } from "./supabaseErrors";
import { resolveMemberId } from "./serviceEvents";

// The ONE file allowed to query the `medications` table — enforced by
// scripts/coi-firewall.cjs rule 12a, mirroring the query isolation the shots
// table already has. A medication must never be readable as though it were an
// exposure. (Rule 6 greps for the shots table name as a raw string, comments
// included, which is why that name is described rather than written here.)
//
// Note what this module does NOT expose: no "claim" flag, no "selected side
// effects", no write path from a side-effect card into any claim artifact.
// Logging what you take is the veteran's own fact, the same shape as logging a
// shot. Turning that into a claim is an accredited representative's job, and
// the council blocked any app-side version of it pending the open 38 CFR
// 14.629 counsel question.

export type Medication = {
  id: string;
  name: string;
  generic_name: string | null;
  brand_name: string | null;
  taken_for: string | null;
  still_taking: boolean | null;
  started_year: number | null;
  stopped_year: number | null;
  note: string | null;
  created_at: string;
};

export async function listMedications(
  supabase: SupabaseClient,
): Promise<{ medications: Medication[] } | { error: string }> {
  const { data, error } = await supabase
    .from("medications")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) return { error: isMissingTableError(error) ? "not-set-up" : error.message };
  return { medications: (data ?? []) as Medication[] };
}

export async function getMedication(
  supabase: SupabaseClient,
  id: string,
): Promise<{ medication: Medication } | { error: string }> {
  const { data, error } = await supabase.from("medications").select("*").eq("id", id).maybeSingle();
  if (error) return { error: isMissingTableError(error) ? "not-set-up" : error.message };
  if (!data) return { error: "not-found" };
  return { medication: data as Medication };
}

export async function createMedication(
  supabase: SupabaseClient,
  opts: {
    name: string;
    genericName: string | null;
    brandName: string | null;
    takenFor: string;
    stillTaking: boolean | null;
    startedYear: number | null;
    stoppedYear: number | null;
    note: string;
  },
): Promise<{ status: "saved"; id: string } | { status: "error"; message: string }> {
  const memberId = await resolveMemberId(supabase);
  if (!memberId) return { status: "error", message: "Couldn't find your record — try again." };
  const name = opts.name.trim();
  if (!name) return { status: "error", message: "Add the name of the medication to save this." };
  const { data, error } = await supabase
    .from("medications")
    .insert({
      member_id: memberId,
      name,
      generic_name: opts.genericName,
      brand_name: opts.brandName,
      taken_for: opts.takenFor.trim() || null,
      still_taking: opts.stillTaking,
      started_year: opts.startedYear,
      stopped_year: opts.stoppedYear,
      note: opts.note.trim() || null,
    })
    .select("id")
    .single();
  if (error) {
    return {
      status: "error",
      message: isMissingTableError(error)
        ? "This feature isn't switched on yet — nothing was saved."
        : error.message,
    };
  }
  return { status: "saved", id: (data as { id: string }).id };
}

export async function deleteMedication(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from("medications").delete().eq("id", id);
}
