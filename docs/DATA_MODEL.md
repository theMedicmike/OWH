# Data model, in plain English

Every table below maps to something in the product brief. The schema is built to hold the full
vision now so later phases add features rather than forcing a rebuild.

| Table | What it holds | Why it matters |
|---|---|---|
| `members` | One row per person: their cohort layer (veteran, first responder, contractor, foreign military, civilian, family), branch, service dates, verification status, trust level, and consent settings. | The layered cohorts and progressive trust live here. `consent` is the data covenant in practice. |
| `check_ins` | The pins: a place (real lat/long), a date or range, the conflict, notes, and the role. | The map and timeline are built from these. `confirmed` enforces "AI suggests, human confirms." |
| `exposures` | What a check-in exposed the member to, tagged by class (burn pits, heavy metals, chemical/solvents, water, pesticides, asbestos, nerve agents, particulate, PFAS, radiation, and more) and by evidence tier. | The full multi-class taxonomy is here from day one; Phase 1 surfaces heavy metals and burn pits. |
| `conditions` | Health conditions the member ties to an exposure, with evidence tier, claim status, and whether it is a presumptive match. | The "connecting the dots" link from exposure to illness, and the PACT Act bridge. |
| `known_exposure_sites` | The reference layer: documented burn pits, Camp Lejeune, Agent Orange zones, DU sites, with status (recognized / documented / emerging). | Cross-checks a member's pin against the objective record, which raises the evidence tier. |
| `corroborations` | One battle buddy confirming another's exposure, with witness type and consent-to-name. | Raises the evidence tier and (later) builds the collective record and buddy statements. |
| `weapons_ordnance` | Reference list of weapons and ordnance with their toxicant signatures. | Feeds the role/weapons inputs of the burden estimator. |
| `estimator_config` | The science-board-reviewed weights for each exposure class, versioned, stored as data not code. | Lets the board review and the model recalibrate without an engineering change. |
| `exposure_estimates` | The estimator's output for a member: burden index / dose / risk, organs, minerals, tests, confidence. | Versioned so estimates recompute as the model calibrates over time. |
| `lab_results` | Uploaded panels and biomarkers. | Anchors an individual estimate and, in aggregate, calibrates the model (EMERGING toward DOCUMENTED). |
| `documented_needs` | A member's care need with an eligibility status (locked / eligible / offered / under review / approved). | The donor engine object. Recorded now, donor-facing in Phase 3. Fundraising stays off core screens. |

## The privacy firewall

Row-Level Security on every member-owned table means the database itself enforces that a member can
read and write only their own records. Reference tables (sites, weapons, active estimator config) are
readable by any signed-in member. Aggregate and research access runs through de-identified views and a
governed role, never raw rows. This is the data covenant from the governance document, enforced in code.
