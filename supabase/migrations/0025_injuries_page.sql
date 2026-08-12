-- 0025 — the "Injuries & events" page: council-audited additions to the
-- incidents table (2026-08-11 council on the injury/trauma page).
--
-- Two things the council converged on that Claude's standing recommendation
-- didn't have:
--   1. PROVENANCE, 4 tiers, grounded in 38 U.S.C. §1154(b) — for a combat
--      veteran, "I remember it" is not weak evidence, it can be legally
--      SUFFICIENT on its own. The tiers name real artifacts (Purple Heart
--      citation, DD-214/DD-215 annotation, VA Form 21-10210 buddy statement,
--      medical record) rather than a bare free-text "detail" field.
--   2. REPEATED/CUMULATIVE entries — breachers, EOD techs, artillery crews
--      whose TBI came from hundreds of sub-threshold blasts, not one dramatic
--      day, had nothing to click. role_or_unit + a date range + a rough
--      frequency, instead of forcing a single pin.
--   3. incident_notes — a dated, repeatable "what you've noticed since" log
--      per incident (38 CFR 3.303(b) continuity-of-symptomatology). Same
--      shape as witness_statements: human-typed, timestamped, never AI-touched.
--
-- All additive, nullable/optional, idempotent. The app reads everything here
-- defensively, so it keeps working whether or not this has run yet.

alter table incidents add column if not exists provenance text
  check (provenance in ('recalled', 'confirmable', 'in_record', 'document_held'));
alter table incidents add column if not exists repeated boolean not null default false;
alter table incidents add column if not exists role_or_unit text;
alter table incidents add column if not exists frequency text;

comment on column incidents.provenance is
  'How this is documented, veteran-reported: recalled (I remember it — §1154(b) can make this sufficient alone for combat vets) | confirmable (someone else witnessed it — VA Form 21-10210) | in_record (it''s in my service/medical record) | document_held (I have the document). Null = not yet answered.';
comment on column incidents.repeated is
  'TRUE for a cumulative/repeated-exposure entry (e.g. a breacher''s hundreds of sub-threshold blasts) rather than a single dated event. When true, role_or_unit and frequency describe the pattern; the linked check-in''s date_start/date_end hold the date RANGE.';
comment on column incidents.role_or_unit is
  'For a repeated entry: the role or unit that explains the exposure pattern (e.g. "breacher, 2nd squad"). Free text, veteran-reported.';
comment on column incidents.frequency is
  'For a repeated entry: how often, in the veteran''s own words (e.g. "near-daily", "a handful of times a month"). Free text, never a computed count.';

-- The dated "what you've noticed since" log — the single highest-value
-- addition the council found. Mirrors witness_statements' shape on purpose:
-- human-typed, timestamped, repeatable. "Logged on" (created_at) is kept
-- deliberately separate from "noticed" (noticed_year/month) so the record can
-- honestly show both — an undisclosed edit to either would undermine the
-- exact credibility signal this table exists to provide.
create table if not exists incident_notes (
  id            uuid primary key default gen_random_uuid(),
  incident_id   uuid not null references incidents(id) on delete cascade,
  member_id     uuid not null references members(id) on delete cascade,
  noticed_year  int,
  noticed_month int check (noticed_month between 1 and 12),
  note          text not null,
  created_at    timestamptz not null default now()
);
create index if not exists incident_notes_incident_idx on incident_notes (incident_id);
create index if not exists incident_notes_member_idx on incident_notes (member_id);

alter table incident_notes enable row level security;

create policy incident_notes_owner on incident_notes for all
  using (member_id in (select id from members where auth_id = auth.uid()))
  with check (member_id in (select id from members where auth_id = auth.uid()));

grant select, insert, update, delete on incident_notes to authenticated;

comment on table incident_notes is
  'The "what you''ve noticed since" log — dated, repeatable, human-typed entries per incident. 38 CFR 3.303(b) continuity-of-symptomatology evidence. Never AI-touched.';
