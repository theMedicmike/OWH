-- The two dates that decide real money, veteran-reported.
--
-- Intent to File (VA 21-0966) locks the effective/back-pay date — most
-- veterans don't know it exists until it's cost them. A decision letter's
-- date starts the one-year review window. The app records both as the
-- veteran reports them and always defers to VA.gov / the letter itself.
--
-- Idempotent; nullable; the app reads and writes these defensively but
-- LOUDLY (a silently dropped deadline date is worse than a dropped MOS).

alter table members add column if not exists itf_filed_on date;
alter table conditions add column if not exists decision_date date;

comment on column members.itf_filed_on is
  'Date the veteran says they filed VA Form 21-0966 (Intent to File). Veteran-reported — confirm against VA.gov.';
comment on column conditions.decision_date is
  'Date printed on the VA decision letter for this condition, as the veteran reports it. Veteran-reported — the letter is authoritative.';
