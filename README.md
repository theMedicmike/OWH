# Connecting the Dots of Service

A living, member-built record of where veterans and military first responders served, what they
were exposed to, and the conditions they carry now, built to reveal patterns and find root causes.

Planning documents (in the `.claude` knowledge folder): the product brief, the governance
recommendation, the Phase 1 build plan, the cohort-zero pilot plan, and the clinical-lead recruitment
one-pager.

## Stack

- **Next.js (App Router) + React + TypeScript** — the app (this scaffold)
- **Tailwind CSS** — styling (installed); **shadcn/ui** — components (next)
- **Supabase** — PostgreSQL + PostGIS, Auth, Storage, Row-Level Security (the firewall)
- **MapLibre GL + react-map-gl** — the interactive map (next)
- **Claude API** — the conversational intake and document extraction (next)
- **Vercel** — hosting

## Status

- [x] Repository initialized
- [x] Core data model + Row-Level Security firewall (`supabase/migrations/0001_init.sql`)
- [x] Reference seed data (`supabase/migrations/0002_seed_known_sites.sql`)
- [x] Node.js, npm, and the Next.js + TypeScript + Tailwind app scaffolded
- [ ] shadcn/ui component library
- [ ] Supabase project connected and migrations run
- [ ] The spine: map, pin-drop, timeline

## Run it locally

```
npm run dev      # starts the app at http://localhost:3000
```

## Connect the database (when ready)

1. Create a free project at https://supabase.com and copy the project URL and keys.
2. Run the two migration files in `supabase/migrations/` (Supabase SQL editor or CLI), in order.
3. Copy `.env.example` to `.env.local` and fill in the keys.

## Principles baked in

- **Privacy first:** Row-Level Security means a member's data is theirs alone by default.
- **AI suggests, human confirms:** AI-proposed records are stored unconfirmed until the member confirms.
- **Evidence tiers everywhere:** every exposure and condition carries an evidence tier.
- **Built to grow:** the full exposure taxonomy, layered cohorts, corroboration, the estimator config,
  and documented need are all in the schema now, so later phases add features, not rebuilds.

See `docs/DATA_MODEL.md` and `docs/STACK.md` for detail.
