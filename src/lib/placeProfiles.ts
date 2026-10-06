import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingTableError } from "./supabaseErrors";

// The ONE file allowed to query `place_profiles` — same query isolation the
// vessels, shots and medications tables have.
//
// What this holds: short historical profiles of places veterans served, shown
// in the "background on this place" panel. It is public reference text, not
// anybody's record. Nothing here is keyed to a member, and nothing here may
// ever be.
//
// What this module deliberately does NOT export: any write path. The table is
// read-only to every client including the route handlers, because this app
// carries no service-role key and a server write would therefore be a client
// write too. Rows arrive as a reviewed seed migration. See 0033 for the full
// reasoning before adding anything here.

export type PlaceProfile = { display_name: string; profile: string };

/** The lookup key: lowercased, trimmed, inner whitespace collapsed. */
export function placeKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Keys to try, in order. IntakeFormView stores place_name as "Name, Region"
 *  when the name does not already contain the region, so the same installation
 *  arrives as either form depending on how it was logged.
 *
 *  Resolved at READ time rather than by seeding both spellings. Seeding both
 *  meant generating two separate profiles for one place, which cost twice as
 *  much and — worse — produced two different texts, so what a veteran read
 *  depended on which spelling his check-in happened to carry. One place, one
 *  profile. */
export function placeKeyCandidates(name: string): string[] {
  const exact = placeKey(name);
  const out = [exact];
  const comma = exact.lastIndexOf(",");
  if (comma > 1) {
    const bare = exact.slice(0, comma).trim();
    if (bare && bare !== exact) out.push(bare);
  }
  return out;
}

/** Reviewed profile for this place, or null. Never throws: a missing table or a
 *  database hiccup must degrade to the live model call, never to an error in
 *  front of a veteran who only wanted to read about where he served. */
export async function lookupPlaceProfile(
  supabase: SupabaseClient,
  name: string,
): Promise<PlaceProfile | null> {
  const keys = placeKeyCandidates(name).filter(Boolean);
  if (!keys.length) return null;
  try {
    // One round trip for both spellings. Ordered by key length descending so the
    // more specific "name, region" form wins when both happen to exist.
    const { data, error } = await supabase
      .from("place_profiles")
      .select("display_name, profile, name_key")
      .in("name_key", keys)
      .order("name_key", { ascending: false })
      .limit(1)
      .maybeSingle();
    // isMissingTableError covers the window between deploying this code and
    // applying 0033 — the same defensive read the vessels page uses.
    if (error) return null;
    return (data as PlaceProfile | null) ?? null;
  } catch {
    return null;
  }
}

// Re-exported so a caller that wants to distinguish "not set up yet" from
// "no row for this place" can, without reaching for supabaseErrors itself.
export { isMissingTableError };
