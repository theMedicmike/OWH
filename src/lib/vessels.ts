import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingTableError } from "./supabaseErrors";
import { resolveMemberId } from "./serviceEvents";

// The ONE file allowed to query the `vessels` table — enforced by
// scripts/coi-firewall.cjs rule 15, the same query isolation the shots and
// medications tables already have. A ship is a SERVICE FACT, the same shape as
// a unit. It must never be readable as though it were an exposure or a place.
//
// Note what this module does NOT export: no qualifies/eligible/presumptive
// flag, no lookup against VA's published Vietnam ship list, no scoring of any
// kind. Blue Water Navy turns on where a vessel actually was, established from
// deck logs by a rater; see the ruling written into migration 0030. This module
// stores what the veteran says and hands it back.

export type Vessel = {
  id: string;
  name: string;
  hull: string | null;
  from_year: number | null;
  from_month: number | null;
  to_year: number | null;
  to_month: number | null;
  role: string | null;
  note: string | null;
  created_at: string;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function endpoint(year: number | null, month: number | null): string {
  if (!year) return "";
  if (month && month >= 1 && month <= 12) return `${MONTHS[month - 1]} ${year}`;
  return String(year);
}

/** "March 1968 – 1970", "1968", "until 1970", or "" when nothing was given.
 *  Shared by the list card and the packet so the two can never disagree about
 *  how a veteran's own dates read. */
export function vesselWhen(v: Vessel): string {
  const a = endpoint(v.from_year, v.from_month);
  const b = endpoint(v.to_year, v.to_month);
  if (a && b) return a === b ? a : `${a} – ${b}`;
  if (a) return `from ${a}`;
  if (b) return `until ${b}`;
  return "";
}

/** "USS Kitty Hawk (CV-63)" — hull in parentheses only when there is one. */
export function vesselTitle(v: Vessel): string {
  return v.hull?.trim() ? `${v.name} (${v.hull.trim()})` : v.name;
}

export async function listVessels(
  supabase: SupabaseClient,
): Promise<{ vessels: Vessel[] } | { error: string }> {
  const { data, error } = await supabase
    .from("vessels")
    .select("*")
    .order("from_year", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  if (error) return { error: isMissingTableError(error) ? "not-set-up" : error.message };
  return { vessels: (data ?? []) as Vessel[] };
}

export async function createVessel(
  supabase: SupabaseClient,
  opts: {
    name: string;
    hull: string;
    fromYear: number | null;
    fromMonth: number | null;
    toYear: number | null;
    toMonth: number | null;
    role: string;
    note: string;
  },
): Promise<{ status: "saved"; id: string } | { status: "error"; message: string }> {
  const memberId = await resolveMemberId(supabase);
  if (!memberId) return { status: "error", message: "Couldn't find your record — try again." };
  const name = opts.name.trim();
  // The ONLY required field. A veteran who remembers the ship and nothing else
  // still has something worth putting in front of a VSO.
  if (!name) return { status: "error", message: "Add the ship's name to save this." };
  const { data, error } = await supabase
    .from("vessels")
    .insert({
      member_id: memberId,
      name,
      hull: opts.hull.trim() || null,
      from_year: opts.fromYear,
      from_month: opts.fromMonth,
      to_year: opts.toYear,
      to_month: opts.toMonth,
      role: opts.role.trim() || null,
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

export async function deleteVessel(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from("vessels").delete().eq("id", id);
}
