-- 0023 — three more items off the council's pre-test punch list (2026-08-11):
--
-- 1. APPROXIMATE DATES. "I don't remember exactly" is a different, honest
--    answer from "I know the year but not the month" — the app had no way to
--    say the first, only the second. check_ins never had a precision column
--    at all (three separate code comments already flagged this); members'
--    service dates had one but its CHECK constraint didn't allow it either.
--
-- 2. WITNESS STATEMENT DETAIL. The no-login witness link (migration 0018)
--    collected a name, a relationship, and a statement — no overlap dates, no
--    firsthand-only prompt, no attestation, and no way to distinguish a
--    same-unit witness (saw the event) from a family/after-service witness
--    (saw the change). Adds all four, validated server-side, not just in the
--    form.
--
-- 3. PAGE ZERO. A brand-new veteran could land on /intake with zero context —
--    what a claim is, that this is free, roughly how long it takes. Adds a
--    single flag so a one-time /welcome screen can gate the wizard for
--    first-time veterans only, never existing ones.
--
-- All additive, nullable/optional, idempotent. The app reads everything here
-- defensively, so it keeps working whether or not this has run yet.

-- ── 1. Approximate dates ────────────────────────────────────────────────────
alter table check_ins add column if not exists date_start_precision text
  check (date_start_precision in ('year', 'month', 'day', 'approximate'));
alter table check_ins add column if not exists date_end_precision text
  check (date_end_precision in ('year', 'month', 'day', 'approximate'));

comment on column check_ins.date_start_precision is
  'How precise date_start actually is: year | month | day | approximate. NULL means year (the historical default). "approximate" means the veteran is not even confident of the year — renders as "circa YYYY", never a bare year.';
comment on column check_ins.date_end_precision is
  'How precise date_end actually is: year | month | day | approximate. NULL means year.';

-- Widen members' existing precision constraints (migration 0017) to also
-- allow 'approximate' — found and dropped by column rather than by a guessed
-- constraint name, since Postgres auto-names inline CHECK constraints and a
-- wrong guess would leave the OLD, narrower constraint silently blocking
-- every future write of 'approximate'.
do $$
declare
  r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_attribute att on att.attrelid = rel.oid and att.attnum = any(con.conkey)
    where rel.relname = 'members' and att.attname = 'service_start_precision' and con.contype = 'c'
  loop
    execute format('alter table members drop constraint %I', r.conname);
  end loop;
end $$;
alter table members add constraint members_service_start_precision_check
  check (service_start_precision in ('year', 'month', 'day', 'approximate'));

do $$
declare
  r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_attribute att on att.attrelid = rel.oid and att.attnum = any(con.conkey)
    where rel.relname = 'members' and att.attname = 'service_end_precision' and con.contype = 'c'
  loop
    execute format('alter table members drop constraint %I', r.conname);
  end loop;
end $$;
alter table members add constraint members_service_end_precision_check
  check (service_end_precision in ('year', 'month', 'day', 'approximate'));

-- ── 2. Witness statement detail ─────────────────────────────────────────────
alter table witness_statements add column if not exists witness_type text
  check (witness_type in ('same_unit', 'family_or_after'));
alter table witness_statements add column if not exists relationship_detail text;
alter table witness_statements add column if not exists knew_from int;
alter table witness_statements add column if not exists knew_to int;
alter table witness_statements add column if not exists firsthand_confirmed boolean not null default false;
alter table witness_statements add column if not exists attested boolean not null default false;

comment on column witness_statements.witness_type is
  'same_unit (served alongside — witnessed the event) | family_or_after (family/friend — witnessed the change). Drives which prompt the witness saw.';
comment on column witness_statements.knew_from is 'Year the witness says their overlap with the veteran began, if given.';
comment on column witness_statements.knew_to is 'Year the witness says their overlap with the veteran ended (or ongoing if null but knew_from is set).';
comment on column witness_statements.firsthand_confirmed is
  'Witness affirmatively confirmed they are describing only what they personally saw, heard, or were told at the time — not assumption or hearsay. Enforced server-side in submit_witness_statement, not just client-side.';
comment on column witness_statements.attested is
  'Witness affirmatively confirmed the statement is true to the best of their knowledge. Enforced server-side, not just client-side.';

drop function if exists submit_witness_statement(text, text, text, text, text);

create or replace function submit_witness_statement(
  p_token text, p_witness_name text, p_relationship text, p_statement text, p_contact text,
  p_witness_type text default null, p_relationship_detail text default null,
  p_knew_from int default null, p_knew_to int default null,
  p_firsthand_confirmed boolean default false, p_attested boolean default false
)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_req statement_requests%rowtype;
  v_effective text;
begin
  select * into v_req from statement_requests where token = p_token;
  if v_req.id is null then return 'invalid'; end if;

  v_effective := case when v_req.status = 'pending' and v_req.expires_at < now() then 'expired' else v_req.status end;
  if v_effective <> 'pending' then return v_effective; end if;

  if trim(coalesce(p_witness_name, '')) = '' or trim(coalesce(p_statement, '')) = '' then
    return 'invalid';
  end if;
  -- The two honesty checks are enforced HERE, not just in the form — a
  -- statement that skipped them must never be indistinguishable from one
  -- that didn't, in a document a VA rater reads.
  if not coalesce(p_firsthand_confirmed, false) or not coalesce(p_attested, false) then
    return 'invalid';
  end if;

  insert into witness_statements (
    request_id, member_id, witness_name, relationship, contact, statement,
    witness_type, relationship_detail, knew_from, knew_to, firsthand_confirmed, attested
  )
  values (
    v_req.id, v_req.member_id, trim(p_witness_name), coalesce(nullif(trim(p_relationship), ''), 'Not specified'),
    nullif(trim(coalesce(p_contact, '')), ''), trim(p_statement),
    nullif(p_witness_type, ''), nullif(trim(coalesce(p_relationship_detail, '')), ''),
    p_knew_from, p_knew_to, coalesce(p_firsthand_confirmed, false), coalesce(p_attested, false)
  );

  update statement_requests set status = 'submitted', submitted_at = now() where id = v_req.id;

  return 'ok';
end;
$$;

grant execute on function submit_witness_statement to anon, authenticated;

-- ── 3. Page zero ─────────────────────────────────────────────────────────────
alter table members add column if not exists intro_seen_at timestamptz;

comment on column members.intro_seen_at is
  'When the veteran confirmed the /welcome intro screen (or was backfilled as an existing user who never needed it). NULL + no service data yet is the only state that shows /welcome before /intake.';
