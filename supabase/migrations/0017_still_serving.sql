-- Still serving, and honest service dates.
--
-- TWO PROBLEMS THIS FIXES.
--
-- 1. "I am currently serving" already existed in the signup wizard, but it had
--    nowhere to live. It wrote service_end = NULL and moved on — which is
--    indistinguishable from "he didn't fill that in". So the checkbox could not
--    be shown back to him on reload (it looked like the save failed), Account
--    never offered it at all, and his claim packet header printed "2018–?" as
--    though a date were missing, rather than saying he is still in.
--
-- 2. service_start/service_end are DATE columns, but both entry points only ever
--    collected a year and then stamped a month and a day the veteran never gave:
--    `${year}-01-01` and `${year}-12-31`. Nothing downstream reads anything but
--    the year, so no rater has ever seen the invented part — but an app whose
--    whole argument is "never invent a date" should not be inventing dates in
--    its own profile table. service_date_precision records what he actually told
--    us, so a year-only answer can never be mistaken later for a precise one.
--
-- Additive and idempotent. Safe to run before or after the app ships; the app
-- reads and writes both columns defensively via lib/supabaseErrors.isMissingColumnError,
-- so it works either way.

alter table members add column if not exists still_serving boolean;

-- TWO precision columns, not one. A single shared value has to hold the COARSER
-- of the two answers, and most veterans know one date better than the other —
-- the day they shipped is a story, the day they out-processed is a blur. Sharing
-- one column means the exact ship date he took the trouble to enter disappears
-- from the screen, and the next unrelated save writes the blur over it.
alter table members add column if not exists service_start_precision text
  check (service_start_precision in ('year', 'month', 'day'));
alter table members add column if not exists service_end_precision text
  check (service_end_precision in ('year', 'month', 'day'));

comment on column members.still_serving is
  'TRUE when the veteran says he is currently serving. When TRUE, service_end is NULL by design and must be rendered as "present" — never as a missing or unknown date.';

comment on column members.service_start_precision is
  'How precise service_start actually is: year | month | day. NULL means year (the historical default, since every row written before 2026-08 stored an invented 01-01). Never upgrade this on the veteran''s behalf.';

comment on column members.service_end_precision is
  'How precise service_end actually is: year | month | day. NULL means year. Independent of service_start_precision on purpose.';
