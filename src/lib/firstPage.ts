import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingTableError } from "./supabaseErrors";
import { resolveMemberId, listServiceEvents } from "./serviceEvents";
import { listMedications } from "./medications";
import { CONDITIONS } from "./conditions";
import { EXPOSURE_LABEL, INCIDENT_LABEL } from "./education";
import { veteranWords } from "./veteranWords";

// The First Page (Service Health Summary v1), decided 2026-11-24.
//
// This module is the ONE place the page's data is assembled and the ONE place
// its rules are enforced. The page says what happened to a veteran and where
// that is written down. It never says what is wrong with him. So:
//
//   - every printed row carries a source number and a tier word
//     (Record, Recalled, Witness, Clinic) and a year;
//   - values are copied as written, never computed, ranked or flagged;
//   - the veteran chooses every row; sexual-trauma incidents and mental-health
//     conditions default to off;
//   - the inference lint below refuses to print a row that reads like a
//     conclusion ("likely", "due to", "abnormal", "high", "low"...), except in
//     the veteran's own words and in medication directions copied verbatim;
//   - nothing a model wrote is ever printed. Shots are read only through
//     lib/serviceEvents and medications only through lib/medications, as the
//     firewall requires.
//
// Print route: src/app/first-page/print. Screens: src/app/first-page/*.

export type Tier = "record" | "recalled" | "witness" | "clinic";
export const TIERS: Tier[] = ["record", "recalled", "witness", "clinic"];
export const TIER_LABEL: Record<Tier, string> = {
  record: "Record",
  recalled: "Recalled",
  witness: "Witness",
  clinic: "Clinic",
};
export const TIER_HELP: Record<Tier, string> = {
  record: "In a document in the folder.",
  recalled: "The veteran's memory.",
  witness: "A signed statement from someone else.",
  clinic: "A clinician's own note.",
};

export type SourceStatus = "received" | "pending" | "not_requested" | "not_found" | "closed";
export const SOURCE_STATUS_LABEL: Record<SourceStatus, string> = {
  received: "Received",
  pending: "Pending",
  not_requested: "Not yet requested",
  not_found: "Not found",
  closed: "Closed",
};

export type FpSource = {
  id: string;
  number: number;
  label: string;
  source_date: string | null;
  author: string | null;
  status: SourceStatus;
  document_path: string | null;
  note: string | null;
  created_at: string;
};

export type FpAllergy = { id: string; text: string; tier: Tier; source_id: string | null; show: boolean; sort: number };
export type FpStudy = { id: string; text: string; study_date: string; tier: Tier; source_id: string | null; show: boolean; sort: number };
export type FpTried = { id: string; text: string; tier: Tier; source_id: string | null; show: boolean; sort: number };
export type FpResult = {
  id: string;
  measure: string;
  earlier_value: string;
  earlier_date: string;
  earlier_source_id: string | null;
  later_value: string;
  later_date: string;
  later_source_id: string | null;
  tier: Tier;
  show: boolean;
  sort: number;
};
// The line between them: the words the veteran chose to set in a chain on
// the front of his page, in his order. Free text he typed or a label he picked
// from his own record. The app never adds, orders or suggests a link on its
// own; a chain is something he states, not something it concludes.
export type FpChainLink = { id: string; word: string; detail: string | null; sort: number };

export type FpVisit = {
  id: string;
  specialist: string | null;
  visit_date: string | null;
  open_today: string | null;
  question1: string | null;
  question2: string | null;
  since_last_visit: string | null;
  read_first: string[];
  status: "planned" | "done";
  created_at: string;
};
export type FpRecording = {
  id: string;
  storage_path: string | null;
  duration_sec: number | null;
  recorded_on: string;
  transcript: string | null;
  consent_spoken: boolean;
  created_at: string;
};
export type FpProfile = {
  member_id: string;
  born_year: number | null;
  service_line1: string | null;
  service_line2: string | null;
  care_partner_name: string | null;
  care_partner_relation: string | null;
  care_partner_line: string | null;
  care_partner_phone: string | null;
  help_me: string | null;
  return_note_to: string | null;
  vhie_status: "on" | "off" | "unknown";
  vhie_checked_on: string | null;
  tes_date: string | null;
  tes_answer: string | null;
  tes_exposures: string | null;
  tes_followup: string | null;
  tes_source_id: string | null;
  specimens: string | null;
  no_record_found_for: string | null;
  corrections_to: string | null;
  assembled_by: string | null;
  tried_title: string | null;
  location_withheld: boolean;
};
export type RowTableKey = "conditions" | "medications" | "check_ins" | "exposures" | "shots" | "incidents";
export type FpRowMeta = {
  id: string;
  table_key: RowTableKey;
  row_id: string;
  show: boolean | null;
  source_id: string | null;
  tier: Tier | null;
  status: string | null;
  directions: string | null;
  since_year: number | null;
  unit: string | null;
  note: string | null;
};
export type FpPage = {
  id: string;
  visit_id: string | null;
  version_date: string;
  assembled_by: string | null;
  signed: boolean;
  corrections_to: string | null;
  created_at: string;
};

export const NOT_SET_UP = "not-set-up";
type Res<T> = { ok: true; data: T } | { ok: false; error: string };
const errOf = (e: { code?: string; message?: string } | null): string =>
  e ? (isMissingTableError(e) ? NOT_SET_UP : e.message ?? "Unknown error") : "Unknown error";

// ── sources ─────────────────────────────────────────────────────────────────
export async function listSources(supabase: SupabaseClient): Promise<Res<FpSource[]>> {
  const { data, error } = await supabase.from("fp_sources").select("*").order("number");
  if (error) return { ok: false, error: errOf(error) };
  return { ok: true, data: (data ?? []) as FpSource[] };
}
export async function createSource(
  supabase: SupabaseClient,
  s: { label: string; source_date: string; author: string; status: SourceStatus; document_path?: string | null; note?: string },
): Promise<Res<FpSource>> {
  const memberId = await resolveMemberId(supabase);
  if (!memberId) return { ok: false, error: "Couldn't find your record." };
  const label = s.label.trim();
  if (!label) return { ok: false, error: "Name the document first." };
  const existing = await supabase.from("fp_sources").select("number").order("number", { ascending: false }).limit(1);
  const next = ((existing.data?.[0] as { number: number } | undefined)?.number ?? 0) + 1;
  const { data, error } = await supabase
    .from("fp_sources")
    .insert({
      member_id: memberId,
      number: next,
      label,
      source_date: s.source_date.trim() || null,
      author: s.author.trim() || null,
      status: s.status,
      document_path: s.document_path ?? null,
      note: s.note?.trim() || null,
    })
    .select("*")
    .single();
  if (error) return { ok: false, error: errOf(error) };
  return { ok: true, data: data as FpSource };
}
export async function updateSource(supabase: SupabaseClient, id: string, patch: Partial<Omit<FpSource, "id" | "number" | "created_at">>): Promise<Res<null>> {
  const { error } = await supabase.from("fp_sources").update(patch).eq("id", id);
  return error ? { ok: false, error: errOf(error) } : { ok: true, data: null };
}
export async function deleteSource(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from("fp_sources").delete().eq("id", id);
}

// ── simple row tables (allergies, studies, tried, results) ──────────────────
export type SimpleTable = "fp_allergies" | "fp_studies" | "fp_tried" | "fp_results" | "fp_chain";
export async function listSimple<T>(supabase: SupabaseClient, table: SimpleTable): Promise<Res<T[]>> {
  const { data, error } = await supabase.from(table).select("*").order("sort").order("created_at");
  if (error) return { ok: false, error: errOf(error) };
  return { ok: true, data: (data ?? []) as T[] };
}
export async function insertSimple<T>(supabase: SupabaseClient, table: SimpleTable, row: Record<string, unknown>): Promise<Res<T>> {
  const memberId = await resolveMemberId(supabase);
  if (!memberId) return { ok: false, error: "Couldn't find your record." };
  const { data, error } = await supabase.from(table).insert({ member_id: memberId, ...row }).select("*").single();
  if (error) return { ok: false, error: errOf(error) };
  return { ok: true, data: data as T };
}
export async function updateSimple(supabase: SupabaseClient, table: SimpleTable, id: string, patch: Record<string, unknown>): Promise<Res<null>> {
  const { error } = await supabase.from(table).update(patch).eq("id", id);
  return error ? { ok: false, error: errOf(error) } : { ok: true, data: null };
}
export async function deleteSimple(supabase: SupabaseClient, table: SimpleTable, id: string): Promise<void> {
  await supabase.from(table).delete().eq("id", id);
}

// ── profile ─────────────────────────────────────────────────────────────────
export async function getProfile(supabase: SupabaseClient): Promise<Res<FpProfile | null>> {
  const { data, error } = await supabase.from("fp_profile").select("*").maybeSingle();
  if (error) return { ok: false, error: errOf(error) };
  return { ok: true, data: (data as FpProfile | null) ?? null };
}
export async function upsertProfile(supabase: SupabaseClient, patch: Partial<Omit<FpProfile, "member_id">>): Promise<Res<null>> {
  const memberId = await resolveMemberId(supabase);
  if (!memberId) return { ok: false, error: "Couldn't find your record." };
  const { error } = await supabase.from("fp_profile").upsert({ member_id: memberId, ...patch, updated_at: new Date().toISOString() }, { onConflict: "member_id" });
  return error ? { ok: false, error: errOf(error) } : { ok: true, data: null };
}

// ── visits ──────────────────────────────────────────────────────────────────
export async function listVisits(supabase: SupabaseClient): Promise<Res<FpVisit[]>> {
  const { data, error } = await supabase.from("fp_visits").select("*").order("visit_date", { ascending: false, nullsFirst: true });
  if (error) return { ok: false, error: errOf(error) };
  return { ok: true, data: (data ?? []) as FpVisit[] };
}
export async function createVisit(supabase: SupabaseClient, v: Partial<Omit<FpVisit, "id" | "created_at">>): Promise<Res<FpVisit>> {
  const memberId = await resolveMemberId(supabase);
  if (!memberId) return { ok: false, error: "Couldn't find your record." };
  const { data, error } = await supabase.from("fp_visits").insert({ member_id: memberId, ...v }).select("*").single();
  if (error) return { ok: false, error: errOf(error) };
  return { ok: true, data: data as FpVisit };
}
export async function updateVisit(supabase: SupabaseClient, id: string, patch: Partial<Omit<FpVisit, "id" | "created_at">>): Promise<Res<null>> {
  const { error } = await supabase.from("fp_visits").update(patch).eq("id", id);
  return error ? { ok: false, error: errOf(error) } : { ok: true, data: null };
}
export async function deleteVisit(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from("fp_visits").delete().eq("id", id);
}

// ── recordings ──────────────────────────────────────────────────────────────
export async function listRecordings(supabase: SupabaseClient): Promise<Res<FpRecording[]>> {
  const { data, error } = await supabase.from("fp_recordings").select("*").order("created_at", { ascending: false });
  if (error) return { ok: false, error: errOf(error) };
  return { ok: true, data: (data ?? []) as FpRecording[] };
}
export async function createRecording(
  supabase: SupabaseClient,
  r: { storage_path: string | null; duration_sec: number | null; transcript: string; consent_spoken: boolean },
): Promise<Res<FpRecording>> {
  const memberId = await resolveMemberId(supabase);
  if (!memberId) return { ok: false, error: "Couldn't find your record." };
  const { data, error } = await supabase
    .from("fp_recordings")
    .insert({ member_id: memberId, storage_path: r.storage_path, duration_sec: r.duration_sec, transcript: r.transcript.trim() || null, consent_spoken: r.consent_spoken })
    .select("*")
    .single();
  if (error) return { ok: false, error: errOf(error) };
  return { ok: true, data: data as FpRecording };
}
export async function updateRecording(supabase: SupabaseClient, id: string, patch: { transcript?: string | null }): Promise<Res<null>> {
  const { error } = await supabase.from("fp_recordings").update(patch).eq("id", id);
  return error ? { ok: false, error: errOf(error) } : { ok: true, data: null };
}
export async function deleteRecording(supabase: SupabaseClient, r: FpRecording): Promise<void> {
  if (r.storage_path) await supabase.storage.from("records").remove([r.storage_path]);
  await supabase.from("fp_recordings").delete().eq("id", r.id);
}

// ── row meta ────────────────────────────────────────────────────────────────
export async function listRowMeta(supabase: SupabaseClient): Promise<Res<FpRowMeta[]>> {
  const { data, error } = await supabase.from("fp_row_meta").select("*");
  if (error) return { ok: false, error: errOf(error) };
  return { ok: true, data: (data ?? []) as FpRowMeta[] };
}
export async function upsertRowMeta(
  supabase: SupabaseClient,
  tableKey: RowTableKey,
  rowId: string,
  patch: Partial<Omit<FpRowMeta, "id" | "table_key" | "row_id">>,
): Promise<Res<null>> {
  const memberId = await resolveMemberId(supabase);
  if (!memberId) return { ok: false, error: "Couldn't find your record." };
  const { error } = await supabase
    .from("fp_row_meta")
    .upsert({ member_id: memberId, table_key: tableKey, row_id: rowId, ...patch, updated_at: new Date().toISOString() }, { onConflict: "member_id,table_key,row_id" });
  return error ? { ok: false, error: errOf(error) } : { ok: true, data: null };
}

// ── page versions ───────────────────────────────────────────────────────────
export async function listPages(supabase: SupabaseClient): Promise<Res<FpPage[]>> {
  const { data, error } = await supabase.from("fp_pages").select("id, visit_id, version_date, assembled_by, signed, corrections_to, created_at").order("created_at", { ascending: false });
  if (error) return { ok: false, error: errOf(error) };
  return { ok: true, data: (data ?? []) as FpPage[] };
}
export async function createPageVersion(
  supabase: SupabaseClient,
  p: { visit_id: string | null; assembled_by: string | null; signed: boolean; corrections_to: string | null; snapshot: PageData },
): Promise<Res<FpPage>> {
  const memberId = await resolveMemberId(supabase);
  if (!memberId) return { ok: false, error: "Couldn't find your record." };
  const { data, error } = await supabase
    .from("fp_pages")
    .insert({ member_id: memberId, visit_id: p.visit_id, assembled_by: p.assembled_by, signed: p.signed, corrections_to: p.corrections_to, snapshot: p.snapshot })
    .select("id, visit_id, version_date, assembled_by, signed, corrections_to, created_at")
    .single();
  if (error) return { ok: false, error: errOf(error) };
  return { ok: true, data: data as FpPage };
}

// ── the assembled page ──────────────────────────────────────────────────────
export type PageRow = {
  id: string;
  kind: RowTableKey | "allergy" | "study" | "tried" | "result";
  show: boolean;
  defaultOff: boolean; // sensitive rows start off
  tier: Tier;
  sourceNumber: number | null;
  // the printed cells, already copied as written
  cells: string[];
  // which cell holds the year the lint looks for; -1 = anywhere in the row
  yearIn: number;
  // the veteran's own words are exempt from the inference lint
  ownWords?: boolean;
  // exposures and incidents: the posting they belong to
  parentId?: string;
};

export type PageData = {
  name: string;
  born: string;
  line1: string;
  line2: string;
  profile: FpProfile | null;
  sources: FpSource[];
  allergies: PageRow[];
  carePartner: { line: string; contact: string } | null;
  readFirst: string[];
  returnNoteTo: string;
  problems: PageRow[];
  medications: PageRow[];
  medicationsAsOf: string | null;
  studies: PageRow[];
  tried: PageRow[];
  triedTitle: string;
  openToday: string;
  questions: string[];
  service: PageRow[];
  exposures: PageRow[];
  results: PageRow[];
  shots: PageRow[];
  specimens: string;
  noRecordFoundFor: string;
  helpMe: string;
  sinceLastVisit: string;
  visit: FpVisit | null;
  versionDate: string;
  assembledBy: string;
  correctionsTo: string;
  chain: { word: string; detail: string }[];
};

const MENTAL_HEALTH = new Set(CONDITIONS.filter((c) => c.system === "Mental health").map((c) => c.label.toLowerCase()));
const SENSITIVE_INCIDENTS = new Set(["military_sexual_trauma", "physical_assault"]);

// Sensitive rows start OFF and stay off unless the veteran turns them on:
// mental-health conditions and sexual-trauma or assault incidents. Everything
// else starts on. The Rows screen shows the same default the print uses.
export function defaultShowFor(kind: RowTableKey, labelOrClass: string): boolean {
  if (kind === "conditions") return !MENTAL_HEALTH.has(labelOrClass.toLowerCase());
  if (kind === "incidents") return !SENSITIVE_INCIDENTS.has(labelOrClass);
  return true;
}

function year(d: string | null | undefined): string {
  if (!d) return "";
  const m = String(d).match(/\b(19|20)\d{2}\b/);
  return m ? m[0] : "";
}
function yearRange(a: string | null | undefined, b: string | null | undefined): string {
  const ya = year(a), yb = year(b);
  if (ya && yb) return ya === yb ? ya : `${ya} to ${yb}`;
  return ya || yb || "";
}
function sourceNumberOf(sources: FpSource[], id: string | null | undefined): number | null {
  if (!id) return null;
  const s = sources.find((x) => x.id === id);
  return s ? s.number : null;
}
function tierFor(meta: FpRowMeta | undefined, sourceNumber: number | null, fallback: Tier): Tier {
  if (meta?.tier) return meta.tier;
  if (sourceNumber != null) return "record";
  return fallback;
}
function provenanceTier(p: string | null | undefined): Tier {
  return p === "in_record" || p === "document_held" ? "record" : "recalled";
}
const str = (s: string | null | undefined) => (s ?? "").trim();

type CheckIn = {
  id: string;
  place_name: string | null;
  date_start: string | null;
  date_end: string | null;
  role: string | null;
  confirmed: boolean | null;
  exposures: { id: string; exposure_class: string; detail: string | null; confirmed: boolean | null }[] | null;
  incidents: { id: string; incident_class: string; detail: string | null; provenance: string | null }[] | null;
};
type Condition = {
  id: string;
  label: string;
  onset_year: number | null;
  diagnosed_by: string | null;
  evidence_status: string | null;
};

export async function buildPage(supabase: SupabaseClient, visitId: string | null): Promise<Res<PageData>> {
  const [srcRes, profRes, metaRes, visitsRes] = await Promise.all([
    listSources(supabase),
    getProfile(supabase),
    listRowMeta(supabase),
    listVisits(supabase),
  ]);
  if (!srcRes.ok) return srcRes;
  if (!profRes.ok) return profRes;
  if (!metaRes.ok) return metaRes;
  if (!visitsRes.ok) return visitsRes;
  const sources = srcRes.data;
  const profile = profRes.data;
  const metas = metaRes.data;
  const metaFor = (key: RowTableKey, id: string) => metas.find((m) => m.table_key === key && m.row_id === id);
  const visit = visitId ? visitsRes.data.find((v) => v.id === visitId) ?? null : visitsRes.data[0] ?? null;

  const member = (
    await supabase.from("members").select("display_name, branch, service_start, service_end, mos").maybeSingle()
  ).data as { display_name: string | null; branch: string | null; service_start: string | null; service_end: string | null; mos: string | null } | null;

  // The record, read through the modules the firewall allows.
  const [allergiesRes, studiesRes, triedRes, resultsRes, medsRes, shotsRes, chainRes] = await Promise.all([
    listSimple<FpAllergy>(supabase, "fp_allergies"),
    listSimple<FpStudy>(supabase, "fp_studies"),
    listSimple<FpTried>(supabase, "fp_tried"),
    listSimple<FpResult>(supabase, "fp_results"),
    listMedications(supabase),
    listServiceEvents(supabase),
    listSimple<FpChainLink>(supabase, "fp_chain"),
  ]);
  for (const r of [allergiesRes, studiesRes, triedRes, resultsRes]) if (!r.ok) return r;

  const checkIns = ((
    await supabase
      .from("check_ins")
      .select("id, place_name, date_start, date_end, role, confirmed, exposures(id, exposure_class, detail, confirmed), incidents(id, incident_class, detail, provenance)")
      .order("date_start")
  ).data ?? []) as CheckIn[];
  const conditions = ((await supabase.from("conditions").select("id, label, onset_year, diagnosed_by, evidence_status").order("created_at")).data ?? []) as Condition[];

  const allergies: PageRow[] = allergiesRes.ok
    ? allergiesRes.data.map((a) => ({ id: a.id, kind: "allergy", show: a.show, defaultOff: false, tier: a.tier, sourceNumber: sourceNumberOf(sources, a.source_id), cells: [a.text], yearIn: -2 }))
    : [];

  const problems: PageRow[] = conditions.map((c) => {
    const meta = metaFor("conditions", c.id);
    const sn = sourceNumberOf(sources, meta?.source_id);
    const defaultOff = MENTAL_HEALTH.has(c.label.toLowerCase());
    return {
      id: c.id,
      kind: "conditions",
      show: meta?.show ?? !defaultOff,
      defaultOff,
      tier: tierFor(meta, sn, "recalled"),
      sourceNumber: sn,
      cells: [c.label, c.onset_year ? String(c.onset_year) : "", str(c.diagnosed_by), str(meta?.status)],
      yearIn: 1,
    };
  });

  const medications: PageRow[] = ("medications" in medsRes ? medsRes.medications : []).map((m) => {
    const meta = metaFor("medications", m.id);
    const sn = sourceNumberOf(sources, meta?.source_id);
    const name = m.brand_name && m.brand_name.toLowerCase() !== m.name.toLowerCase() ? `${m.name} (${m.brand_name})` : m.name;
    const since = meta?.since_year ?? m.started_year;
    return {
      id: m.id,
      kind: "medications",
      show: meta?.show ?? true,
      defaultOff: false,
      tier: tierFor(meta, sn, "recalled"),
      sourceNumber: sn,
      cells: [str(meta?.directions) ? `${name}. ${str(meta?.directions)}` : name, since ? String(since) : ""],
      yearIn: 1,
      ownWords: true, // directions are copied as printed on the pharmacy label
    };
  });

  const studies: PageRow[] = studiesRes.ok
    ? studiesRes.data.map((s) => ({ id: s.id, kind: "study", show: s.show, defaultOff: false, tier: s.tier, sourceNumber: sourceNumberOf(sources, s.source_id), cells: [s.text, s.study_date], yearIn: 1 }))
    : [];
  const tried: PageRow[] = triedRes.ok
    ? triedRes.data.map((t) => ({ id: t.id, kind: "tried", show: t.show, defaultOff: false, tier: t.tier, sourceNumber: sourceNumberOf(sources, t.source_id), cells: [t.text], yearIn: -1 }))
    : [];
  const results: PageRow[] = resultsRes.ok
    ? resultsRes.data.map((r) => {
        const a = sourceNumberOf(sources, r.earlier_source_id);
        const b = sourceNumberOf(sources, r.later_source_id);
        const sn = a != null && b != null && a !== b ? null : (a ?? b);
        return {
          id: r.id,
          kind: "result",
          show: r.show,
          defaultOff: false,
          tier: r.tier,
          sourceNumber: sn,
          cells: [r.measure, `${r.earlier_value}, ${r.earlier_date}`, `${r.later_value}, ${r.later_date}`, a != null && b != null && a !== b ? `${a} ${TIER_LABEL[r.tier]}, ${b} ${TIER_LABEL[r.tier]}` : ""],
          yearIn: -1,
        };
      })
    : [];

  const service: PageRow[] = checkIns.map((ci) => {
    const meta = metaFor("check_ins", ci.id);
    const sn = sourceNumberOf(sources, meta?.source_id);
    const where = meta?.status === "withheld" ? "Location withheld" : str(ci.place_name);
    return {
      id: ci.id,
      kind: "check_ins",
      show: meta?.show ?? ci.confirmed !== false,
      defaultOff: false,
      tier: tierFor(meta, sn, "recalled"),
      sourceNumber: sn,
      cells: [yearRange(ci.date_start, ci.date_end), [where, str(meta?.unit)].filter(Boolean).join(", "), str(ci.role)],
      yearIn: 0,
    };
  });

  const exposures: PageRow[] = [];
  for (const ci of checkIns) {
    const ciMeta = metaFor("check_ins", ci.id);
    const whereWhen = [ciMeta?.status === "withheld" ? "Location withheld" : str(ci.place_name), yearRange(ci.date_start, ci.date_end)].filter(Boolean).join(", ");
    for (const e of ci.exposures ?? []) {
      const meta = metaFor("exposures", e.id);
      const sn = sourceNumberOf(sources, meta?.source_id);
      const label = [EXPOSURE_LABEL[e.exposure_class] ?? e.exposure_class, veteranWords(e.detail)].filter(Boolean).join(": ");
      exposures.push({ parentId: ci.id, id: e.id, kind: "exposures", show: meta?.show ?? e.confirmed !== false, defaultOff: false, tier: tierFor(meta, sn, "recalled"), sourceNumber: sn, cells: [label, whereWhen, str(ciMeta?.unit)], yearIn: 1 });
    }
    for (const inc of ci.incidents ?? []) {
      const meta = metaFor("incidents", inc.id);
      const sn = sourceNumberOf(sources, meta?.source_id);
      const defaultOff = SENSITIVE_INCIDENTS.has(inc.incident_class);
      const label = [INCIDENT_LABEL[inc.incident_class] ?? inc.incident_class, veteranWords(inc.detail)].filter(Boolean).join(": ");
      exposures.push({ parentId: ci.id, id: inc.id, kind: "incidents", show: meta?.show ?? !defaultOff, defaultOff, tier: meta?.tier ?? (sn != null ? "record" : provenanceTier(inc.provenance)), sourceNumber: sn, cells: [label, whereWhen, str(ciMeta?.unit)], yearIn: 1 });
    }
  }
  if (profile?.tes_date) {
    const sn = sourceNumberOf(sources, profile.tes_source_id);
    const parts = [`VA toxic exposure screening answered ${str(profile.tes_answer) || "yes"} on ${profile.tes_date}`];
    if (str(profile.tes_exposures)) parts.push(`Which: ${str(profile.tes_exposures)}`);
    if (str(profile.tes_followup)) parts.push(`Follow-up asked for: ${str(profile.tes_followup)}`);
    exposures.push({ id: "tes", kind: "exposures", show: true, defaultOff: false, tier: sn != null ? "record" : "recalled", sourceNumber: sn, cells: [parts.join(". ") + ".", "", ""], yearIn: 0 });
  }

  const shots: PageRow[] = ("events" in shotsRes ? shotsRes.events : []).map((s) => {
    const meta = metaFor("shots", s.id);
    const sn = sourceNumberOf(sources, meta?.source_id);
    return {
      id: s.id,
      kind: "shots",
      show: meta?.show ?? true,
      defaultOff: false,
      tier: meta?.tier ?? (sn != null ? "record" : provenanceTier(s.provenance)),
      sourceNumber: sn,
      cells: [s.label, s.event_year ? String(s.event_year) : ""],
      yearIn: 1,
    };
  });

  const sy = year(member?.service_start), ey = year(member?.service_end);
  const line1 = str(profile?.service_line1) || [profile?.born_year ? `Born ${profile.born_year}.` : "", member?.branch ? `${member.branch}${sy ? `, ${sy}${ey ? ` to ${ey}` : ""}` : ""}${member?.mos ? `, ${member.mos}` : ""}.` : ""].filter(Boolean).join(" ");

  return {
    ok: true,
    data: {
      name: str(member?.display_name) || "Name not set",
      born: profile?.born_year ? String(profile.born_year) : "",
      line1,
      line2: str(profile?.service_line2),
      profile,
      sources,
      allergies,
      carePartner: profile && (str(profile.care_partner_name) || str(profile.care_partner_line))
        ? {
            line: [str(profile.care_partner_name), str(profile.care_partner_relation)].filter(Boolean).join(", ") + (str(profile.care_partner_line) ? `. ${str(profile.care_partner_line)}` : ""),
            contact: str(profile.care_partner_phone) ? `Phone: ${str(profile.care_partner_phone)}` : "",
          }
        : null,
      readFirst: (visit?.read_first ?? []).map((l) => l.trim()).filter(Boolean),
      returnNoteTo:
        str(profile?.return_note_to) +
        (profile?.vhie_status === "on" ? ` VA sharing to outside providers is on${profile.vhie_checked_on ? `, checked ${profile.vhie_checked_on}` : ""}.` : profile?.vhie_status === "off" ? " VA sharing to outside providers is off." : ""),
      problems,
      medications,
      medicationsAsOf: (() => {
        const ids = new Set(metas.filter((m) => m.table_key === "medications" && m.source_id).map((m) => m.source_id));
        const dates = sources.filter((s) => ids.has(s.id)).map((s) => s.source_date).filter(Boolean) as string[];
        return dates.sort().reverse()[0] ?? null;
      })(),
      studies,
      tried,
      triedTitle: str(profile?.tried_title) || "What has been tried",
      openToday: str(visit?.open_today),
      questions: [str(visit?.question1), str(visit?.question2)].filter(Boolean),
      service,
      exposures,
      results,
      shots,
      specimens: str(profile?.specimens),
      noRecordFoundFor: str(profile?.no_record_found_for),
      helpMe: str(profile?.help_me),
      sinceLastVisit: str(visit?.since_last_visit),
      visit,
      versionDate: new Date().toISOString().slice(0, 10),
      assembledBy: str(profile?.assembled_by),
      correctionsTo: str(profile?.corrections_to) || str(profile?.assembled_by),
      // fp_chain is migration 0040; until it runs the chain is simply empty.
      chain: chainRes.ok ? chainRes.data.map((c) => ({ word: str(c.word), detail: str(c.detail) })).filter((c) => c.word) : [],
    },
  };
}

// ── the ten parts of the page ───────────────────────────────────────────────
// In the order they are best filled in. Each knows from the page data alone
// whether it has been done. The hub draws them as its spine; Home's First Page
// door names the ones not done yet, in plain words (`short`).
export type PagePart = { href: string; label: string; short: string; what: string; done: (p: PageData) => boolean };

export const PAGE_PARTS: PagePart[] = [
  { href: "/first-page/sources", label: "Sources", short: "your sources", what: "Every document behind the page, numbered, with its date and where the request stands.", done: (p) => p.sources.length > 0 },
  { href: "/first-page/profile", label: "Who you are, who comes with you", short: "who you are", what: "Year of birth, the service lines, your care partner, how to help you in the room, the return address for the doctor's note.", done: (p) => !!p.born && !!p.carePartner && !!p.returnNoteTo },
  { href: "/first-page/allergies", label: "Allergies", short: "allergies", what: 'Even "No known drug allergies." The box on the front is never blank.', done: (p) => p.allergies.some((a) => a.show) },
  { href: "/first-page/rows", label: "Your problems, medicines, postings, exposures and shots", short: "which rows print", what: "Already in your record. Here you pick what prints, attach a source to each row, and copy medication directions word for word.", done: (p) => p.problems.some((r) => r.show && r.sourceNumber != null) && p.medications.some((r) => r.show && r.sourceNumber != null) },
  { href: "/first-page/studies", label: "Key studies", short: "key studies", what: "The MRI, the sleep study, the audiogram: type, date, and whether the report is in the folder.", done: (p) => p.studies.some((r) => r.show) },
  { href: "/first-page/tried", label: "What has been tried", short: "what has been tried", what: "Medicines and therapies tried before, with the year and why each stopped.", done: (p) => p.tried.some((r) => r.show) },
  { href: "/first-page/results", label: "Results that changed", short: "results that changed", what: "Two values, two dates, two sources. Copied as written. No arrows.", done: (p) => p.results.some((r) => r.show) },
  { href: "/first-page/record", label: "Your story, recorded", short: "your story", what: "Ten minutes in your own words, on a good day. You pick the three lines the doctor reads first.", done: () => true },
  { href: "/first-page/chain", label: "The line between them", short: "the line between them", what: "The words you set in a chain on the front of the page, in your order. Yours, never the app's.", done: (p) => p.chain.length > 0 },
  { href: "/first-page/visit", label: "This visit", short: "this visit", what: "Who you are seeing, what is open today, your two questions, since last visit, and the three lines.", done: (p) => !!p.visit && p.readFirst.length === 3 && p.questions.length === 2 },
];

// ── the sheet: the page as the app shows it ─────────────────────────────────
// The one-page face of the record, on sign-in and on Home. It is drawn from
// the same assembled page the print uses (buildPage), so it shows only rows the
// veteran left switched on, in his words and his order. Nothing is added,
// ranked or concluded here either.
export type SheetRow = { year: string; text: string; aside?: string };
export type SheetData = {
  who: string;
  updated: string;
  ownWords: string[];
  served: SheetRow[];
  changed: SheetRow[];
  chain: { word: string; detail: string }[];
  example: boolean;
};

// Invented for the sign-in page and marked as such everywhere it appears.
// Not a real veteran. Never shown to a signed-in veteran as his own page.
export const EXAMPLE_SHEET: SheetData = {
  who: "Example page. Not a real veteran.",
  updated: "20 Nov 2026",
  ownWords: [
    "Headaches most days since the 2010 breaching work. Worse this past year.",
    "I sleep two to three hours a night. It has been like that since 2012.",
    "Nobody has checked my pituitary or my testosterone since the blasts. I am asking.",
  ],
  served: [
    { year: "2003", text: "Fort Benning. Infantry." },
    { year: "2005", text: "Ramadi, Iraq. 12 months.", aside: "Burn pit 300 m from housing." },
    { year: "2008", text: "Fort Bragg. Special Forces." },
    { year: "2010", text: "Kandahar. Breacher.", aside: "Repeated close blasts." },
    { year: "2012", text: "Kandahar.", aside: "IED. Left leg lost below the knee." },
    { year: "2017", text: "Syria. 7 months." },
    { year: "2019", text: "Retired. 16 years." },
  ],
  changed: [
    { year: "2010", text: "Tinnitus, both ears. Constant." },
    { year: "2011", text: "TBI, diagnosed after breaching." },
    { year: "2012", text: "Left leg amputated below the knee." },
    { year: "2014", text: "Headaches, most days." },
    { year: "2016", text: "Low testosterone on one lab, no follow-up." },
    { year: "2017", text: "Sleep down to two or three hours." },
  ],
  chain: [
    { word: "Blast overpressure", detail: "Breaching, 2010 to 2012" },
    { word: "Brain injury", detail: "Diagnosed 2011" },
    { word: "Tinnitus", detail: "Since 2010" },
    { word: "Pituitary", detail: "Never checked" },
    { word: "Testosterone", detail: "Low, 2016, no follow-up" },
    { word: "Sleep", detail: "2 to 3 hours since 2017" },
    { word: "Headaches, mood", detail: "Most days" },
  ],
  example: true,
};

export function sheetDate(d: Date = new Date()): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const firstYear = (s: string) => (s.match(/\b(19|20)\d{2}\b/) ?? [""])[0];
const sentence = (s: string) => (s && !/[.!?]$/.test(s) ? s + "." : s);

export function sheetFromPage(p: PageData): SheetData {
  const on = (rows: PageRow[]) => rows.filter((r) => r.show);
  const around = on(p.exposures);
  const served: SheetRow[] = on(p.service).map((r) => {
    const aside = around.filter((e) => e.parentId === r.id).map((e) => sentence(e.cells[0])).join(" ");
    return { year: firstYear(r.cells[0]), text: sentence([r.cells[1], r.cells[2]].filter(Boolean).join(". ")), aside: aside || undefined };
  });
  const changed: SheetRow[] = on(p.problems)
    .map((r) => ({ year: r.cells[1] || "", text: sentence(r.cells[0]) }))
    .sort((a, b) => (a.year || "9999").localeCompare(b.year || "9999"));
  const named = p.name && p.name !== "Name not set" ? p.name : "";
  return {
    who: [named, p.line1].filter(Boolean).join(". ").replace(/\.\.+/g, "."),
    updated: sheetDate(),
    ownWords: p.readFirst.slice(0, 3),
    served,
    changed,
    chain: p.chain.slice(0, 9),
    example: false,
  };
}

export async function buildSheet(supabase: SupabaseClient): Promise<Res<SheetData>> {
  const r = await buildPage(supabase, null);
  return r.ok ? { ok: true, data: sheetFromPage(r.data) } : r;
}

// ── the lint: the format's rules, enforced before anything prints ───────────
const INFER = /\b(caused|causes|causing|likely|probably|due to|suggests|suggestive|consistent with|abnormal|elevated|high|low|worsening|improving|risk|secondary to)\b/i;
const INFER_OK = [/\blow back\b/i, /\bhigh school\b/i];
const hasYear = (s: string) => /\b(19|20)\d{2}\b/.test(s);

export type LintProblem = { where: string; what: string };

function inference(text: string): string | null {
  let t = text;
  for (const ok of INFER_OK) t = t.replace(ok, " ");
  const m = t.match(INFER);
  return m ? m[0] : null;
}

export function lintPage(p: PageData): LintProblem[] {
  const out: LintProblem[] = [];
  const row = (label: string, rows: PageRow[]) => {
    for (const r of rows) {
      if (!r.show) continue;
      const where = `${label}: ${r.cells[0].slice(0, 60)}`;
      if (r.kind !== "allergy" && r.sourceNumber == null) out.push({ where, what: "has no source. Pick one on the Rows or section page." });
      if (r.yearIn >= 0 && !hasYear(r.cells[r.yearIn] ?? "")) out.push({ where, what: "has no year." });
      if (r.yearIn === -1 && !hasYear(r.cells.join(" "))) out.push({ where, what: "has no year anywhere in it." });
      if (!r.ownWords) {
        const w = inference(r.cells.join(" "));
        if (w) out.push({ where, what: `contains "${w}". The page copies what records say; it never concludes. Reword it or quote the document.` });
      }
    }
  };
  if (p.readFirst.length !== 3) out.push({ where: "Read this first", what: `needs exactly three lines in the veteran's own words (has ${p.readFirst.length}). Set them on the Visit page.` });
  if (p.questions.length !== 2) out.push({ where: "My two questions", what: "needs exactly two questions. Set them on the Visit page." });
  if (!p.name || p.name === "Name not set") out.push({ where: "Header", what: "the veteran's name is not set on the profile." });
  if (!p.born) out.push({ where: "Header", what: "year of birth is not set. Set it on the First Page profile." });
  if (p.allergies.filter((a) => a.show).length === 0) out.push({ where: "Allergies", what: 'is empty. Add at least one line, even "No known drug allergies."' });
  if (!p.carePartner) out.push({ where: "Care partner", what: "is not set. If there is none, write who to call." });
  if (!p.returnNoteTo) out.push({ where: "Return your note to", what: "is not set. Add the VA community care fax or portal address on the profile." });
  if (!p.openToday) out.push({ where: "Open today", what: "is empty. Set it on the Visit page." });
  row("Problem", p.problems);
  row("Medication", p.medications);
  row("Study", p.studies);
  row("Tried", p.tried);
  row("Service", p.service);
  row("Exposure", p.exposures);
  row("Result", p.results);
  row("Shot", p.shots);
  for (const [k, v] of [["Open today", p.openToday], ["Stored specimens", p.specimens], ["No record found for", p.noRecordFoundFor], ["Service line", p.line1 + " " + p.line2]] as const) {
    const w = inference(v);
    if (w) out.push({ where: k, what: `contains "${w}". Reword it so it states a fact, not a conclusion.` });
  }
  return out;
}

export const FIRST_PAGE_STANCE =
  "This page organizes records. It does not interpret them, diagnose, advise, or claim anything. Every row names its source and date; the veteran chose every row and signs the page.";
