import type { SupabaseClient } from "@supabase/supabase-js";
import { bootCampsFor } from "./gazetteer";
import { isMissingColumnError } from "./supabaseErrors";

// ─────────────────────────────────────────────────────────────────────────────
// BOOT CAMP — ONE BRAIN.
//
// Boot camp is the one place every veteran has been, everybody remembers the year
// they shipped, and several training posts carry documented exposures of their
// own (lead on the ranges above all). So it becomes a real check-in pin, not a
// profile field — which means it counts toward the record and prints in the packet
// like anywhere else he served.
//
// This logic lives here rather than inside the intake wizard because it is now
// reachable from TWO places: the wizard at signup, and Account afterwards. A
// veteran who skipped the question at signup previously had no way to add it
// later — the wizard has no back-navigation, and Account never asked. Copies of
// this function in two components would drift, and drift in this codebase has
// already produced a packet that disagreed with the screen.
// ─────────────────────────────────────────────────────────────────────────────

export type BootCampSaveResult =
  | { status: "saved"; place: string }
  | { status: "already-there"; place: string }
  | { status: "skipped"; reason: string };

/** Minimal shape of a known exposure site — matches what the map already loads. */
export type BootCampSite = { name: string; exposure_classes?: string[] | null };

/**
 * Create the boot-camp check-in, once. Idempotent on place_name, so re-running
 * the wizard — or saving Account twice — never creates a second pin.
 *
 * Never invents a date: if the year is missing or implausible it declines rather
 * than stamping a guess into what is ultimately a quasi-legal record.
 */
export async function saveBootCampCheckIn(
  supabase: SupabaseClient,
  opts: {
    branch: string | null | undefined;
    campName: string;
    year: string | number | null | undefined;
    fallbackYear?: string | number | null | undefined;
    /** 0 or omitted = not sure/not given. Everybody remembers the year; the month is a bonus, never required. */
    month?: number | null | undefined;
    /** "I don't remember exactly" — a different, honest answer from "I know the year but not the month." */
    approximate?: boolean | null | undefined;
    sites?: BootCampSite[];
  },
): Promise<BootCampSaveResult> {
  const { branch, campName, year, fallbackYear, month, approximate, sites = [] } = opts;

  if (!campName || campName === "__other") return { status: "skipped", reason: "no camp selected" };

  const entry = bootCampsFor(branch).find((b) => b.name === campName);
  if (!entry) return { status: "skipped", reason: "camp not in the gazetteer for that branch" };

  const placeName = `${entry.name}, ${entry.region}`;

  const { data: existing } = await supabase
    .from("check_ins")
    .select("id")
    .eq("place_name", placeName)
    .limit(1);
  if (existing?.length) return { status: "already-there", place: placeName };

  const parsed = parseInt(String(year ?? "")) || parseInt(String(fallbackYear ?? ""));
  const thisYear = new Date().getUTCFullYear();
  if (!parsed || parsed < 1940 || parsed > thisYear) {
    return { status: "skipped", reason: "no usable year — a record with an invented date is worse than an incomplete one" };
  }

  // Whatever is already documented at that installation rides along.
  const site = sites.find((s) =>
    s.name.toLowerCase().includes(entry.name.toLowerCase().replace(/ \(.*\)/, "")),
  );
  const classes = Array.from(new Set(site?.exposure_classes ?? []));

  const { data: newId } = await supabase.rpc("log_check_in", {
    p_lng: entry.lng,
    p_lat: entry.lat,
    p_year: parsed,
    p_conflict: null,
    p_exposures: classes,
  });

  if (!newId) return { status: "skipped", reason: "check-in was not created" };

  const patch: { place_name: string; notes: string; date_start?: string; date_start_precision?: string } = {
    place_name: placeName,
    notes: "Basic training / boot camp.",
  };
  if (month && month >= 1 && month <= 12) patch.date_start = `${parsed}-${String(month).padStart(2, "0")}-01`;
  patch.date_start_precision = approximate ? "approximate" : month && month >= 1 && month <= 12 ? "month" : "year";

  const { error: patchErr } = await supabase.from("check_ins").update(patch).eq("id", newId);
  // date_start_precision (migration 0023) may not have landed yet — retry
  // without it rather than lose the pin's place name and date entirely.
  if (patchErr && isMissingColumnError(patchErr)) {
    const { date_start_precision: _p, ...corePatch } = patch;
    void _p;
    await supabase.from("check_ins").update(corePatch).eq("id", newId);
  }

  return { status: "saved", place: placeName };
}

/** Has this veteran already got a boot-camp pin? Used to show Account the truth. */
export async function findBootCampCheckIn(
  supabase: SupabaseClient,
  branch: string | null | undefined,
): Promise<{ place: string; year: number | null; month: number | null; approximate: boolean } | null> {
  const camps = bootCampsFor(branch);
  if (camps.length === 0) return null;
  const names = camps.map((c) => `${c.name}, ${c.region}`);

  // date_start_precision (migration 0023) read defensively — pre-migration
  // rows (or a database that hasn't run it yet) fall back to the same
  // "-01-01 reads as year-only" heuristic this file used before it existed.
  const withPrecision = await supabase
    .from("check_ins")
    .select("place_name, date_start, date_start_precision")
    .in("place_name", names)
    .limit(1);
  let row = withPrecision.data?.[0] as { place_name: string; date_start: string | null; date_start_precision: string | null } | undefined;
  if (withPrecision.error) {
    const fallback = await supabase.from("check_ins").select("place_name, date_start").in("place_name", names).limit(1);
    const r = fallback.data?.[0] as { place_name: string; date_start: string | null } | undefined;
    row = r ? { ...r, date_start_precision: null } : undefined;
  }
  if (!row) return null;
  const d = row.date_start ? new Date(row.date_start) : null;
  const approximate = row.date_start_precision === "approximate";
  return {
    place: row.place_name,
    year: d ? d.getUTCFullYear() : null,
    month: !d || approximate ? null : d.getUTCMonth() + 1,
    approximate,
  };
}
