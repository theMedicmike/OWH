-- 0030 — the ship record (coverage audit 2026-09-09).
--
-- Until this table there was no ship anywhere in this app. Intake told a
-- sailor to pin his homeport and the shipyard where his vessel was overhauled,
-- which is honest for asbestos and yard work and is NOT the thing a VSO asks
-- for. What a VSO asks for is the vessel, the hull number, and the dates —
-- because those three facts are what a records request is written against.
--
-- A vessel is a SERVICE FACT, the same shape as a unit. It is not a place and
-- it is not an exposure.
--
-- WHAT THIS TABLE DELIBERATELY DOES NOT DO. All four are load-bearing; read
-- them before extending this table, because each one is a thing a reasonable
-- builder would add next and must not.
--
--   1. It stores NO qualification, eligibility flag, or presumptive status,
--      and the app ships NO copy of VA's published Vietnam ship list. Blue
--      Water Navy turns on where the vessel actually was — within 12 nautical
--      miles of the Vietnam/Cambodia demarcation line, or on the inland
--      waterways (38 U.S.C. 1116(d), Pub. L. 116-23) — which a rater
--      establishes from DECK LOGS. An app printing "your ship qualifies" would
--      be making a determination on evidence it has never seen, off a hull
--      number a veteran typed from memory fifty years later. It is the same
--      class of thing as the symptom-to-condition matcher the council refused
--      on 2026-08-14. We capture the vessel and route the veteran to VA's own
--      list and to the deck logs. That is the whole scope.
--
--   2. `name` and `hull` are FREE TEXT with no vessel registry behind them and
--      no autocorrect. A hull number silently "fixed" by an app is worse than
--      the veteran's own — his is at least his own recollection, which is
--      evidence; ours would be a guess wearing the authority of a database.
--
--   3. It has no link to conditions, exposures, or check_ins. Walled off from
--      the exposure/condition matching engine exactly the way service_events
--      (shots) and medications are, enforced in scripts/coi-firewall.cjs.
--
--   4. It never counts toward record completeness. The eight-step meter in
--      lib/nextaction.ts does not know this table exists, and must not: a
--      sailor who cannot name every ship he rode is not an incomplete record,
--      and a meter that says he is will read as a verdict on his memory. Same
--      ruling as shots (firewall rule 11).
--
-- Additive, idempotent, RLS owner-only. The app reads it defensively, so every
-- page keeps working whether or not this has been run.

create table if not exists vessels (
  id           uuid primary key default gen_random_uuid(),
  member_id    uuid not null references members(id) on delete cascade,
  -- "USS Kitty Hawk", "USCGC Point Welcome", "USNS Comfort" — as he says it.
  name         text not null,
  -- "CV-63", "WPB-82329". Optional: plenty of veterans remember the ship and
  -- not the number, and a missing hull must never block the save.
  hull         text,
  -- Rough is fine, as everywhere else in this app. Month is optional; year
  -- alone is a perfectly good answer and is what most people have.
  from_year    int,
  from_month   int,
  to_year      int,
  to_month     int,
  -- What he did aboard — rate, division, department. Free text.
  role         text,
  -- His own words: where she operated, what he remembers. Never AI-written,
  -- never rephrased, and printed in the packet as his.
  note         text,
  created_at   timestamptz not null default now()
);
create index if not exists vessels_member_idx on vessels (member_id);

alter table vessels enable row level security;

create policy vessels_owner on vessels for all
  using (member_id in (select id from members where auth_id = auth.uid()))
  with check (member_id in (select id from members where auth_id = auth.uid()));
