# The Cohort Evidence Engine — Spec v0.1

**Status:** Phase 0 (opt-in consent) shipped. Phases 1–3 are roadmap — they require legal/IRB sign-off before any code.
**Owner:** Operation Whole Health (Patriot-founded 501(c)(3))
**Last updated:** 2026-07-01

---

## What it is

Every veteran who uses Connecting the Dots builds a structured record: *where* they served, *what* they were exposed to, *what* conditions they live with. Individually, that's a claim packet. In aggregate — anonymized and opt-in — it is the largest crowdsourced military-exposure map outside the VA. It turns "here's my story" into "here's the pattern across thousands of us," which is the kind of evidence that moves a **Breaking the Cascade Act** hearing, seeds the **NAP pilot study**, and earns press.

**The honesty line that protects the whole thing:** this is *self-reported, observational* data. It shows **patterns and associations**, not proof of causation. Overclaiming would burn the app's hard-won credibility. The power is in the pattern and the scale, stated plainly.

## Non-negotiable principles

1. **Opt-in, never opt-out.** Off by default. Nothing aggregates until the veteran says yes.
2. **Revocable, retroactively.** Turning it off removes them from the next rebuild.
3. **Anonymized before it leaves their row.** The aggregate layer never contains name, email, `auth_id`, exact coordinates, exact dates, or free text.
4. **Never sold.** Research access is grant/DUA-based, not commercial.
5. **OPSEC-safe.** Coarsen geography and dates so no unit's movements can be reverse-engineered.

## The foundation: consent (Phase 0 — SHIPPED)

Extends the existing `members.consent` JSONB (which already holds `opsec_acknowledged`):

```
consent.cohort = {
  contribute: bool,     // master opt-in
  public_map: bool,     // include my data in public counts
  research:   bool,     // include in de-identified research exports
  version:    "2026-07-01",
  at:         "<timestamp>"
}
```

- Presented plainly in **Account** ("Help prove what happened to all of us"): one master toggle + two sub-toggles, each explained. Off by default.
- **Versioned.** If the terms change, re-consent.
- Every change is appended to an **append-only `consent_log`** (migration 0011: owner insert/select, no update/delete under RLS = immutable) so it's defensible to an IRB or a court.

## De-identification (Phase 1)

Raw tables stay behind RLS forever. A pipeline reads **only consented rows** and strips them:

| Raw field | Aggregate layer |
|---|---|
| name / email / auth_id | removed |
| exact `geom` coordinates | → site name or region only |
| exact `date_start`/`date_end` | → year, or era band |
| `notes` / "Other" free text | excluded |
| DD-214 / uploaded records | never touched |
| exposure_class, condition label, population_layer | kept (the signal) |

Plus:
- **k-anonymity / cell suppression:** never show/export a cell with fewer than *k* people (start k=10).
- **Minimum cohort:** no public stat renders until the consented pool passes a floor (start 100).

## The fact model (Phase 1)

A scheduled job produces `cohort_facts` — pure counts, zero PII:

```
cohort_facts:
  site_or_region · year_band · exposure_class ·
  condition_label · population_layer · presumptive(bool) ·
  n_people · n_corroborated · updated_at
```

Because it rebuilds from consented rows, **revocation is automatic**.

## Two products

- **A. Public Exposure Map (Phase 2):** "1,240 veterans documented burn pits at Balad." A living, shareable map; every contributor watches the collective grow (drives organic spread).
- **B. Research export (Phase 3):** de-identified, cell-suppressed, behind a Data Use Agreement — for the NAP pilot, an academic partner, or a Congressional staffer.

## Architecture (Supabase)

- **Aggregation:** scheduled job (cron / edge function / nightly SQL) rebuilds `cohort_facts` from consented rows only.
- **Isolation:** raw member tables keep existing RLS; `cohort_facts` is the only public surface, read-only counts.
- **Public read:** small cacheable route serving pre-aggregated counts, no auth.
- **Research export:** admin-gated, logged, DUA-signed.

## Governance & legal gates (the real blockers)

1. **Privacy policy + Terms** describe cohort use in plain English — attorney review. *(Privacy updated in Phase 0; Terms + attorney review still pending.)*
2. **IRB alignment** — loop aggregate use into the existing IRB-ready NAP pilot framework.
3. **Data-governance owner** + **re-identification / breach response plan**.
4. **Framing discipline** — public copy always states "self-reported, associational, not proof of causation."

## Build phases

- **Phase 0 — SHIPPED (no legal gate):** consent toggles in Account + append-only `consent_log` + plain-English explainer + Privacy section.
- **Phase 1:** aggregation job + `cohort_facts` (internal/private first).
- **Phase 2:** public Exposure Map.
- **Phase 3:** research export + DUA.

## Open decisions

1. **Thresholds** — k and minimum-cohort floor. (Recommend strict: k=10, floor=100; loosen later.)
2. **Geographic grain** — site-level (more compelling) vs region-level (safer OPSEC) for the *public* map. Possible split: region public, site in research export.
3. **Research gatekeeper** — founder alone vs a small advisory/clinical board (ties to the science board already on the roadmap).
