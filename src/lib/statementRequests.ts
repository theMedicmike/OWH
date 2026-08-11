import type { SupabaseClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────────────────────
// WITNESS STATEMENTS — shared logic for both sides of the link.
//
// A veteran picks something they logged (an exposure, a condition, or nothing
// specific), generates a link, and sends it themselves — by text, email,
// whatever — to someone who can speak to it: a spouse, a battle buddy who
// never joined this app, a commander, a friend. The witness needs no account.
//
// The subject text a witness sees is always computed server-side, in the
// create_statement_request() function (migration 0018), from the veteran's OWN
// records with ownership checked. Nothing the veteran didn't already log is
// ever exposed through the link.
// ─────────────────────────────────────────────────────────────────────────────

export const RELATIONSHIP_OPTIONS = [
  "Spouse or family member",
  "Served with me",
  "Commander or NCOIC",
  "Friend",
  "Other",
];

// Which kind of witness this is — drives which prompt they see, since
// "what did you see happen" and "what have you noticed change" are different
// questions that need different answers.
export const WITNESS_TYPE_OPTIONS: { v: string; label: string }[] = [
  { v: "same_unit", label: "I served with them — I saw it happen" },
  { v: "family_or_after", label: "I know them from home or family life — I've seen the change" },
];

export type StatementSubjectType = "exposure" | "condition" | "general";

export type StatementRequest = {
  id: string;
  token: string;
  subject_type: StatementSubjectType;
  subject_label: string;
  veteran_note: string | null;
  status: "pending" | "submitted" | "revoked";
  created_at: string;
  submitted_at: string | null;
};

export type WitnessStatement = {
  id: string;
  request_id: string;
  witness_name: string;
  relationship: string;
  contact: string | null;
  statement: string;
  created_at: string;
  witness_type?: string | null;
  relationship_detail?: string | null;
  knew_from?: number | null;
  knew_to?: number | null;
  firsthand_confirmed?: boolean | null;
  attested?: boolean | null;
};

/** True when the error means "migration 0018 hasn't been run yet," not a real failure. */
export function isNotSetUpYet(e: { code?: string; message?: string } | null | undefined): boolean {
  if (!e) return false;
  if (e.code === "PGRST202" || e.code === "42883" || e.code === "42P01") return true;
  const m = e.message ?? "";
  return /could not find the function|does not exist|schema cache/i.test(m);
}

export async function createStatementRequest(
  supabase: SupabaseClient,
  opts: { subjectType: StatementSubjectType; subjectId: string | null; note: string },
): Promise<{ token: string } | { error: string }> {
  const { data, error } = await supabase
    .rpc("create_statement_request", { p_subject_type: opts.subjectType, p_subject_id: opts.subjectId, p_note: opts.note })
    .select()
    .single();
  if (error) return { error: isNotSetUpYet(error) ? "not-set-up" : error.message };
  return { token: (data as { token: string }).token };
}

export async function listStatementRequests(
  supabase: SupabaseClient,
): Promise<{ requests: StatementRequest[]; statements: WitnessStatement[] } | { error: string }> {
  const [reqRes, stRes] = await Promise.all([
    supabase.from("statement_requests").select("*").order("created_at", { ascending: false }),
    supabase.from("witness_statements").select("*").order("created_at", { ascending: false }),
  ]);
  if (reqRes.error) return { error: isNotSetUpYet(reqRes.error) ? "not-set-up" : reqRes.error.message };
  return {
    requests: (reqRes.data ?? []) as StatementRequest[],
    statements: (stRes.data ?? []) as WitnessStatement[],
  };
}

export async function revokeStatementRequest(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.rpc("revoke_statement_request", { p_id: id });
}

export type PublicStatementRequest = {
  status: "pending" | "submitted" | "revoked" | "expired" | "invalid";
  subject_label: string | null;
  veteran_note: string | null;
  requester_name: string | null;
};

export async function getPublicStatementRequest(supabase: SupabaseClient, token: string): Promise<PublicStatementRequest> {
  const { data, error } = await supabase.rpc("get_statement_request", { p_token: token }).select().maybeSingle();
  if (error || !data) return { status: "invalid", subject_label: null, veteran_note: null, requester_name: null };
  return data as PublicStatementRequest;
}

export async function submitWitnessStatement(
  supabase: SupabaseClient,
  opts: {
    token: string; witnessName: string; relationship: string; statement: string; contact: string;
    witnessType: string; relationshipDetail: string; knewFrom: number | null; knewTo: number | null;
    firsthandConfirmed: boolean; attested: boolean;
  },
): Promise<"ok" | "invalid" | "expired" | "submitted" | "revoked"> {
  const { data, error } = await supabase.rpc("submit_witness_statement", {
    p_token: opts.token,
    p_witness_name: opts.witnessName,
    p_relationship: opts.relationship,
    p_statement: opts.statement,
    p_contact: opts.contact || null,
    p_witness_type: opts.witnessType || null,
    p_relationship_detail: opts.relationshipDetail || null,
    p_knew_from: opts.knewFrom,
    p_knew_to: opts.knewTo,
    p_firsthand_confirmed: opts.firsthandConfirmed,
    p_attested: opts.attested,
  });
  if (error) return "invalid";
  return data as "ok" | "invalid" | "expired" | "submitted" | "revoked";
}
