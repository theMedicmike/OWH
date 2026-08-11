-- 0022 — two fixes from the devil's-advocate council audit (2026-08-10),
-- viewed from the VA rater's, C&P doctor's, and VSO's side of the packet:
--
-- 1. DIAGNOSIS PROVENANCE. Element 1 of every VA claim is a CURRENT DIAGNOSIS.
--    The app let a veteran tap "PTSD" onto their record with no way to say
--    whether a doctor had ever actually diagnosed it — so a self-picked label
--    could print in the claim packet looking identical to a documented
--    diagnosis. This is the single fix every stakeholder (rater, doctor, VSO)
--    independently named as the packet's biggest gap.
--
-- 2. INJURY/EVENT AS A FIRST-CLASS DOT. lib/conditions.ts has carried a
--    `link: 'event'` concept since early on (tinnitus, PTSD, TBI, backs, knees
--    — the majority of real VA claims) but the map only ever captured WHERE a
--    veteran served and WHAT they were exposed to, never WHAT HAPPENED to
--    them. Every event-linked condition hit the same generic dead-end
--    sentence regardless of what the veteran could actually describe. This
--    adds `incidents` as a sibling to `exposures`, attached to the same
--    check-in pins, so the map can finally record a blast, a fall, an
--    assault — not just bad air and bad water.
--
-- Both additive, nullable/optional, idempotent. The app reads everything here
-- defensively, so it keeps working whether or not this has run yet.

-- ── 1. Diagnosis provenance ─────────────────────────────────────────────────
alter table conditions add column if not exists diagnosed_by text;

comment on column conditions.diagnosed_by is
  'Who diagnosed this condition, veteran-reported: va | civilian | military | not_yet. Null = not yet asked. Powers the "needs diagnosis" flag in the claim packet (VA service-connection element 1: current diagnosis).';

-- ── 2. Injury/event capture ─────────────────────────────────────────────────
create type incident_class as enum (
  'blast_ied', 'vehicle_accident', 'fall', 'noise_acoustic', 'training_injury',
  'physical_assault', 'military_sexual_trauma', 'fire_burn', 'other'
);

create table if not exists incidents (
  id             uuid primary key default gen_random_uuid(),
  check_in_id    uuid not null references check_ins(id) on delete cascade,
  member_id      uuid not null references members(id) on delete cascade,
  incident_class incident_class not null,
  detail         text,
  created_at     timestamptz not null default now()
);
create index if not exists incidents_member_idx on incidents (member_id);
create index if not exists incidents_checkin_idx on incidents (check_in_id);

alter table incidents enable row level security;

create policy incidents_owner on incidents for all
  using (member_id in (select id from members where auth_id = auth.uid()))
  with check (member_id in (select id from members where auth_id = auth.uid()));

grant select, insert, update, delete on incidents to authenticated;

comment on table incidents is
  'Injury/event dots — a blast, a fall, an assault — parallel to exposures but for the majority of VA claims that connect to WHAT HAPPENED rather than WHERE THE AIR WAS BAD.';

-- Extend log_check_in to record incidents in the same round trip as
-- exposures. p_incidents defaults to '{}' so any caller still on the old
-- 5-argument signature keeps working unmodified until the app deploy lands.
drop function if exists log_check_in(double precision, double precision, int, text, exposure_class[]);

create or replace function log_check_in(
  p_lng double precision,
  p_lat double precision,
  p_year int,
  p_conflict text,
  p_exposures exposure_class[],
  p_incidents incident_class[] default '{}'
) returns uuid
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
  v_member uuid;
  v_checkin uuid;
  v_exp exposure_class;
  v_inc incident_class;
begin
  select id into v_member from members where auth_id = auth.uid();
  if v_member is null then
    insert into members (auth_id) values (auth.uid()) returning id into v_member;
  end if;

  insert into check_ins (member_id, geom, conflict, date_start)
  values (v_member, ST_MakePoint(p_lng, p_lat)::geography, p_conflict, make_date(p_year, 1, 1))
  returning id into v_checkin;

  foreach v_exp in array p_exposures loop
    insert into exposures (check_in_id, member_id, exposure_class)
    values (v_checkin, v_member, v_exp);
  end loop;

  foreach v_inc in array p_incidents loop
    insert into incidents (check_in_id, member_id, incident_class)
    values (v_checkin, v_member, v_inc);
  end loop;

  return v_checkin;
end;
$$;

grant execute on function log_check_in to authenticated;
