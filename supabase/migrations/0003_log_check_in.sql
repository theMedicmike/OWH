-- Secure save for a member's check-in.
-- Runs as the calling (authenticated) user so Row-Level Security applies.
-- Auto-creates the member row on first use, builds the geography point, and
-- records the exposure. The client calls this via supabase.rpc('log_check_in', ...).

set search_path = public, extensions;

-- Make sure signed-in members can write their own rows (RLS still gates which rows).
grant select, insert, update, delete on
  members, check_ins, exposures, conditions, exposure_estimates, lab_results, documented_needs
  to authenticated;

create or replace function log_check_in(
  p_lng double precision,
  p_lat double precision,
  p_year int,
  p_conflict text,
  p_exposure exposure_class,
  p_detail text
) returns uuid
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
  v_member uuid;
  v_checkin uuid;
begin
  select id into v_member from members where auth_id = auth.uid();
  if v_member is null then
    insert into members (auth_id) values (auth.uid()) returning id into v_member;
  end if;

  insert into check_ins (member_id, geom, conflict, date_start)
  values (v_member, ST_MakePoint(p_lng, p_lat)::geography, p_conflict, make_date(p_year, 1, 1))
  returning id into v_checkin;

  insert into exposures (check_in_id, member_id, exposure_class, detail)
  values (v_checkin, v_member, p_exposure, p_detail);

  return v_checkin;
end;
$$;

grant execute on function log_check_in to authenticated;
