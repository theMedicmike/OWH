-- 0027 — two more post-test-shortlist items from the council gap audit
-- (2026-08-10) plus the deferred witness/buddy contact idea from the
-- injuries council (2026-08-11):
--
--   1. condition_notes — a dated "how this has affected you" journal per
--      condition. Same shape as incident_notes on purpose: human-typed,
--      timestamped, never AI-touched. Evidentiary basis is broader than
--      incident_notes' — continuity of symptomatology (38 CFR 3.303(b))
--      AND functional impact on ordinary activities (38 CFR 4.10), which is
--      exactly what a C&P examiner is trained to ask about.
--   2. incident_witnesses — captures who else was there, privately, at the
--      moment a veteran logs an injury/event, so a name isn't lost to
--      memory. Pure capture: nothing here is sent to anyone automatically.
--      The injuries council flagged this as MST-adjacent risk and asked for
--      a narrower answer before shipping — the app enforces that in the UI
--      layer (lib/incidentCopy.ts's isMarkersBased()), never prompting for
--      "who else was there" on an MST/assault-classified incident. This
--      table has no incident_class column and no knowledge of the gate; it
--      just stores whatever rows the app decides to write.
--
-- Both additive, idempotent, RLS owner-only. Read defensively everywhere.

create table if not exists condition_notes (
  id            uuid primary key default gen_random_uuid(),
  condition_id  uuid not null references conditions(id) on delete cascade,
  member_id     uuid not null references members(id) on delete cascade,
  noticed_year  int,
  noticed_month int check (noticed_month between 1 and 12),
  note          text not null,
  created_at    timestamptz not null default now()
);
create index if not exists condition_notes_condition_idx on condition_notes (condition_id);
create index if not exists condition_notes_member_idx on condition_notes (member_id);

alter table condition_notes enable row level security;

create policy condition_notes_owner on condition_notes for all
  using (member_id in (select id from members where auth_id = auth.uid()))
  with check (member_id in (select id from members where auth_id = auth.uid()));

grant select, insert, update, delete on condition_notes to authenticated;

comment on table condition_notes is
  'The dated "how this has affected you" journal — 38 CFR 3.303(b) continuity-of-symptomatology + 4.10 functional-impact evidence, per condition. Never AI-touched.';

create table if not exists incident_witnesses (
  id            uuid primary key default gen_random_uuid(),
  incident_id   uuid not null references incidents(id) on delete cascade,
  member_id     uuid not null references members(id) on delete cascade,
  name          text not null,
  relationship  text,
  contact       text,
  created_at    timestamptz not null default now()
);
create index if not exists incident_witnesses_incident_idx on incident_witnesses (incident_id);
create index if not exists incident_witnesses_member_idx on incident_witnesses (member_id);

alter table incident_witnesses enable row level security;

create policy incident_witnesses_owner on incident_witnesses for all
  using (member_id in (select id from members where auth_id = auth.uid()))
  with check (member_id in (select id from members where auth_id = auth.uid()));

grant select, insert, update, delete on incident_witnesses to authenticated;

comment on table incident_witnesses is
  'Private capture of who else was there for an incident — name/relationship/contact the veteran wants to remember. Nothing here is sent anywhere automatically; the app links out to the existing statement-request flow (Battle buddies) for actually asking someone. UI gates this off for MST/assault incident classes — see lib/incidentCopy.ts isMarkersBased().';
