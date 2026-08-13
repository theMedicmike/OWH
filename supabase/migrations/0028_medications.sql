-- 0028 — the Medications library (council ruling 2026-08-12).
--
-- A veteran logs what they take. Opening one shows the REAL FDA label text for
-- that drug's adverse effects, alongside the REAL VA diagnostic codes for
-- conditions that appear on that label — because a condition caused or
-- worsened by treatment for an already service-connected condition can
-- sometimes be claimed as secondary under 38 CFR 3.310.
--
-- WHAT THIS TABLE DELIBERATELY DOES NOT DO — all four are council rulings,
-- not style choices, and re-reading them before extending this table is the
-- point of writing them here:
--
--   1. It stores NO percentage, rating tier, or dollar figure. Not on the
--      table, not in the app. The competitor product this feature was
--      benchmarked against prints "up to 100%" badges; that is a rating
--      assertion no adjudicator made, and it is banned outright here.
--   2. It has NO claimed/selected/added_to_disabilities column. There is no
--      write path from a side-effect card into any claim artifact. That is
--      the specific design pattern behind the FTC's VA Claims Insider action
--      (W.D. Tex. 1:23-cv-01473) and behind the open 38 CFR 14.629
--      accreditation question that already gates this app's public launch.
--   3. `taken_for` is FREE TEXT, not a foreign key to conditions. Whether a
--      medication was prescribed for a service-connected condition is the
--      single fact that makes 3.310 relevant — so it is worth capturing — but
--      as the veteran's own words, never as an app-computed link between a
--      drug and a claimable condition. A relational link here would BE the
--      matching engine the council declined to build.
--   4. It is walled off from the exposure/condition-matching engine the same
--      way service_events (shots) is, enforced in scripts/coi-firewall.cjs.
--      A medication is not an exposure.
--
-- Additive, idempotent, RLS owner-only. The app reads it defensively, so it
-- keeps working whether or not this has been run.

create table if not exists medications (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references members(id) on delete cascade,
  -- What the veteran typed or picked. Kept verbatim so their own words survive
  -- even when the openFDA lookup resolves a different official spelling.
  name          text not null,
  -- Resolved from the FDA label when a lookup succeeds; both stay null when it
  -- doesn't, and the feature still works off `name` alone.
  generic_name  text,
  brand_name    text,
  -- The 3.310 hinge: what were they taking it FOR. Free text on purpose.
  taken_for     text,
  still_taking  boolean,
  started_year  int,
  stopped_year  int,
  note          text,
  created_at    timestamptz not null default now()
);
create index if not exists medications_member_idx on medications (member_id);

alter table medications enable row level security;

create policy medications_owner on medications for all
  using (member_id in (select id from members where auth_id = auth.uid()))
  with check (member_id in (select id from members where auth_id = auth.uid()));

grant select, insert, update, delete on medications to authenticated;

comment on table medications is
  'Veteran-logged medications. Opening one shows verbatim FDA label adverse-effect text plus real VA diagnostic codes (38 CFR 3.310 secondary-connection framing). Stores no rating, percentage, or claim selection — there is deliberately no write path from a side effect into any claim artifact. Walled off from condition-matching by scripts/coi-firewall.cjs.';
comment on column medications.taken_for is
  'Free text: what the veteran says this was prescribed for. The 38 CFR 3.310 hinge (was it treating a service-connected condition). Deliberately NOT a foreign key to conditions — an app-computed drug-to-claimable-condition link is the matching engine the council declined to build.';
