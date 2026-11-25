-- 0039 — create_statement_request: qualify every "id" (2026-11-25).
--
-- The function returns table(id uuid, token text), so inside its body "id" is
-- BOTH an OUT parameter and a column. Postgres refuses to guess: the first
-- unqualified "select id ... from members" raised
--   column reference "id" is ambiguous
-- and "Create a link" on the Battle buddies page failed for every veteran.
-- Seen live 2026-11-25 (subject type "condition"). The fix qualifies the three
-- references with their table names. Nothing else changes.

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
  select members.id, members.display_name into v_member, v_name from members where members.auth_id = auth.uid();
  if v_member is null then raise exception 'not signed in'; end if;

  if p_subject_type = 'exposure' then
    select coalesce(ci.place_name, 'their service') || ' (' || e.exposure_class::text || ')'
      into v_label
    from exposures e join check_ins ci on ci.id = e.check_in_id
    where e.id = p_subject_id and e.member_id = v_member;
    if v_label is null then raise exception 'exposure not found'; end if;
  elsif p_subject_type = 'condition' then
    select conditions.label into v_label from conditions where conditions.id = p_subject_id and conditions.member_id = v_member;
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

grant execute on function create_statement_request to authenticated;
