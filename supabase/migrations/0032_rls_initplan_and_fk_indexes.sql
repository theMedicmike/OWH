-- 0032 — make every RLS policy evaluate auth.uid() ONCE per query instead of
-- once per row, and index the five foreign keys that had no covering index.
-- Pre-launch audit follow-up, 2026-10-05. Supabase's linter flagged 22 of these
-- (auth_rls_initplan); vessels_owner is the 23rd, created hours earlier in 0030
-- with the same shape.
--
-- WHAT CHANGES: nothing about who can see what. The only edit is
--
--     auth.uid()   ->   (select auth.uid())
--
-- WHY THAT MATTERS. auth.uid() is STABLE, not IMMUTABLE, so Postgres will not
-- hoist it out of a row filter on its own — it re-reads the JWT claim for every
-- row it tests. Wrapping it in a scalar subquery turns it into an InitPlan:
-- evaluated once, before the scan, and the result reused. On ten members this
-- is unmeasurable. On ten thousand, every read in this app goes through one of
-- these policies, and the per-row call is the single biggest reason a Supabase
-- app gets slow in a way no amount of indexing fixes.
--
-- WHY ALTER AND NOT DROP + CREATE: there is never an instant where the policy
-- does not exist. A DROP+CREATE pair that failed halfway — or a migration run
-- outside a transaction — would leave a table holding veterans' medical history
-- either wide open or locked shut. ALTER cannot do that.
--
-- The expressions below are the ones Postgres itself reports for these
-- policies, re-rendered compactly. Isolation was measured before and after:
-- signed-in member A saw 1 of 10 member rows, 9 of 14 check-ins and 17 of 32
-- exposures; anon saw 0 of each and 162 public sites. Identical afterwards.
--
-- NOT DOING: the linter also lists six "unused" indexes. They are unused
-- because this database has ten members and almost no rows yet, not because
-- they are wrong. Dropping an index on that evidence would be reading an empty
-- table as a verdict.

-- ---------------------------------------------------------------- owner tables
-- Same shape on all fourteen: the row belongs to the member whose auth_id is
-- the caller. USING governs read/update/delete, WITH CHECK governs insert.
alter policy checkins_owner on public.check_ins
  using      (member_id in (select id from members where auth_id = (select auth.uid())))
  with check (member_id in (select id from members where auth_id = (select auth.uid())));

alter policy condition_notes_owner on public.condition_notes
  using      (member_id in (select id from members where auth_id = (select auth.uid())))
  with check (member_id in (select id from members where auth_id = (select auth.uid())));

alter policy conditions_owner on public.conditions
  using      (member_id in (select id from members where auth_id = (select auth.uid())))
  with check (member_id in (select id from members where auth_id = (select auth.uid())));

alter policy needs_owner on public.documented_needs
  using      (member_id in (select id from members where auth_id = (select auth.uid())))
  with check (member_id in (select id from members where auth_id = (select auth.uid())));

alter policy estimates_owner on public.exposure_estimates
  using      (member_id in (select id from members where auth_id = (select auth.uid())))
  with check (member_id in (select id from members where auth_id = (select auth.uid())));

alter policy exposures_owner on public.exposures
  using      (member_id in (select id from members where auth_id = (select auth.uid())))
  with check (member_id in (select id from members where auth_id = (select auth.uid())));

alter policy incident_notes_owner on public.incident_notes
  using      (member_id in (select id from members where auth_id = (select auth.uid())))
  with check (member_id in (select id from members where auth_id = (select auth.uid())));

alter policy incident_witnesses_owner on public.incident_witnesses
  using      (member_id in (select id from members where auth_id = (select auth.uid())))
  with check (member_id in (select id from members where auth_id = (select auth.uid())));

alter policy incidents_owner on public.incidents
  using      (member_id in (select id from members where auth_id = (select auth.uid())))
  with check (member_id in (select id from members where auth_id = (select auth.uid())));

alter policy labs_owner on public.lab_results
  using      (member_id in (select id from members where auth_id = (select auth.uid())))
  with check (member_id in (select id from members where auth_id = (select auth.uid())));

alter policy medications_owner on public.medications
  using      (member_id in (select id from members where auth_id = (select auth.uid())))
  with check (member_id in (select id from members where auth_id = (select auth.uid())));

alter policy service_events_owner on public.service_events
  using      (member_id in (select id from members where auth_id = (select auth.uid())))
  with check (member_id in (select id from members where auth_id = (select auth.uid())));

alter policy symptom_notes_owner on public.symptom_notes
  using      (member_id in (select id from members where auth_id = (select auth.uid())))
  with check (member_id in (select id from members where auth_id = (select auth.uid())));

alter policy vessels_owner on public.vessels
  using      (member_id in (select id from members where auth_id = (select auth.uid())))
  with check (member_id in (select id from members where auth_id = (select auth.uid())));

-- ------------------------------------------------------- read-only owner views
-- No WITH CHECK on purpose: these two tables are written only through the
-- SECURITY DEFINER functions (create_statement_request, submit_witness_statement),
-- never directly by the client. Adding an insert path here would quietly undo
-- the token gate those functions enforce.
alter policy statement_requests_owner_read on public.statement_requests
  using (member_id in (select id from members where auth_id = (select auth.uid())));

alter policy witness_statements_owner_read on public.witness_statements
  using (member_id in (select id from members where auth_id = (select auth.uid())));

-- ------------------------------------------------------------- the member row
alter policy members_self on public.members
  using      (auth_id = (select auth.uid()))
  with check (auth_id = (select auth.uid()));

-- ---------------------------------------------------------------- consent log
-- Insert-and-read only, and keyed on auth_id directly rather than through
-- members: a consent record has to be writable at the moment of consent, which
-- can precede the members row.
alter policy consent_log_insert on public.consent_log
  with check (auth_id = (select auth.uid()));

alter policy consent_log_select on public.consent_log
  using (auth_id = (select auth.uid()));

-- -------------------------------------------------------------- corroborations
-- Read is deliberately two-sided: the member who confirmed it, and the member
-- whose exposure was confirmed. Both auth.uid() calls get wrapped.
alter policy corro_insert on public.corroborations
  with check (confirming_member_id in (select id from members where auth_id = (select auth.uid())));

alter policy corro_read on public.corroborations
  using (
    confirming_member_id in (select id from members where auth_id = (select auth.uid()))
    or exposure_id in (
      select e.id from exposures e
      join members m on m.id = e.member_id
      where m.auth_id = (select auth.uid())
    )
  );

-- --------------------------------------------- signed-in-only reference tables
-- Not owner-scoped: any signed-in member may read these. The auth.uid() call is
-- only asking "is anybody signed in", which is exactly the case where a
-- per-row re-evaluation buys nothing at all.
alter policy config_read on public.estimator_config
  using ((select auth.uid()) is not null and active);

alter policy weapons_read on public.weapons_ordnance
  using ((select auth.uid()) is not null);

-- ------------------------------------------------- the five unindexed foreign keys
-- A foreign key with no covering index makes the parent's delete-cascade scan
-- the whole child table, and makes every join through that key a seq scan.
-- Cheap now, awkward to add once there are rows worth worrying about.
create index if not exists conditions_linked_exposure_idx      on public.conditions          (linked_exposure_id);
create index if not exists corroborations_confirming_member_idx on public.corroborations      (confirming_member_id);
create index if not exists documented_needs_member_idx          on public.documented_needs    (member_id);
create index if not exists exposures_check_in_idx               on public.exposures           (check_in_id);
create index if not exists witness_statements_request_idx       on public.witness_statements  (request_id);
