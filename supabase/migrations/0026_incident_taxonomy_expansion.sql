-- 0026 — expand incident_class from 9 to 25 values, researched against VA's
-- own recognition structure (Michael's explicit standing rule: "we wanna
-- make sure that it ties back to a VA recognition if possible").
--
-- Research found VA does NOT have one canonical "list of in-service events."
-- It has two separate official structures that only partially overlap:
--   1. The 38 CFR 3.304(f) stressor taxonomy — five buckets, each with its
--      OWN evidentiary standard: combat (f)(2), fear of hostile/terrorist
--      activity (f)(3), POW (f)(4), personal assault/MST (f)(5), and an
--      "other" non-combat stressor category. This is the right hook for
--      mental-health-adjacent events.
--   2. The DBQ / VASRD body-system structure — organized by resulting
--      condition, not cause. This is the right hook for physical/
--      environmental events (the actual DBQ name + diagnostic code family
--      a veteran with that event typically files under).
-- lib/incidentCopy.ts's type-gated copy now has five tiers instead of three,
-- matching this — see that file's comments for exactly which classes map to
-- which CFR subsection.
--
-- Postgres enum values are additive-only here (no renames, no removals) —
-- ALTER TYPE ... ADD VALUE is safe to run even if some values already exist,
-- and never touches existing rows.

alter type incident_class add value if not exists 'combat_action';
alter type incident_class add value if not exists 'witnessed_death_injury';
alter type incident_class add value if not exists 'fear_hostile_activity';
alter type incident_class add value if not exists 'repetitive_motion';
alter type incident_class add value if not exists 'cold_injury';
alter type incident_class add value if not exists 'airborne_jump';
alter type incident_class add value if not exists 'friendly_fire';
alter type incident_class add value if not exists 'captivity_pow';
alter type incident_class add value if not exists 'diving_injury';
alter type incident_class add value if not exists 'heat_injury';
alter type incident_class add value if not exists 'chemical_incident';
alter type incident_class add value if not exists 'aircraft_mishap';
alter type incident_class add value if not exists 'drowning';
alter type incident_class add value if not exists 'electrical_injury';
alter type incident_class add value if not exists 'industrial_accident';
alter type incident_class add value if not exists 'animal_bite';
