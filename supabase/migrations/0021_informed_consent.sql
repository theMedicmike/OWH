-- Informed consent — did anyone tell him what was in it before it went in his
-- body. This is a fact the veteran reports about his OWN experience, not a
-- claim the app makes about a shot — same category as `provenance`, and it
-- sits directly on top of the custody-of-the-record theme /shots/history
-- already documents at the institutional level (GAO's own finding that
-- recordkeeping was often not done). This is that same gap, reported from the
-- other side of the syringe.
--
-- Nullable, unlike provenance: this column is additive to an already-shipped
-- feature, and existing rows must not break. The capture UI requires a
-- selection for new entries going forward — enforced in the app, not the DB,
-- so this migration stays a simple, non-breaking column add.
--
-- Additive and idempotent.

alter table service_events add column if not exists informed_consent text
  check (informed_consent in ('informed_choice', 'informed_mandatory', 'not_informed_mandatory', 'not_informed', 'unsure'));

comment on column service_events.informed_consent is
  'What the veteran was told before this shot, in his own recollection: informed_choice (told, had a choice) | informed_mandatory (told, but mandatory) | not_informed_mandatory (mandatory, nothing explained) | not_informed (no explanation at all) | unsure. NULL means not answered — never defaulted, never inferred.';
