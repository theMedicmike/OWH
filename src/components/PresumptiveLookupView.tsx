"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  PACT_SCOPE,
  AGENT_ORANGE_SCOPE,
  LEJEUNE_SCOPE,
  GULF_WAR_SCOPE,
  RADIATION_SCOPE,
  GULF_WAR_DEADLINE_LINE,
} from "@/lib/presumptive";

// ─────────────────────────────────────────────────────────────────────────────
// PRESUMPTIVE LOOKUP — dropdowns in, cited facts out. Zero inference.
//
// This is the ONLY version of "help me figure out what applies to me" the
// council approved (2026-08-14). The version veterans asked for — describe your
// symptoms and it narrows down what you can claim — was refused in any form:
// matching a person's described symptoms to candidate conditions is
// differential diagnosis regardless of how the output is worded, and it sits
// inside this app's open 38 CFR 14.629 accreditation question.
//
// What makes THIS version safe is structural, not tonal:
//   • There is NO free-text input anywhere in this flow. Not one. The moment a
//     text box appears here "just to help narrow it down," this becomes the
//     feature that was refused. Dropdowns are the guardrail.
//   • Nothing about the veteran's BODY is an input. Only where and when they
//     served — public, documented facts about places and dates.
//   • The output is the published statutory scope, verbatim from lib/
//     presumptive.ts, which every other feature already cites. It says what the
//     law covers; it never says this veteran qualifies. Only VA decides that.
// ─────────────────────────────────────────────────────────────────────────────

type Program = {
  key: string;
  name: string;
  scope: string;
  /** Which era values surface this program. */
  eras: string[];
  /** Which location values surface it. "any" = era alone is enough. */
  locations: string[];
  extra?: string;
};

const ERAS = [
  { v: "vietnam", label: "Vietnam era (1961–1975)" },
  { v: "cold_war", label: "Cold War / between conflicts (1976–1989)" },
  { v: "gulf", label: "Gulf War (1990–2001)" },
  { v: "post911", label: "Post-9/11 (2001–present)" },
  { v: "korea", label: "Korea era (1950–1955)" },
  { v: "wwii", label: "World War II era (1941–1946)" },
];

const LOCATIONS = [
  { v: "vietnam", label: "Vietnam, Thailand, Laos or Cambodia" },
  { v: "korea_dmz", label: "Korean DMZ" },
  { v: "swa", label: "Iraq, Kuwait, Saudi Arabia or the Persian Gulf" },
  { v: "afghanistan", label: "Afghanistan, Djibouti, Syria, Jordan or Yemen" },
  { v: "lejeune", label: "Camp Lejeune or MCAS New River" },
  { v: "guam", label: "Guam, American Samoa or Johnston Atoll" },
  { v: "nuclear", label: "A nuclear test site, Hiroshima/Nagasaki, Enewetak, Palomares or Thule" },
  { v: "other", label: "Somewhere else / not listed" },
];

const PROGRAMS: Program[] = [
  {
    key: "agent_orange",
    name: "Agent Orange / tactical herbicides",
    scope: AGENT_ORANGE_SCOPE,
    eras: ["vietnam", "cold_war"],
    locations: ["vietnam", "korea_dmz", "guam"],
  },
  {
    key: "pact",
    name: "PACT Act — burn pits and particulate matter",
    scope: PACT_SCOPE,
    eras: ["gulf", "post911"],
    locations: ["swa", "afghanistan"],
  },
  {
    key: "gulf_war",
    name: "Gulf War undiagnosed illness (38 CFR §3.317)",
    scope: GULF_WAR_SCOPE,
    eras: ["gulf", "post911"],
    locations: ["swa", "afghanistan"],
    extra: GULF_WAR_DEADLINE_LINE,
  },
  {
    key: "lejeune",
    name: "Camp Lejeune contaminated water",
    scope: LEJEUNE_SCOPE,
    eras: ["korea", "cold_war", "vietnam", "gulf"],
    locations: ["lejeune"],
  },
  {
    key: "radiation",
    name: "Radiation-risk activity",
    scope: RADIATION_SCOPE,
    eras: ["wwii", "korea", "cold_war", "vietnam"],
    locations: ["nuclear"],
  },
];

export default function PresumptiveLookupView() {
  const [era, setEra] = useState("");
  const [location, setLocation] = useState("");

  const matches = useMemo(() => {
    if (!era && !location) return null;
    return PROGRAMS.filter(
      (p) => (!era || p.eras.includes(era)) && (!location || p.locations.includes(location)),
    );
  }, [era, location]);

  const field =
    "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <p className="text-sm leading-relaxed text-muted">
        For certain places and time windows, VA <strong>presumes</strong> the exposure — meaning a veteran
        doesn&apos;t have to prove it happened. Pick where and when you served to see which programs cover
        that service, in the law&apos;s own words.
      </p>

      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="era" className="mb-1 block text-xs font-medium text-muted">When did you serve?</label>
            <select id="era" value={era} onChange={(e) => setEra(e.target.value)} className={field}>
              <option value="">Any time period</option>
              {ERAS.map((e) => <option key={e.v} value={e.v}>{e.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="loc" className="mb-1 block text-xs font-medium text-muted">Where did you serve?</label>
            <select id="loc" value={location} onChange={(e) => setLocation(e.target.value)} className={field}>
              <option value="">Anywhere</option>
              {LOCATIONS.map((l) => <option key={l.v} value={l.v}>{l.label}</option>)}
            </select>
          </div>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-faint">
          Only where and when — this tool never asks about your health, and it can&apos;t tell you whether you
          personally qualify. That is VA&apos;s decision, and an accredited VSO is who confirms it.
        </p>
      </div>

      {matches !== null && (
        matches.length === 0 ? (
          <div className="rounded-xl border border-line bg-surface p-5">
            <div className="text-sm font-semibold text-ink">No presumptive program matches that combination</div>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              That doesn&apos;t rule anything out, and it doesn&apos;t mean an exposure didn&apos;t happen. Most
              claims are built by documenting the exposure directly rather than relying on a presumption — which
              is what the rest of this app is for. A VSO can also check your service against the full lists.
            </p>
            <Link href="/map" className="mt-2 inline-block text-xs font-semibold text-brand hover:underline">
              → Map where you served
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-accent">
              Programs that cover this service
            </div>
            {matches.map((p) => (
              <div key={p.key} className="rounded-xl border border-line bg-surface p-5">
                <div className="text-sm font-semibold text-ink">{p.name}</div>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">{p.scope}</p>
                {p.extra && (
                  <p className="mt-2 rounded-md border border-warn/30 bg-warn-soft px-2.5 py-2 text-[12px] leading-relaxed text-ink">
                    {p.extra}
                  </p>
                )}
              </div>
            ))}
            <p className="px-1 text-xs leading-relaxed text-faint">
              These are the covered locations and dates as written in law — not a decision about your service.
              Meeting a location and date window is one requirement among several, and only VA decides whether a
              presumption applies to you.
            </p>
          </div>
        )
      )}

      <Link href="/vso" className="block rounded-xl border border-brand/30 bg-brand/5 p-5 text-center transition hover:border-brand/50">
        <div className="text-sm font-semibold text-ink">Have a VSO confirm what applies to you →</div>
        <div className="mt-1 text-xs text-muted">Free, every time, no matter which VSO you pick.</div>
      </Link>
    </div>
  );
}
