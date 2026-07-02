-- 0011 — append-only consent audit log.
-- Records every consent change (e.g., cohort opt-in/out) with what was agreed
-- and when, so it's defensible to an IRB, an auditor, or a court. Owners can
-- insert and read their own rows; there is intentionally NO update/delete
-- policy, so entries are immutable once written.
-- Idempotent; safe to run more than once.

create table if not exists consent_log (
  id          uuid primary key default gen_random_uuid(),
  auth_id     uuid not null default auth.uid(),
  kind        text not null,                 -- e.g. 'cohort'
  detail      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists consent_log_auth_idx on consent_log (auth_id, created_at desc);

alter table consent_log enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'consent_log' and policyname = 'consent_log_insert') then
    create policy consent_log_insert on consent_log for insert with check (auth_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'consent_log' and policyname = 'consent_log_select') then
    create policy consent_log_select on consent_log for select using (auth_id = auth.uid());
  end if;
end $$;

-- No update or delete policies: with RLS enabled, that makes the log append-only.
