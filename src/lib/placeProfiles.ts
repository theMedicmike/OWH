import profiles from "@/data/place-profiles.json";

// THE PLACE PROFILES — short histories of the installations veterans served at,
// shown in the "background on this place" panel.
//
// Static reference data, exactly like the gazetteer and the VSO directory
// (src/data/vso-directory.json, 1.4 MB, imported the same way). It lives in the
// repo, it ships with the build, and it is server-side only: the one route that
// reads it is /api/base-info, so none of this crosses the wire to a browser
// except the single profile a veteran asked for.
//
// WHY THIS IS A FILE AND NOT A TABLE. It was briefly a table (migration 0033,
// dropped in 0036). Two reasons it moved:
//
//   1. The table could take no writes from anyone — correctly, because this app
//      holds no service-role key, so any policy letting a route write shared
//      text would let any signed-in veteran write it too. That made the table
//      seed-only, which is to say: static data, in a database, for no reason.
//   2. Getting the rows IN was the tell. A seed migration means the prose has to
//      be transcribed into SQL by whatever is doing the applying. For 361
//      hand-written historical profiles that is a corruption risk with no
//      upside — one drifted word in a paragraph a veteran will believe and
//      repeat. As a file the bytes are never retyped, and `git diff` shows
//      precisely what changed.
//
// WHAT THIS IS NOT: a claim, a rating, an exposure finding, or anything keyed to
// a member. It is place history only — the system prompt that writes it forbids
// health, exposure and VA-claim content on purpose, so that a profile can never
// become an argument about somebody's service connection.
//
// Regenerate with: node scripts/build-place-profiles.cjs
// Review with:     node scripts/qa-place-profiles.cjs

type Entry = { n: string; p: string };
const PLACES = (profiles as { places: Record<string, Entry> }).places;

export type PlaceProfile = { display_name: string; profile: string };

/** The lookup key: lowercased, trimmed, inner whitespace collapsed. */
export function placeKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Keys to try, in order. IntakeFormView stores place_name as "Name, Region"
 *  when the name does not already contain the region, so the same installation
 *  arrives in either form depending on how it was logged.
 *
 *  Resolved at READ time rather than by storing both spellings. Storing both
 *  meant generating two separate profiles for one place — twice the cost, and
 *  two DIFFERENT texts, so what a veteran read depended on which spelling his
 *  check-in happened to carry. One place, one profile. */
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

/** The stored profile for this place, or null if we have none — in which case
 *  the caller falls through to the live model call, exactly as before. This is
 *  an optimisation and a quality control, never a gate: a place we have not
 *  written about still gets an answer. */
export function lookupPlaceProfile(name: string): PlaceProfile | null {
  for (const key of placeKeyCandidates(name)) {
    const hit = PLACES[key];
    if (hit) return { display_name: hit.n, profile: hit.p };
  }
  return null;
}

/** How many we hold. Used by the tests and worth having in a log line. */
export const PLACE_PROFILE_COUNT = Object.keys(PLACES).length;
