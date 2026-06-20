# Connecting the Dots of Service

A living, member-built record of where veterans and military first responders served, what they
were exposed to, and the conditions they carry now, built to reveal patterns and find root causes.

See the planning documents in the `.claude` knowledge folder for the full picture:
`Connecting_Dots_App_Product_Brief.md`, `Connecting_Dots_App_Governance_Recommendation.md`,
and `Connecting_Dots_App_Phase1_Build_Plan.md`.

## Stack (Phase 1)

- **Frontend:** Next.js (React, TypeScript), mobile-first PWA
- **Backend / database:** Supabase (PostgreSQL + PostGIS, Auth, Storage, Row-Level Security)
- **Map:** MapLibre GL with a vector tile provider (MapTiler or Mapbox)
- **AI:** Claude API (conversational intake, DD-214 extraction, fundraiser drafting)
- **Hosting:** Vercel (app) + Supabase (managed backend)

## Status — milestone 1 (foundation)

Done in this repo:
- [x] Repository initialized
- [x] Core data model: `supabase/migrations/0001_init.sql` (all core tables, designed to hold the full vision)
- [x] Privacy firewall: Row-Level Security policies (members see only their own records)
- [x] Reference seed data: `supabase/migrations/0002_seed_known_sites.sql`
- [x] Plain-English schema map: `docs/DATA_MODEL.md`

Next sub-steps (need a couple of accounts and tools, see below):
- [ ] Install Node.js 20+ (not currently on this machine)
- [ ] Create a Supabase project and run the migrations
- [ ] Scaffold the Next.js PWA (`create-next-app`) and wire Supabase Auth
- [ ] Build the map + pin-drop + timeline (the spine)

## Getting it running (when ready)

1. **Install Node.js 20 LTS** from https://nodejs.org (this enables the app to run locally).
2. **Create a free Supabase project** at https://supabase.com and copy the project URL and keys.
3. **Run the database migrations** (Supabase SQL editor, or the Supabase CLI), in order:
   `0001_init.sql` then `0002_seed_known_sites.sql`. This builds the schema and the firewall.
4. **Copy `.env.example` to `.env.local`** and fill in the Supabase, Claude, and map keys.
5. **Scaffold and run the app** (next sub-step): `npx create-next-app@latest`, then `npm run dev`.

## Principles baked into the schema

- **Privacy first:** Row-Level Security means a member's health and exposure data is theirs alone by default.
- **AI suggests, human confirms:** AI-proposed records are stored with `confirmed = false` until the member confirms.
- **Evidence tiers everywhere:** every exposure and condition carries an `evidence_tier`.
- **Built to grow:** the full exposure taxonomy, the layered cohorts, corroboration, the estimator
  config, and documented need are all in the schema now, so later phases add features, not rebuilds.
