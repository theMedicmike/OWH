-- 0024 — day precision for shots/vaccines, matching the same upgrade the
-- map, the intake wizard, Account, and Locations just got. service_events
-- only ever captured year/month; a veteran who remembers the exact day a
-- shot was given (a real possibility — some are logged to the day in a
-- service record) had no way to say so.
--
-- Additive, nullable, idempotent. The app reads everything here defensively.

alter table service_events add column if not exists event_day int check (event_day between 1 and 31);

comment on column service_events.event_day is
  'Day of the month the event happened, if the veteran knows it. NULL unless date_precision is ''day''.';

do $$
declare
  r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_attribute att on att.attrelid = rel.oid and att.attnum = any(con.conkey)
    where rel.relname = 'service_events' and att.attname = 'date_precision' and con.contype = 'c'
  loop
    execute format('alter table service_events drop constraint %I', r.conname);
  end loop;
end $$;
alter table service_events add constraint service_events_date_precision_check
  check (date_precision in ('year', 'month', 'day', 'unsure'));
