-- 0040: The line between them (the First Page as the face of the app, 2026-11-26).
--
-- The words a veteran chooses to set in a chain on the front of his First Page,
-- in his order: "Blast overpressure", "Brain injury", "Tinnitus". Each is text
-- he typed or a label he picked from his own record, with an optional short
-- line under it in his words ("Since 2010"). The app never adds, orders or
-- suggests a link by itself. A chain is something he states about his own life;
-- the page footer says so: "This is my record, not a diagnosis."
--
-- Same shape and the same owner-only policy as the other fp_ tables in 0038.
-- Safe to run twice.

create table if not exists fp_chain (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references members(id) on delete cascade,
  word        text not null check (length(btrim(word)) between 1 and 60),
  detail      text check (detail is null or length(detail) <= 80),
  sort        int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists fp_chain_member_idx on fp_chain (member_id, sort);

alter table fp_chain enable row level security;
drop policy if exists fp_chain_owner on fp_chain;
create policy fp_chain_owner on fp_chain for all
  using (member_id in (select id from members where auth_id = auth.uid()))
  with check (member_id in (select id from members where auth_id = auth.uid()));
grant select, insert, update, delete on fp_chain to authenticated;

comment on table fp_chain is 'The First Page chain ("the line between them"): words the veteran chose and ordered himself. Never generated, ranked or inferred by the app.';
