-- Stop dropping data veterans already type.
--
-- The intake wizard has ALWAYS asked for MOS/Rate/AFSC (step 1) and for the
-- current VA disability rating + whether the veteran receives VA healthcare
-- (step 3) — and then silently discarded all three: the save paths never wrote
-- them and these columns never existed. A veteran typing "11B" into a claims
-- tool expects it on the record. MOS in particular matters: duty-related
-- exposure (noise, blast, fuels) is weighed by MOS — it's how tinnitus and
-- hearing-loss likelihood is actually assessed.
--
-- Idempotent; all nullable; read defensively by the app.

alter table members add column if not exists mos text;
alter table members add column if not exists va_rating text;
alter table members add column if not exists va_healthcare boolean;

comment on column members.mos is
  'Military job code (MOS / Rate / AFSC / NEC), veteran-reported. Duty-related exposure context for the record and packet.';
comment on column members.va_rating is
  'Current combined VA disability rating as the veteran states it (e.g. "70%", "Not rated yet"). Veteran-reported.';
comment on column members.va_healthcare is
  'Whether the veteran currently receives VA healthcare. Veteran-reported.';
