-- Witness statements: a shareable, no-login link a veteran sends to someone who
-- was NOT there to log their own record — a spouse, a battle buddy who never
-- joined this app, a commander, a friend. The recipient needs no account. They
-- open the link, see only the narrow context the veteran chose to share, and
-- write what they themselves remember or witnessed.
--
-- This is deliberately NOT the "Battle buddies" feature in 0005/0007 — those
-- match two members of THIS app who logged overlapping service. This closes the
-- much more common gap: the corroborating witness usually isn't a veteran on
-- this app at all, and may not be a veteran at all.
--
-- Security model: the token is the capability. Nobody needs to be signed in to
-- read a request or submit a statement — anon gets EXECUTE on the two token
-- functions and nothing else; RLS on both tables has no policy for anon at all,
-- which is a default-deny, so a direct table read/write from the anon role is
-- impossible even though the functions (running as definer) can do it. Owners
-- read their own requests/statements directly via RLS; only creation and
-- revocation go through functions, so the subject text is always the
-- server-derived, ownership-checked snapshot below — never client-supplied.
--
-- Safe to re-run.

set search_path = public, extensions;

create table if not exists statement_requests (
  id              uuid primary key default gen_random_uuid(),
  member_id       uuid not null references members(id) on delete cascade,
  token           text not null unique,
  subject_type    text not null check (subject_type in ('exposure', 'condition', 'general')),
  subject_id      uuid,
  subject_label   text not null,
  veteran_note    text,
  requester_name  text,
  status          text not null default 'pending' check (status in ('pending', 'submitted', 'revoked')),
  created_at      timestamptz not null default now(),
  submitted_at    timestamptz,
  expires_at      timestamptz not null default (now() + interval '90 days')
);
create index if not exists statement_requests_member_idx on statement_requests (member_id);

create table if not exists witness_statements (
  id            uuid primary key default gen_random_uuid(),
  request_id    uuid not null references statement_requests(id) on delete cascade,
  member_id     uuid not null references members(id) on delete cascade,
  witness_name  text not null,
  relationship  text not null,
  contact       text,
  statement     text not null,
  created_at    timestamptz not null default now()
);
create index if not exists witness_statements_member_idx on witness_statements (member_id);

alter table statement_requests enable row level security;
alter table witness_statements enable row level security;

drop policy if exists statement_requests_owner_read on statement_requests;
create policy statement_requests_owner_read on statement_requests for select
  using (member_id in (select id from members where auth_id = auth.uid()));

drop policy if exists witness_statements_owner_read on witness_statements;
create policy witness_statements_owner_read on witness_statements for select
  using (member_id in (select id from members where auth_id = auth.uid()));

-- Create a request for one of the veteran's own exposures, one of their own
-- conditions, or a general statement about their service. subject_label is
-- computed here, server-side, from the veteran's OWN records (ownership
-- checked) — the witness never sees anything the veteran didn't already log.
create or replace function create_statement_request(p_subject_type text, p_subject_id uuid, p_note text)
returns table(id uuid, token text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_member uuid;
  v_label text;
  v_name text;
  v_token text;
begin
  select id, display_name into v_member, v_name from members where auth_id = auth.uid();
  if v_member is null then raise exception 'not signed in'; end if;

  if p_subject_type = 'exposure' then
    select coalesce(ci.place_name, 'their service') || ' (' || e.exposure_class::text || ')'
      into v_label
    from exposures e join check_ins ci on ci.id = e.check_in_id
    where e.id = p_subject_id and e.member_id = v_member;
    if v_label is null then raise exception 'exposure not found'; end if;
  elsif p_subject_type = 'condition' then
    select label into v_label from conditions where id = p_subject_id and member_id = v_member;
    if v_label is null then raise exception 'condition not found'; end if;
  elsif p_subject_type = 'general' then
    v_label := 'their military service';
    p_subject_id := null;
  else
    raise exception 'invalid subject type';
  end if;

  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

  return query
    insert into statement_requests (member_id, token, subject_type, subject_id, subject_label, veteran_note, requester_name)
    values (v_member, v_token, p_subject_type, p_subject_id, v_label, nullif(left(trim(p_note), 500), ''), v_name)
    returning statement_requests.id, statement_requests.token;
end;
$$;

create or replace function revoke_statement_request(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_member uuid;
begin
  select id into v_member from members where auth_id = auth.uid();
  if v_member is null then return; end if;
  update statement_requests set status = 'revoked'
  where id = p_id and member_id = v_member and status = 'pending';
end;
$$;

-- Public: what a witness sees when they open the link. No auth required — the
-- token itself is the capability. Returns one row with an EFFECTIVE status
-- ('pending' | 'submitted' | 'revoked' | 'expired') so the page can render the
-- right message; an empty result means the token is not real.
create or replace function get_statement_request(p_token text)
returns table(status text, subject_label text, veteran_note text, requester_name text)
language sql
security definer
set search_path = public, extensions
as $$
  select
    case when sr.status = 'pending' and sr.expires_at < now() then 'expired' else sr.status end,
    sr.subject_label,
    sr.veteran_note,
    sr.requester_name
  from statement_requests sr
  where sr.token = p_token;
$$;

-- Public: submit the witness's own statement. No auth required. Returns
-- 'ok' | 'invalid' | 'expired' | 'submitted' | 'revoked'.
create or replace function submit_witness_statement(
  p_token text, p_witness_name text, p_relationship text, p_statement text, p_contact text
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

  insert into witness_statements (request_id, member_id, witness_name, relationship, contact, statement)
  values (v_req.id, v_req.member_id, trim(p_witness_name), coalesce(nullif(trim(p_relationship), ''), 'Not specified'),
          nullif(trim(coalesce(p_contact, '')), ''), trim(p_statement));

  update statement_requests set status = 'submitted', submitted_at = now() where id = v_req.id;

  return 'ok';
end;
$$;

grant execute on function create_statement_request to authenticated;
grant execute on function revoke_statement_request to authenticated;
grant execute on function get_statement_request to anon, authenticated;
grant execute on function submit_witness_statement to anon, authenticated;
