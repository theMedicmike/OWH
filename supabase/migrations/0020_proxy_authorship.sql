-- Proxy authorship — a spouse, parent, or caregiver building the record on a
-- veteran's behalf. members.population_layer ALREADY distinguishes this
-- ('family' / 'civilian' vs 'veteran' / 'first_responder') — the Account page
-- has offered "A family member or caregiver, helping a veteran" since the
-- intake wizard shipped. What was missing: nothing downstream ever read it.
-- The standalone statement still titled itself "My Statement — In My Own
-- Words" and the PDF footer swore "nothing was written by anyone but the
-- veteran" regardless of who was actually typing. This migration adds the one
-- column population_layer doesn't capture — WHO, specifically — so that
-- promise can finally be kept.
--
-- Deliberately NOT a new "is this a proxy" boolean: population_layer is
-- already that signal, and a second, overlapping way to say the same thing is
-- exactly the kind of drift this app has been bitten by before.
--
-- This is NOT shared multi-user access control (a second auth_id reading or
-- writing someone else's rows) — still one account, one member row. Real
-- shared-account access is a bigger decision — consent model, revocation, who
-- signs what — that needs its own design pass.
--
-- Additive and idempotent.

alter table members add column if not exists proxy_relationship text;

comment on column members.proxy_relationship is
  'Free text: how this account holder relates to the veteran ("Spouse", "Mother", "Caregiver") when population_layer is family or civilian. Read alongside population_layer to decide whether the standalone statement and packet may attribute text to the veteran''s own words, or must attribute it to this person instead.';
