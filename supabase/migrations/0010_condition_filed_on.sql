-- 0010 — let a veteran log the date they filed a claim for a condition.
-- Makes the Logged → Filed → Rated tracker real: "Filed on June 12, 2026."
-- Idempotent; safe to run more than once.

alter table conditions
  add column if not exists filed_on date;

comment on column conditions.filed_on is
  'Date the veteran reported filing the VA claim for this condition (self-reported).';
