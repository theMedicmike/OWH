-- Battle-buddy reconnection: a privacy-safe "vouch-and-introduce" handshake.
-- No chat, no DMs. A veteran can request to reconnect with the (anonymous) veteran
-- who logged an overlapping service record, but ONLY if that veteran opted in to
-- being contacted (members.consent ->> 'contactable'). Identities and contact notes
-- are revealed to each other ONLY after the recipient accepts (double consent).
-- Safe to re-run.

set search_path = public, extensions;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'buddy_conn_status') then
    create type buddy_conn_status as enum ('pending', 'accepted', 'declined');
  end if;
end $$;

create table if not exists buddy_connections (
  id                  uuid primary key default gen_random_uuid(),
  requester_member_id uuid not null references members(id) on delete cascade,
  recipient_member_id uuid not null references members(id) on delete cascade,
  place               text,
  ev_year             int,
  status              buddy_conn_status not null default 'pending',
  created_at          timestamptz not null default now(),
  unique (requester_member_id, recipient_member_id)
);

alter table buddy_connections enable row level security;

drop policy if exists buddy_conn_read on buddy_connections;
create policy buddy_conn_read on buddy_connections for select
  using (
    requester_member_id in (select id from members where auth_id = auth.uid())
    or recipient_member_id in (select id from members where auth_id = auth.uid())
  );

-- Request to reconnect with the veteran who logged exposure p_exposure_id.
-- Returns: 'sent' | 'not_contactable' | 'self' | 'not_found' | 'no_member'.
create or replace function request_buddy_connection(p_exposure_id uuid)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_me uuid;
  v_owner uuid;
  v_place text;
  v_year int;
  v_contactable boolean;
begin
  select id into v_me from members where auth_id = auth.uid();
  if v_me is null then return 'no_member'; end if;

  select ci.member_id, ci.place_name, extract(year from ci.date_start)::int
    into v_owner, v_place, v_year
  from exposures e
  join check_ins ci on ci.id = e.check_in_id
  where e.id = p_exposure_id;

  if v_owner is null then return 'not_found'; end if;
  if v_owner = v_me then return 'self'; end if;

  select coalesce((consent ->> 'contactable')::boolean, false)
    into v_contactable
  from members where id = v_owner;
  if not v_contactable then return 'not_contactable'; end if;

  insert into buddy_connections (requester_member_id, recipient_member_id, place, ev_year, status)
  values (v_me, v_owner, v_place, v_year, 'pending')
  on conflict (requester_member_id, recipient_member_id) do nothing;

  return 'sent';
end;
$$;

-- Recipient accepts or declines a pending request.
create or replace function respond_buddy_connection(p_connection_id uuid, p_accept boolean)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_me uuid;
  v_recipient uuid;
begin
  select id into v_me from members where auth_id = auth.uid();
  if v_me is null then return 'no_member'; end if;

  select recipient_member_id into v_recipient from buddy_connections where id = p_connection_id;
  if v_recipient is null then return 'not_found'; end if;
  if v_recipient <> v_me then return 'forbidden'; end if;

  update buddy_connections
  set status = case when p_accept then 'accepted'::buddy_conn_status else 'declined'::buddy_conn_status end
  where id = p_connection_id;

  return case when p_accept then 'accepted' else 'declined' end;
end;
$$;

-- The current member's connections. Name + contact note are revealed ONLY for
-- accepted connections (double consent); pending requests stay anonymous.
create or replace function list_buddy_connections()
returns table (
  id uuid,
  direction text,
  status buddy_conn_status,
  place text,
  ev_year int,
  other_name text,
  other_contact text
)
language sql
security definer
set search_path = public, extensions
as $$
  with me as (select id from members where auth_id = auth.uid())
  select
    bc.id,
    case when bc.requester_member_id = me.id then 'sent' else 'received' end,
    bc.status,
    bc.place,
    bc.ev_year,
    case when bc.status = 'accepted' then (
      select display_name from members
      where id = case when bc.requester_member_id = me.id then bc.recipient_member_id else bc.requester_member_id end
    ) end,
    case when bc.status = 'accepted' then (
      select consent ->> 'contact_note' from members
      where id = case when bc.requester_member_id = me.id then bc.recipient_member_id else bc.requester_member_id end
    ) end
  from buddy_connections bc, me
  where bc.requester_member_id = me.id or bc.recipient_member_id = me.id
  order by bc.created_at desc;
$$;

grant execute on function request_buddy_connection to authenticated;
grant execute on function respond_buddy_connection to authenticated;
grant execute on function list_buddy_connections to authenticated;
