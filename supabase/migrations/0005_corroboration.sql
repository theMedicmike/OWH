-- Battle-buddy corroboration. Privacy-first: these functions run with definer rights
-- so they can match service across members, but they return only anonymized exposure
-- facts (no identities) and only for members who opted in to be discoverable
-- (members.consent ->> 'corroborate' = true).

set search_path = public, extensions;

-- Other members' exposures that overlap the current member's service (within ~75km
-- and within one year), that the current member has not already corroborated.
create or replace function find_corroboration_candidates()
returns table(exposure_id uuid, place text, ev_year int, exposure_class text)
language sql
security definer
set search_path = public, extensions
as $$
  with me as (select id from members where auth_id = auth.uid())
  select distinct
    e.id,
    oc.place_name,
    extract(year from oc.date_start)::int,
    e.exposure_class::text
  from check_ins mc
  join me on mc.member_id = me.id
  join check_ins oc
    on oc.member_id <> mc.member_id
   and mc.geom is not null and oc.geom is not null
   and ST_DWithin(mc.geom, oc.geom, 75000)
   and abs(coalesce(extract(year from mc.date_start)::int - extract(year from oc.date_start)::int, 0)) <= 1
  join members om on om.id = oc.member_id and coalesce((om.consent ->> 'corroborate')::boolean, false)
  join exposures e on e.check_in_id = oc.id
  where not exists (
    select 1 from corroborations cr
    where cr.exposure_id = e.id and cr.confirming_member_id = mc.member_id
  );
$$;

-- Confirm another member's exposure: record it and raise that exposure's evidence tier.
create or replace function corroborate(p_exposure_id uuid, p_witness_type witness_type)
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

  insert into corroborations (exposure_id, confirming_member_id, witness_type)
  values (p_exposure_id, v_member, p_witness_type)
  on conflict (exposure_id, confirming_member_id) do nothing;

  update exposures
  set evidence_tier = 'environmentally_corroborated'
  where id = p_exposure_id and evidence_tier = 'self_reported';
end;
$$;

grant execute on function find_corroboration_candidates to authenticated;
grant execute on function corroborate to authenticated;
