import type { SupabaseClient } from "@supabase/supabase-js";
import type { IncidentClass } from "./education";
import { isMissingColumnError } from "./supabaseErrors";

// INCIDENTS — the data layer for the "Injuries & events" page.
//
// Deliberately reuses log_check_in (the same RPC the map already uses) so a
// single-incident entry is a real check-in pin, unmapped (0,0) until the
// veteran places it — same "not yet pinned" convention IntakeFormView already
// uses for locations without geocoding. This keeps injuries flowing through
// the EXACT SAME timeline/condition-matching/packet pipeline exposures do,
// with zero changes needed to that pipeline. A "repeated" entry creates one
// check-in spanning the date range instead of a single point.

export type Provenance = "recalled" | "confirmable" | "in_record" | "document_held";

export const PROVENANCE_OPTIONS: { value: Provenance; label: string }[] = [
  { value: "recalled", label: "I remember it" },
  { value: "confirmable", label: "Someone else can confirm it" },
  { value: "in_record", label: "It's in my service or medical record" },
  { value: "document_held", label: "I have the document" },
];
export const PROVENANCE_LABEL: Record<Provenance, string> = Object.fromEntries(
  PROVENANCE_OPTIONS.map((o) => [o.value, o.label]),
) as Record<Provenance, string>;

export type IncidentRecord = {
  id: string;
  checkInId: string;
  incidentClass: IncidentClass;
  provenance: Provenance | null;
  repeated: boolean;
  roleOrUnit: string | null;
  frequency: string | null;
  detail: string | null;
  placeName: string | null;
  dateStart: string | null;
  dateEnd: string | null;
  dateStartPrecision: string | null;
  createdAt: string;
};

type RawRow = {
  id: string; check_in_id: string; incident_class: IncidentClass; provenance: string | null;
  repeated: boolean | null; role_or_unit: string | null; frequency: string | null; detail: string | null;
  created_at: string;
  check_ins: { place_name: string | null; date_start: string | null; date_end: string | null; date_start_precision: string | null } | null;
};

function fromRaw(r: RawRow): IncidentRecord {
  return {
    id: r.id,
    checkInId: r.check_in_id,
    incidentClass: r.incident_class,
    provenance: (r.provenance as Provenance) ?? null,
    repeated: !!r.repeated,
    roleOrUnit: r.role_or_unit,
    frequency: r.frequency,
    detail: r.detail,
    placeName: r.check_ins?.place_name ?? null,
    dateStart: r.check_ins?.date_start ?? null,
    dateEnd: r.check_ins?.date_end ?? null,
    dateStartPrecision: r.check_ins?.date_start_precision ?? null,
    createdAt: r.created_at,
  };
}

export async function listMemberIncidents(
  supabase: SupabaseClient,
): Promise<{ incidents: IncidentRecord[] } | { error: string }> {
  const wide = await supabase
    .from("incidents")
    .select("id, check_in_id, incident_class, provenance, repeated, role_or_unit, frequency, detail, created_at, check_ins(place_name, date_start, date_end, date_start_precision)")
    .order("created_at", { ascending: false });
  if (!wide.error) return { incidents: (wide.data ?? []).map((r) => fromRaw(r as unknown as RawRow)) };
  if (!isMissingColumnError(wide.error)) return { error: wide.error.message };
  // Migration 0025 hasn't landed yet — the new columns don't exist.
  const narrow = await supabase
    .from("incidents")
    .select("id, check_in_id, incident_class, detail, created_at, check_ins(place_name, date_start, date_end, date_start_precision)")
    .order("created_at", { ascending: false });
  if (narrow.error) return { error: narrow.error.message };
  return {
    incidents: (narrow.data ?? []).map((r) =>
      fromRaw({ ...(r as unknown as RawRow), provenance: null, repeated: false, role_or_unit: null, frequency: null }),
    ),
  };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export async function createIncidentEntry(
  supabase: SupabaseClient,
  opts:
    | {
        repeated: false;
        incidentClass: IncidentClass;
        placeName: string;
        year: number;
        month: number; // 0 = not sure
        day: number; // 0 = not set
        approximate: boolean;
        provenance: Provenance;
        detail: string;
      }
    | {
        repeated: true;
        incidentClass: IncidentClass;
        roleOrUnit: string;
        rangeStartYear: number;
        rangeEndYear: number;
        frequency: string;
        provenance: Provenance;
        detail: string;
      },
): Promise<{ status: "saved" } | { status: "error"; message: string }> {
  const anchorYear = opts.repeated ? opts.rangeStartYear : opts.year;
  const { data: checkInId, error: rpcErr } = await supabase.rpc("log_check_in", {
    p_lng: 0,
    p_lat: 0,
    p_year: anchorYear,
    p_conflict: null,
    p_exposures: [],
    p_incidents: [opts.incidentClass],
  });
  if (rpcErr) return { status: "error", message: rpcErr.message };
  if (!checkInId) return { status: "error", message: "Could not save — try again." };

  const patch: {
    place_name: string; notes: string; date_start?: string; date_end?: string;
    date_start_precision?: string; date_end_precision?: string;
  } = {
    place_name: opts.repeated ? opts.roleOrUnit : opts.placeName,
    notes: "Logged from Injuries & events — location not yet pinned on the map.",
  };
  if (opts.repeated) {
    patch.date_start = `${opts.rangeStartYear}-01-01`;
    patch.date_start_precision = "year";
    patch.date_end = `${opts.rangeEndYear}-12-31`;
    patch.date_end_precision = "year";
  } else {
    const hasMonth = opts.month >= 1 && opts.month <= 12;
    const hasDay = hasMonth && opts.day >= 1;
    patch.date_start = `${opts.year}-${hasMonth ? pad(opts.month) : "01"}-${hasDay ? pad(opts.day) : "01"}`;
    patch.date_start_precision = opts.approximate ? "approximate" : hasDay ? "day" : hasMonth ? "month" : "year";
  }

  const { error: patchErr } = await supabase.from("check_ins").update(patch).eq("id", checkInId);
  if (patchErr && isMissingColumnError(patchErr)) {
    const { date_start_precision: _dsp, date_end_precision: _dep, ...core } = patch;
    void _dsp; void _dep;
    await supabase.from("check_ins").update(core).eq("id", checkInId);
  }

  // log_check_in only inserts incident_class — find the row it created and
  // add the fields it doesn't know about (provenance, repeated mode, detail).
  const { data: incRows } = await supabase.from("incidents").select("id").eq("check_in_id", checkInId).limit(1);
  const incidentId = incRows?.[0]?.id as string | undefined;
  if (incidentId) {
    const incidentPatch: Record<string, unknown> = { detail: opts.detail.trim() || null };
    incidentPatch.provenance = opts.provenance;
    incidentPatch.repeated = opts.repeated;
    incidentPatch.role_or_unit = opts.repeated ? opts.roleOrUnit : null;
    incidentPatch.frequency = opts.repeated ? opts.frequency : null;
    const { error: incErr } = await supabase.from("incidents").update(incidentPatch).eq("id", incidentId);
    if (incErr && isMissingColumnError(incErr)) {
      // Migration 0025 hasn't landed yet — the pin and the incident class
      // itself are still saved; only the newer detail is lost for now.
      await supabase.from("incidents").update({ detail: opts.detail.trim() || null }).eq("id", incidentId);
    }
  }

  return { status: "saved" };
}

export async function deleteIncident(supabase: SupabaseClient, incidentId: string, checkInId: string): Promise<void> {
  // Deleting the check-in cascades to the incident row (on delete cascade).
  await supabase.from("check_ins").delete().eq("id", checkInId);
  void incidentId;
}
