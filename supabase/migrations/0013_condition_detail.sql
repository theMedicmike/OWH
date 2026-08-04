-- Step 4 ("Your conditions") rebuild — the fields the council found were doing
-- real work, and only those. Everything that merely sounded thorough (severity
-- scales, provider names, treatment history) was deliberately left out.
--
-- All nullable, all optional, all idempotent. The app reads every one of these
-- defensively, so it keeps working if this migration hasn't run yet.

-- Is the diagnosis in writing? The single field that most changes whether a
-- claim survives, and what an accredited VSO does first.
--   'documented'  — the veteran says they have papers
--   'probably'    — it exists somewhere (VA records, an old visit)
--   'undocumented'— nobody ever wrote it down
alter table conditions add column if not exists evidence_status text;

-- How precise the onset year is. A veteran who can only say "after I got out"
-- still belongs on the timeline; forcing a false precision would be worse.
--   'year' | 'in_service' | 'after_service' | 'unsure'
alter table conditions add column if not exists onset_precision text;

-- THE CASCADE, which the app is named after: "this one came from that one."
-- Sleep apnea secondary to PTSD, GERD secondary to the lung injury. Secondary
-- service connection wins a large share of claims and was unrepresentable.
alter table conditions add column if not exists secondary_to uuid
  references conditions(id) on delete set null;

comment on column conditions.evidence_status is
  'Veteran-reported documentation status: documented | probably | undocumented. Self-reported — must print as "Veteran-reported" in the claim packet, never as verified evidence.';
comment on column conditions.onset_precision is
  'How precise onset_year is: year | in_service | after_service | unsure.';
comment on column conditions.secondary_to is
  'Another condition this one arose from (secondary service connection). Veteran-asserted, not a medical determination.';

create index if not exists conditions_secondary_to_idx on conditions (secondary_to);
