-- Shots and vaccines — the event lane. Council ruling 2026-08-07: NOT a "shots"
-- table. Three of the highest-recall entries this feature will hold aren't
-- vaccines at all — pyridostigmine bromide and mefloquine are medications, the
-- long-acting penicillin shot is an antibiotic. A shots table is wrong on day
-- one and forces a migration against live veteran rows by week two. This is
-- the one irreversible decision in the whole feature, so it's made once, here.
--
-- Four things that are the actual design, not incidental:
--   1. provenance is NOT NULL with no default. You cannot go back to a man in
--      six months and ask which of fourteen entries he had paper for — an
--      ungraded row must be UNREPRESENTABLE, not merely discouraged.
--   2. No foreign key, no join column, no shared enum with exposures or
--      conditions. ref_slug is a loose string on purpose. If the schema can't
--      join a shot to an exposure, no future query, packet template, or
--      well-meaning pull request can assemble a causal path.
--   3. date_precision follows the 0017 precedent — never invent a date.
--   4. Nothing about his children. Not a column, not a boolean, not a prompt.
--
-- This table is never read by the connect-the-dots engine. A shot is never an
-- exposure and never appears in a condition match — enforced separately by
-- scripts/coi-firewall.cjs's query-isolation rule (the string "service_events"
-- may appear in exactly two files in this repo).
--
-- Safe to re-run.

create table if not exists service_events (
  id             uuid primary key default gen_random_uuid(),
  member_id      uuid not null references members(id) on delete cascade,
  kind           text not null check (kind in
                   ('vaccination','medication','blast','head_injury','injury','other')),
  ref_slug       text,            -- library key, PLAIN TEXT, no FK. NULL for free text.
  label          text not null,   -- his words verbatim when ref_slug is null
  event_year     int,
  event_month    int check (event_month between 1 and 12),
  date_precision text not null check (date_precision in ('year','month','unsure')),
  provenance     text not null check (provenance in ('recalled','in_record','document_held')),
  note           text,
  created_at     timestamptz not null default now()
);
create index if not exists service_events_member_idx on service_events (member_id, event_year);

alter table service_events enable row level security;

drop policy if exists service_events_owner on service_events;
create policy service_events_owner on service_events for all
  using (member_id in (select id from members where auth_id = auth.uid()))
  with check (member_id in (select id from members where auth_id = auth.uid()));

comment on table service_events is
  'Shots, vaccines, medications (mefloquine, pyridostigmine bromide) and similar dated events the veteran logs himself. Never read by the connect-the-dots/exposure-matching engine — a shot is never an exposure. See coi-firewall.cjs for the enforced query-isolation rule.';
comment on column service_events.provenance is
  'How he knows: recalled | in_record | document_held. NOT NULL, no default — an ungraded row is unrepresentable by design, not just discouraged.';
comment on column service_events.ref_slug is
  'Loose text key into lib/shotlibrary.ts. Deliberately NOT a foreign key — nothing in this schema can join a shot to an exposure or a condition.';
