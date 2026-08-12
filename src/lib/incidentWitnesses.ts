import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingTableError } from "./supabaseErrors";
import { resolveMemberId } from "./serviceEvents";

// WITNESS / BUDDY CONTACT CAPTURE — pure capture, nothing more. A veteran
// logging an injury or event can jot down who else was there before the
// name is lost to memory. Nothing here is sent to anyone automatically —
// that stays a deliberate, separate action through the existing Battle
// buddies "ask them directly" flow (lib/statementRequests.ts).
//
// The injuries council flagged this idea as carrying MST-adjacent risk and
// asked for a narrower answer before shipping. This module has no opinion
// on that — the gate lives in the UI, at the incident_class level
// (lib/incidentCopy.ts's isMarkersBased()), which decides whether to even
// show the capture form for a given incident. This module just stores
// whatever the app decides to write.

export type IncidentWitness = {
  id: string;
  incident_id: string;
  name: string;
  relationship: string | null;
  contact: string | null;
  created_at: string;
};

export async function listIncidentWitnesses(
  supabase: SupabaseClient,
  incidentId: string,
): Promise<{ witnesses: IncidentWitness[] } | { error: string }> {
  const { data, error } = await supabase
    .from("incident_witnesses")
    .select("*")
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: true });
  if (error) return { error: isMissingTableError(error) ? "not-set-up" : error.message };
  return { witnesses: (data ?? []) as IncidentWitness[] };
}

export async function createIncidentWitness(
  supabase: SupabaseClient,
  opts: { incidentId: string; name: string; relationship: string; contact: string },
): Promise<{ status: "saved" } | { status: "error"; message: string }> {
  const memberId = await resolveMemberId(supabase);
  if (!memberId) return { status: "error", message: "Couldn't find your record — try again." };
  const name = opts.name.trim();
  if (!name) return { status: "error", message: "Add their name to save this." };
  const { error } = await supabase.from("incident_witnesses").insert({
    incident_id: opts.incidentId,
    member_id: memberId,
    name,
    relationship: opts.relationship.trim() || null,
    contact: opts.contact.trim() || null,
  });
  if (error) return { status: "error", message: isMissingTableError(error) ? "This feature isn't switched on yet — nothing was saved." : error.message };
  return { status: "saved" };
}

export async function deleteIncidentWitness(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from("incident_witnesses").delete().eq("id", id);
}
