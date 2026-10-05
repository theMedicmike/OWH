-- 0031 — two authorization holes found in the pre-launch audit, 2026-10-05.
--
-- Both are the same shape of mistake: a rule that a reasonable reader would
-- assume the database enforces was actually enforced only by the UI, or only by
-- the sibling function that happens to feed the UI. The publishable key is in
-- every visitor's browser by design, so anyone can call these RPCs directly.
-- A gate in a React component is not a gate.

-- ---------------------------------------------------------------------------
-- 1. "Revoke" has to actually revoke.
--
-- get_statement_request() returned subject_label, veteran_note and
-- requester_name for ANY status — pending, submitted, expired or revoked. It
-- only recomputed the status label.
--
-- WitnessStatementCard does the right thing: it checks the status and returns
-- an early card before rendering any of those three fields. So the UI looked
-- correct, which is exactly why this survived. But the data still crossed the
-- wire, so anyone holding a revoked token could read the veteran's name, the
-- condition he was asking about, and the private note he wrote — by calling
-- /rest/v1/rpc/get_statement_request with the public key.
--
-- A veteran who revokes a request to an estranged spouse, or to a buddy he
-- decided not to trust, believes he pulled it back. He has to be right about
-- that. The status still comes back, so the card can still say "expired" or
-- "this link was withdrawn" — only the contents go dark.
create or replace function public.get_statement_request(p_token text)
 returns table(status text, subject_label text, veteran_note text, requester_name text)
 language sql
 security definer
 set search_path to 'public', 'extensions'
as $function$
  with r as (
    select sr.*, (sr.status = 'pending' and sr.expires_at >= now()) as live
    from statement_requests sr
    where sr.token = p_token
  )
  select
    case when r.status = 'pending' and not r.live then 'expired' else r.status end,
    case when r.live then r.subject_label  end,
    case when r.live then r.veteran_note   end,
    case when r.live then r.requester_name end
  from r;
$function$;

-- ---------------------------------------------------------------------------
-- 2. corroborate() has to re-check that the exposure was ever a candidate.
--
-- It confirmed the caller was a signed-in member, then took ANY exposure id
-- and upgraded that exposure from 'self_reported' to
-- 'environmentally_corroborated'. The real rules — the other veteran was
-- within 75 km, within a year, and had consented to corroboration — lived only
-- in find_corroboration_candidates(), the function that populates the UI.
-- Nothing re-checked them at the write.
--
-- Exploiting it needs an exposure UUID, which is unguessable, so this was never
-- the most likely thing to go wrong. It is here because an evidence tier is a
-- claim a VA rater reads about another human being's service, and the rule
-- that produces it belongs at the write, not in whichever function happened to
-- draw the button.
--
-- Fails SILENTLY, like the not-signed-in branch above it always has. A
-- legitimate click can only come from the candidate list, so if this check
-- fails either the list is stale (the other veteran withdrew consent between
-- page load and click) or the call did not come from the app at all. Neither
-- deserves an error in a veteran's face; the UI reconciles on its next read
-- from find_corroboration_candidates().
create or replace function public.corroborate(p_exposure_id uuid, p_witness_type witness_type)
 returns void
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
as $function$
declare v_member uuid;
begin
  select id into v_member from members where auth_id = auth.uid();
  if v_member is null then return; end if;

  -- The same proximity/year/consent test find_corroboration_candidates() uses,
  -- asked of this one exposure. Keep the two in step: if that query's rules
  -- change, this one changes in the same commit.
  if not exists (
    select 1
    from exposures e
    join check_ins oc on oc.id = e.check_in_id
    join members   om on om.id = oc.member_id
    join check_ins mc on mc.member_id = v_member
    where e.id = p_exposure_id
      and oc.member_id <> v_member
      and coalesce((om.consent ->> 'corroborate')::boolean, false)
      and mc.geom is not null
      and oc.geom is not null
      and ST_DWithin(mc.geom, oc.geom, 75000)
      and abs(coalesce(extract(year from mc.date_start)::int
                     - extract(year from oc.date_start)::int, 0)) <= 1
  ) then
    return;
  end if;

  insert into corroborations (exposure_id, confirming_member_id, witness_type)
  values (p_exposure_id, v_member, p_witness_type)
  on conflict (exposure_id, confirming_member_id) do nothing;

  update exposures set evidence_tier = 'environmentally_corroborated'
  where id = p_exposure_id and evidence_tier = 'self_reported';
end;
$function$;
