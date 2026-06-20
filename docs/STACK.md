# Recommended stack and libraries

Two layers: what **you** install once (the environment), and what **I** install for you when we
scaffold the app (the libraries). You only touch the first layer.

## Layer 1 — what you install (once)

- **Node.js 20 LTS** — https://nodejs.org — the engine that runs the app. One installer.
- **Visual Studio Code** — https://code.visualstudio.com — the editor to view and run the project.
- **Git** — already installed.
- Accounts (free to start): **Supabase**, **Vercel**, an **Anthropic API key**, and a **MapTiler** key.

That's it. Everything below, I install and wire up.

## Layer 2 — the libraries I'll install (the good stuff)

### Framework and data
- **Next.js (App Router) + React + TypeScript** — the app framework.
- **@supabase/supabase-js** + **@supabase/ssr** — database, auth, storage, the privacy firewall.
- **TanStack Query** — fast, cached data fetching.
- **Zod** + **React Hook Form** — forms and validation for the intake and the estimator inputs.

### Beautiful UI (this is the "make it gorgeous" layer)
- **Tailwind CSS** — the styling system; fast, consistent, modern.
- **shadcn/ui** — the single biggest lever for a beautiful, professional, accessible interface. Polished components (buttons, dialogs, cards, forms) that we own and restyle to our brand. Not a dependency we're locked into, the code lives in our project.
- **Radix UI** — the accessible foundation under shadcn (keyboard, screen-reader friendly out of the box).
- **lucide-react** — clean, consistent icons.
- **Framer Motion** — smooth animations and transitions that make it feel premium.
- **next-themes** — light and dark mode.

### The map (a core feature)
- **MapLibre GL JS** + **react-map-gl** — the interactive world map. Open-source, no per-view fees.
- **MapTiler** (or Protomaps) — the basemap tiles.
- **supercluster** — clusters thousands of pins cleanly as the registry grows.
- **@turf/turf** — geospatial helpers on the client (PostGIS does the heavy lifting on the server).

### The AI intake and document reading
- **@anthropic-ai/sdk** — the Claude SDK.
- **Vercel AI SDK (`ai`)** — streaming chat UI for the conversational intake, so the guide types in real time.

### Charts and the estimator readouts
- **Tremor** (or **Recharts**) — beautiful charts and dashboard blocks for the burden bars, evidence tiers, and pattern views.
- The body map and burden visuals — custom SVG, like the mockups.

### Mobile and installability
- **Serwist** (modern PWA toolkit) — makes the app installable on a phone, add-to-home-screen, offline-tolerant.

## Smart starting point (a real head start)

Rather than start from a blank page, scaffold from the **official Next.js + Supabase starter**
(`npx create-next-app -e with-supabase`), which already wires auth and Supabase. Then layer in
**shadcn/ui** for the components. That saves days and is the standard professional base for exactly
this kind of app.

## How it goes once Node is installed

1. Scaffold from the Next.js + Supabase starter.
2. Add the libraries above (one command set, I run it).
3. Connect to your Supabase project and run the migrations already in this repo.
4. Build the spine: the map, the pin-drop, the timeline.

Nothing here is exotic; it's the modern, well-supported, beautiful-by-default toolkit. Boring in the
best way, which is what you want for something built to last.
