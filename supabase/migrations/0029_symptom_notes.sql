-- 0029 — the unfiled symptom note. "Capture first, classify later."
--
-- THE PROBLEM THIS SOLVES (Michael, 2026-08-14): a lot of veterans have
-- symptoms they don't know what to do with. Today the app can only take a
-- symptom if the veteran first decides which condition it belongs to — so a
-- man having a bad night at 2am, who does not know whether "couldn't sleep,
-- chest tight" is the PTSD or the heart or neither, has nowhere to put it.
-- He closes the app and the fact is gone.
--
-- WHAT THIS IS NOT, and the distinction is load-bearing. The 2026-08-14
-- council ruled against engagement mechanics on symptom logging, and the
-- reasoning was clinical rather than squeamish: nudging a veteran to log
-- daily produces a record that reads MANUFACTURED rather than lived, and a
-- padded record is worse for his claim than a sparse honest one. So:
--   • No severity scale, no 1–10 slider, no mood score. A number invites
--     invention; a sentence in his own words does not.
--   • No streak, no chain, no counter framed as progress.
--   • No push notification, and no copy anywhere that says logging today
--     makes a claim stronger.
-- What this IS: a place to write the thing down before it's forgotten, and
-- a way to file it against the right condition later — when he knows, or
-- when a VSO helps him work it out. That is a guidance feature, not a
-- retention mechanic, and it produces better evidence than a slider would.
--
-- FILING MOVES THE ROW. When a note is filed it is inserted into
-- condition_notes carrying its ORIGINAL date and deleted from here, so there
-- is exactly one home for a condition's journal and no duplicate to drift.

create table if not exists symptom_notes (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references members(id) on delete cascade,
  note        text not null,
  -- The day it happened, not the day it was typed. Defaults to today because
  -- that is the overwhelmingly common case, but it stays editable.
  noticed_on  date not null default current_date,
  created_at  timestamptz not null default now()
);
create index if not exists symptom_notes_member_idx on symptom_notes (member_id);

alter table symptom_notes enable row level security;

create policy symptom_notes_owner on symptom_notes for all
  using (member_id in (select id from members where auth_id = auth.uid()))
  with check (member_id in (select id from members where auth_id = auth.uid()));

grant select, insert, update, delete on symptom_notes to authenticated;

comment on table symptom_notes is
  'Unfiled symptom captures — a dated note in the veteran''s own words, written before he knows which condition it belongs to. Filing moves the row into condition_notes with its original date. No severity scale, no streak, no engagement mechanic (council ruling 2026-08-14: nudged density reads manufactured and hurts the claim).';

-- condition_notes currently stores noticed_year/noticed_month only, which was
-- right when every entry was a recollection of roughly when something began.
-- A symptom captured on a specific day has a real date, and rounding it to a
-- year on filing would throw away precision the veteran actually gave us.
alter table condition_notes add column if not exists noticed_on date;

comment on column condition_notes.noticed_on is
  'Exact date, when known — set on entries filed from symptom_notes. Older entries carry only noticed_year/noticed_month, which stay authoritative when this is null.';
