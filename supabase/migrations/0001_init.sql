-- Connecting the Dots of Service — Phase 1 initial schema
-- Target: Supabase (PostgreSQL 15+ with PostGIS). The auth.users table is provided by Supabase Auth.
-- This migration creates the core data model and the Row-Level Security (RLS) privacy firewall.
-- Designed to hold the full vision (layered cohorts, evidence tiers, the multi-class exposure
-- engine, corroboration, documented need) so later phases do not require a rebuild.

create extension if not exists postgis with schema extensions;
set search_path = public, extensions;

-- ----------------------------------------------------------------------------
-- enums
-- ----------------------------------------------------------------------------
create type population_layer as enum
  ('veteran','first_responder','contractor','foreign_military','civilian','family');

create type verification_status as enum
  ('self_attested','document_verified','id_verified');

create type evidence_tier as enum
  ('self_reported','clinically_diagnosed','government_adjudicated','environmentally_corroborated');

create type exposure_class as enum
  ('burn_pit','heavy_metal','chemical_solvent','water_contamination','pesticide',
   'industrial_chemical','asbestos_silica','nerve_agent','particulate','pfas_afff',
   'radiation','gulf_war_agent','other');

create type site_status as enum ('recognized','documented','emerging');
create type claim_status as enum ('none','filed','granted','denied');
create type need_status as enum ('locked','eligible','offered','under_review','approved','funded');
create type record_source as enum ('member','ai_suggested','imported');
create type witness_type as enum ('same_unit','same_location');

-- ----------------------------------------------------------------------------
-- members (the profile). One row per person; linked to a Supabase auth user.
-- ----------------------------------------------------------------------------
create table members (
  id                  uuid primary key default gen_random_uuid(),
  auth_id             uuid unique references auth.users(id) on delete cascade,
  display_name        text,
  population_layer    population_layer not null default 'veteran',
  branch              text,
  service_start       date,
  service_end         date,
  country             text not null default 'US',
  units               text[] not null default '{}',
  verification_status verification_status not null default 'self_attested',
  trust_level         int not null default 1,
  -- consent is the data covenant in practice: what the member allows.
  consent             jsonb not null default
                        '{"sharing":"private","name_in_collective_record":false,"research":false}',
  created_at          timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- check_ins (the pins on the map)
-- ----------------------------------------------------------------------------
create table check_ins (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references members(id) on delete cascade,
  geom        extensions.geography(Point,4326),
  place_name  text,
  conflict    text,
  date_start  date,
  date_end    date,
  notes       text,
  role        text,                                   -- for the weapons/exposure module
  source      record_source not null default 'member',
  confirmed   boolean not null default true,          -- AI-suggested facts start false
  created_at  timestamptz not null default now()
);
create index check_ins_geom_idx on check_ins using gist (geom);
create index check_ins_member_idx on check_ins (member_id);

-- ----------------------------------------------------------------------------
-- exposures (attached to a check-in). Full multi-class taxonomy from day one.
-- ----------------------------------------------------------------------------
create table exposures (
  id            uuid primary key default gen_random_uuid(),
  check_in_id   uuid not null references check_ins(id) on delete cascade,
  member_id     uuid not null references members(id) on delete cascade,
  exposure_class exposure_class not null,
  detail        text,
  evidence_tier evidence_tier not null default 'self_reported',
  source        record_source not null default 'member',
  confirmed     boolean not null default true,
  created_at    timestamptz not null default now()
);
create index exposures_member_idx on exposures (member_id);

-- ----------------------------------------------------------------------------
-- conditions (health conditions a member ties to exposure)
-- ----------------------------------------------------------------------------
create table conditions (
  id                  uuid primary key default gen_random_uuid(),
  member_id           uuid not null references members(id) on delete cascade,
  icd_code            text,
  label               text not null,
  linked_exposure_id  uuid references exposures(id) on delete set null,
  evidence_tier       evidence_tier not null default 'self_reported',
  claim_status        claim_status not null default 'none',
  is_presumptive_match boolean not null default false,
  created_at          timestamptz not null default now()
);
create index conditions_member_idx on conditions (member_id);

-- ----------------------------------------------------------------------------
-- known_exposure_sites (the reference layer: burn pits, Camp Lejeune, DU, etc.)
-- Public-read reference data, not member-owned.
-- ----------------------------------------------------------------------------
create table known_exposure_sites (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  geom             extensions.geography(Point,4326),
  date_from        date,
  date_to          date,
  exposure_classes exposure_class[] not null default '{}',
  status           site_status not null default 'documented',
  source           text,
  created_at       timestamptz not null default now()
);
create index known_sites_geom_idx on known_exposure_sites using gist (geom);

-- ----------------------------------------------------------------------------
-- corroborations (battle-buddy confirmation; powers the collective record)
-- ----------------------------------------------------------------------------
create table corroborations (
  id                   uuid primary key default gen_random_uuid(),
  exposure_id          uuid not null references exposures(id) on delete cascade,
  confirming_member_id uuid not null references members(id) on delete cascade,
  witness_type         witness_type not null default 'same_location',
  consent_to_name      boolean not null default false,
  created_at           timestamptz not null default now(),
  unique (exposure_id, confirming_member_id)
);

-- ----------------------------------------------------------------------------
-- weapons_ordnance (reference DB feeding the burden estimator)
-- ----------------------------------------------------------------------------
create table weapons_ordnance (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  category           text,
  caliber            text,
  toxicant_signature jsonb not null default '{}',   -- weights per metal/toxicant
  created_at         timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- estimator_config (science-board-reviewed weights as DATA, versioned)
-- ----------------------------------------------------------------------------
create table estimator_config (
  id             uuid primary key default gen_random_uuid(),
  version        int not null,
  exposure_class exposure_class not null,
  weights        jsonb not null,
  reviewed_by    text,
  active         boolean not null default false,
  created_at     timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- exposure_estimates (versioned model output, recomputed as the model calibrates)
-- ----------------------------------------------------------------------------
create table exposure_estimates (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references members(id) on delete cascade,
  model_version int,
  inputs        jsonb not null default '{}',
  outputs       jsonb not null default '{}',
  confidence    text,
  created_at    timestamptz not null default now()
);
create index estimates_member_idx on exposure_estimates (member_id);

-- ----------------------------------------------------------------------------
-- lab_results (uploaded panels/biomarkers; anchors estimates and calibrates the model)
-- ----------------------------------------------------------------------------
create table lab_results (
  id           uuid primary key default gen_random_uuid(),
  member_id    uuid not null references members(id) on delete cascade,
  panel_type   text,
  results      jsonb not null default '{}',
  file_path    text,
  collected_on date,
  created_at   timestamptz not null default now()
);
create index labs_member_idx on lab_results (member_id);

-- ----------------------------------------------------------------------------
-- documented_needs (the donor engine object; recorded now, donor-facing in Phase 3)
-- ----------------------------------------------------------------------------
create table documented_needs (
  id                 uuid primary key default gen_random_uuid(),
  member_id          uuid not null references members(id) on delete cascade,
  need_label         text not null,
  estimated_cost     numeric,
  eligibility_status need_status not null default 'locked',
  committee_notes    text,
  created_at         timestamptz not null default now()
);

-- ============================================================================
-- ROW-LEVEL SECURITY  (the data firewall, in code)
-- A member can read and write only their own records by default.
-- The admin/service role bypasses RLS for seeding and governed aggregate jobs.
-- ============================================================================

alter table members            enable row level security;
alter table check_ins          enable row level security;
alter table exposures          enable row level security;
alter table conditions         enable row level security;
alter table corroborations     enable row level security;
alter table exposure_estimates enable row level security;
alter table lab_results        enable row level security;
alter table documented_needs   enable row level security;
alter table known_exposure_sites enable row level security;
alter table weapons_ordnance   enable row level security;
alter table estimator_config   enable row level security;

-- members: a user sees and edits only their own member row(s)
create policy members_self on members for all
  using (auth_id = auth.uid())
  with check (auth_id = auth.uid());

-- owner-only policy applied to each member-owned child table
create policy checkins_owner on check_ins for all
  using (member_id in (select id from members where auth_id = auth.uid()))
  with check (member_id in (select id from members where auth_id = auth.uid()));

create policy exposures_owner on exposures for all
  using (member_id in (select id from members where auth_id = auth.uid()))
  with check (member_id in (select id from members where auth_id = auth.uid()));

create policy conditions_owner on conditions for all
  using (member_id in (select id from members where auth_id = auth.uid()))
  with check (member_id in (select id from members where auth_id = auth.uid()));

create policy estimates_owner on exposure_estimates for all
  using (member_id in (select id from members where auth_id = auth.uid()))
  with check (member_id in (select id from members where auth_id = auth.uid()));

create policy labs_owner on lab_results for all
  using (member_id in (select id from members where auth_id = auth.uid()))
  with check (member_id in (select id from members where auth_id = auth.uid()));

create policy needs_owner on documented_needs for all
  using (member_id in (select id from members where auth_id = auth.uid()))
  with check (member_id in (select id from members where auth_id = auth.uid()));

-- corroborations: the confirming member, or the owner of the confirmed exposure, may read.
-- Only the confirming member may create their own confirmation.
create policy corro_read on corroborations for select
  using (
    confirming_member_id in (select id from members where auth_id = auth.uid())
    or exposure_id in (
      select e.id from exposures e
      join members m on e.member_id = m.id
      where m.auth_id = auth.uid()
    )
  );
create policy corro_insert on corroborations for insert
  with check (confirming_member_id in (select id from members where auth_id = auth.uid()));

-- reference tables: any signed-in user may read; writes happen via the admin role only.
create policy sites_read   on known_exposure_sites for select using (auth.uid() is not null);
create policy weapons_read on weapons_ordnance      for select using (auth.uid() is not null);
create policy config_read  on estimator_config      for select using (auth.uid() is not null and active);
