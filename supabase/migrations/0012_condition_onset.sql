-- Condition onset year — the missing half of the longitudinal record.
--
-- The book's thesis is "a veteran is a timeline" and the bill (SEC. 309) calls
-- for a LONGITUDINAL service and exposure record. Without an onset year there is
-- no latency to show: "Balad 2006 → asthma 2014" is the single most persuasive
-- line a self-prepared record can carry, and it was unrepresentable.
--
-- Idempotent. Safe to run more than once; harmless if never run (the app reads
-- this column defensively and simply omits onset until the migration lands).

alter table conditions add column if not exists onset_year int;

comment on column conditions.onset_year is
  'Year the veteran says the condition began or was first diagnosed. Self-reported; powers the service timeline and the latency line in the claim packet.';
