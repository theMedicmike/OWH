-- 0037 — The First Page (Service Health Summary v1), decided 2026-11-24.
--
-- Connecting the Dots is the HOME of a veteran's digital passport; the First
-- Page is the one fixed-format sheet the app prints before a specialist visit.
-- Everything a doctor reads in the first ninety seconds, every line with a
-- source and a date, nothing inferred. These tables hold what the existing
-- record does not: the source registry, allergies, studies, what was tried,
-- results that changed, visit prep, the recorded story, printed page versions,
-- the care partner and return address, and per-row print preferences.
--
-- RULES WRITTEN INTO THE SCHEMA (council verdict 2026-11-24):
--   1. No column anywhere here holds a rating, percentage, dollar figure,
--      claim selection, inference, risk score or diagnosis made by the app.
--      Values are copied as written; the page says what happened and where
--      that is written down, never what is wrong.
--   2. Every printable row points at a source (fp_sources.number) and carries
--      a tier word: record, recalled, witness, clinic. The print route refuses
--      a row without one (src/lib/firstPage.ts lint).
--   3. The veteran chooses every row. fp_row_meta.show overrides the default;
--      sexual-trauma incidents and mental-health conditions default to OFF and
--      stay off unless the veteran turns them on.
--   4. A printed page is a version (fp_pages). A correction is a new version,
--      never a hand edit.
--   5. No foreign key from any First Page table into the claim packet, the
--      presumptive lookup or the estimator. The page is for the clinic.
--
-- Additive, idempotent, RLS owner-only. The app reads these tables defensively
-- and tells the veteran the section is not switched on if the migration has
-- not been applied.

create table if not exists fp_sources (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references members(id) on delete cascade,
  number        int  not null,
  label         text not null,          -- "VA record, Blue Button download"
  source_date   text,                   -- as written: "2026-10-14", "sent 2026-10-12"
  author        text,                   -- who wrote it: "VA", "Walgreens", "Carol Pruitt, daughter"
  status        text not null default 'received'
                  check (status in ('received','pending','not_requested','not_found','closed')),
  document_path text,                   -- object path in the private `records` bucket, if uploaded
  note          text,
  created_at    timestamptz not null default now(),
  unique (member_id, number)
);
create index if not exists fp_sources_member_idx on fp_sources (member_id);

create table if not exists fp_allergies (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references members(id) on delete cascade,
  text        text not null,            -- "Penicillin: rash, 1970."
  tier        text not null default 'recalled' check (tier in ('record','recalled','witness','clinic')),
  source_id   uuid references fp_sources(id) on delete set null,
  show        boolean not null default true,
  sort        int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists fp_allergies_member_idx on fp_allergies (member_id);

create table if not exists fp_studies (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references members(id) on delete cascade,
  text        text not null,            -- "MRI brain without contrast, VA. Report in the folder."
  study_date  text not null,            -- as written on the report
  tier        text not null default 'record' check (tier in ('record','recalled','witness','clinic')),
  source_id   uuid references fp_sources(id) on delete set null,
  show        boolean not null default true,
  sort        int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists fp_studies_member_idx on fp_studies (member_id);

create table if not exists fp_tried (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references members(id) on delete cascade,
  text        text not null,            -- "Amitriptyline 2014, stopped for dry mouth." (year inside the text)
  tier        text not null default 'record' check (tier in ('record','recalled','witness','clinic')),
  source_id   uuid references fp_sources(id) on delete set null,
  show        boolean not null default true,
  sort        int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists fp_tried_member_idx on fp_tried (member_id);

-- Two values, two dates, two sources. Copied as written. No arrow, no "high".
create table if not exists fp_results (
  id                uuid primary key default gen_random_uuid(),
  member_id         uuid not null references members(id) on delete cascade,
  measure           text not null,      -- "Hemoglobin A1c"
  earlier_value     text not null,      -- "7.1 %"
  earlier_date      text not null,      -- "2023-02-14"
  earlier_source_id uuid references fp_sources(id) on delete set null,
  later_value       text not null,
  later_date        text not null,
  later_source_id   uuid references fp_sources(id) on delete set null,
  tier              text not null default 'record' check (tier in ('record','recalled','witness','clinic')),
  show              boolean not null default true,
  sort              int not null default 0,
  created_at        timestamptz not null default now()
);
create index if not exists fp_results_member_idx on fp_results (member_id);

-- One row per upcoming or past visit: what is open today, the two questions,
-- since last visit, and the three "Read this first" lines the veteran picked
-- from his own words.
create table if not exists fp_visits (
  id               uuid primary key default gen_random_uuid(),
  member_id        uuid not null references members(id) on delete cascade,
  specialist       text,               -- "Dr. [name], neurology" or "ER"
  visit_date       date,
  open_today       text,
  question1        text,
  question2        text,
  since_last_visit text,
  read_first       text[] not null default '{}',   -- exactly three lines when printed
  status           text not null default 'planned' check (status in ('planned','done')),
  created_at       timestamptz not null default now()
);
create index if not exists fp_visits_member_idx on fp_visits (member_id);

-- The ten-minute story, recorded on the veteran's own device with spoken
-- consent, stored in his private folder in the `records` bucket. The
-- transcript is what the browser's own speech recognition heard; it is his to
-- correct, and lines he picks from it become "Read this first". No model ever
-- writes or rewrites it.
create table if not exists fp_recordings (
  id             uuid primary key default gen_random_uuid(),
  member_id      uuid not null references members(id) on delete cascade,
  storage_path   text,                 -- null when only a transcript was kept
  duration_sec   int,
  recorded_on    date not null default current_date,
  transcript     text,
  consent_spoken boolean not null default false,
  created_at     timestamptz not null default now()
);
create index if not exists fp_recordings_member_idx on fp_recordings (member_id);

-- Every print is a version. The snapshot is exactly what was printed, so a
-- clinician's copy can always be matched to the data behind it.
create table if not exists fp_pages (
  id             uuid primary key default gen_random_uuid(),
  member_id      uuid not null references members(id) on delete cascade,
  visit_id       uuid references fp_visits(id) on delete set null,
  version_date   date not null default current_date,
  assembled_by   text,
  signed         boolean not null default false,
  corrections_to text,
  snapshot       jsonb not null,
  created_at     timestamptz not null default now()
);
create index if not exists fp_pages_member_idx on fp_pages (member_id);

-- One row per member: the header and side-2 facts that are not rows.
create table if not exists fp_profile (
  member_id            uuid primary key references members(id) on delete cascade,
  born_year            int,
  service_line1        text,            -- "Born 1981. U.S. Army, 2000 to 2020, infantry (11B). Retired sergeant first class."
  service_line2        text,            -- "Iraq 2004 to 2005. Afghanistan 2010 to 2011. Blast injury 2010."
  care_partner_name    text,
  care_partner_relation text,
  care_partner_line    text,            -- "Ask her if I pause. She keeps the folder and the dates."
  care_partner_phone   text,
  help_me              text,            -- "How to help me in the room"
  return_note_to       text,            -- the VA community care office, fax, portal
  vhie_status          text not null default 'unknown' check (vhie_status in ('on','off','unknown')),
  vhie_checked_on      date,
  tes_date             date,            -- VA toxic exposure screening answered on
  tes_answer           text,            -- yes / no / don't know / declined, as answered
  tes_exposures        text,            -- which, as answered
  tes_followup         text,            -- what follow-up was asked for
  tes_source_id        uuid references fp_sources(id) on delete set null,
  specimens            text,            -- stored blood specimens line
  no_record_found_for  text,
  corrections_to       text,            -- the helper named for corrections
  assembled_by         text,            -- default helper name for new pages
  tried_title          text,            -- "What has been tried for the headaches"
  location_withheld    boolean not null default false,
  updated_at           timestamptz not null default now()
);

-- Per-row print preferences for rows that live in the existing record. The
-- core tables are not altered; this side table carries show/source/tier and the
-- few fields the page needs that those tables lack (verbatim medication
-- directions, the unit per posting, a plain status for a problem).
create table if not exists fp_row_meta (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references members(id) on delete cascade,
  table_key   text not null check (table_key in ('conditions','medications','check_ins','exposures','shots','incidents')),
  row_id      uuid not null,
  show        boolean,                  -- null = the default for that kind of row
  source_id   uuid references fp_sources(id) on delete set null,
  tier        text check (tier in ('record','recalled','witness','clinic')),
  status      text,                     -- problems: "Active, falls in July 2026" / "Treated" / "Chronic"
  directions  text,                     -- medications: copied word for word from the pharmacy printout
  since_year  int,                      -- medications: year started, as printed
  unit        text,                     -- check_ins: the unit for this posting
  note        text,
  updated_at  timestamptz not null default now(),
  unique (member_id, table_key, row_id)
);
create index if not exists fp_row_meta_member_idx on fp_row_meta (member_id);

-- RLS: owner only, every table.
do $$
declare t text;
begin
  foreach t in array array['fp_sources','fp_allergies','fp_studies','fp_tried','fp_results','fp_visits','fp_recordings','fp_pages','fp_profile','fp_row_meta']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t || '_owner', t);
    execute format(
      'create policy %I on %I for all using (member_id in (select id from members where auth_id = auth.uid())) with check (member_id in (select id from members where auth_id = auth.uid()))',
      t || '_owner', t);
    execute format('grant select, insert, update, delete on %I to authenticated', t);
  end loop;
end $$;

comment on table fp_sources is 'The First Page source registry: one numbered entry per document behind a printed row, with date, author and request status. Every printed row cites one of these.';
comment on table fp_row_meta is 'Per-row print preferences for rows that live in the existing record (show on page, source, tier, verbatim medication directions, unit per posting). The core tables are not altered; nothing here is an inference.';
comment on table fp_pages is 'Printed First Page versions. The snapshot is exactly what was printed. A correction is a new version.';
comment on table fp_recordings is 'The veteran''s own recorded story and what the browser heard. No model writes or rewrites it.';
