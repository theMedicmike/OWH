"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  PACT_SCOPE,
  AGENT_ORANGE_SCOPE,
  COLD_INJURY_SCOPE,
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
//     feature that was refused. Fixed choices are the guardrail. (They are tap
//     tiles now, 2026-11-25, not <select>s: same closed lists, bigger targets.)
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
  { v: "vietnam", label: "Vietnam era (1961–1975), including Korean DMZ service" },
  { v: "cold_war", label: "Cold War / between conflicts (1976–1989)" },
  { v: "gulf", label: "Gulf War (1990–2001)" },
  { v: "post911", label: "Post-9/11 (2001–present)" },
  { v: "korea", label: "Korea era (1950–1955)" },
  { v: "wwii", label: "World War II era (1941–1946)" },
];

const LOCATIONS = [
  { v: "vietnam", label: "Vietnam, Thailand, Laos or Cambodia" },
  { v: "korea_dmz", label: "Korean DMZ" },
  { v: "korea_other", label: "Korea, away from the DMZ" },
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
    name: "PACT Act: burn pits and particulate matter",
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
    key: "cold_injury",
    name: "Cold injury, presumed only for former prisoners of war",
    scope: COLD_INJURY_SCOPE,
    eras: ["wwii", "korea"],
    locations: ["korea_dmz", "korea_other", "other"],
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

// One closed list, drawn as tap tiles. The first tile is "any", so a veteran
// can always step back to no choice without hunting for a clear button.
function TileGroup({
  legend,
  anyLabel,
  options,
  value,
  onChange,
}: {
  legend: string;
  anyLabel: string;
  options: { v: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const all = [{ v: "", label: anyLabel }, ...options];
  return (
    <fieldset>
      <legend className="text-lg font-semibold tracking-tight text-ink">{legend}</legend>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {all.map((o) => {
          const on = value === o.v;
          return (
            <button
              key={o.v || "any"}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(o.v)}
              className={`btn min-h-12 justify-start text-left leading-snug ${on ? "btn-primary" : "btn-secondary"}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function PresumptiveLookupView() {
  const [era, setEra] = useState("");
  const [location, setLocation] = useState("");

  const matches = useMemo(() => {
    if (!era && !location) return null;
    return PROGRAMS.filter(
      (p) => (!era || p.eras.includes(era)) && (!location || p.locations.includes(location)),
    );
  }, [era, location]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <p className="text-[0.9375rem] leading-relaxed text-muted">
        For certain places and time windows, VA <strong>presumes</strong>{" "}the exposure. That means a veteran
        doesn&apos;t have to prove it happened. Tap when and where you served to see which programs cover that
        service, in the law&apos;s own words.
      </p>

      <div className="card space-y-6 p-5">
        <TileGroup legend="When did you serve?" anyLabel="Any time period" options={ERAS} value={era} onChange={setEra} />
        <TileGroup legend="Where did you serve?" anyLabel="Anywhere" options={LOCATIONS} value={location} onChange={setLocation} />
        <p className="text-sm leading-relaxed text-muted">
          Only where and when. This tool never asks about your health, and it can&apos;t tell you whether you
          personally qualify. That is VA&apos;s decision, and an accredited VSO is who confirms it.
        </p>
      </div>

      {matches !== null && (
        <div aria-live="polite">
          {matches.length === 0 ? (
            <div className="card p-5">
              <h2 className="text-lg font-semibold tracking-tight text-ink">No presumptive program matches that combination</h2>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
                That doesn&apos;t rule anything out, and it doesn&apos;t mean an exposure didn&apos;t happen. Most
                claims are built by documenting the exposure directly rather than relying on a presumption, which
                is what the rest of this app is for. A VSO can also check your service against the full lists.
              </p>
              <Link href="/map" className="btn btn-secondary mt-4">
                Map where you served
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold tracking-tight text-ink">Programs that cover this service</h2>
              {matches.map((p) => (
                <div key={p.key} className="card p-5">
                  <h3 className="text-[0.9375rem] font-semibold text-ink">{p.name}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{p.scope}</p>
                  {p.extra && (
                    <p className="mt-3 rounded-xl border border-warn/30 bg-warn-soft px-3 py-2.5 text-sm leading-relaxed text-ink">
                      {p.extra}
                    </p>
                  )}
                </div>
              ))}
              <p className="px-1 text-sm leading-relaxed text-muted">
                These are the covered locations and dates as written in law, not a decision about your service.
                Meeting a location and date window is one requirement among several, and only VA decides whether a
                presumption applies to you.
              </p>
            </div>
          )}
        </div>
      )}

      {(era === "korea" || location === "korea_dmz" || location === "korea_other") && (
        <Link href="/learn/korea" className="card block p-5 transition hover:border-brand/50">
          <span className="block text-[0.9375rem] font-semibold text-ink">Served in Korea? Read the cold and the DMZ</span>
          <span className="mt-1 block text-[0.9375rem] leading-relaxed text-muted">
            The DMZ herbicide window runs September 1, 1967 to August 31, 1971. If that is when you served, choose
            Vietnam era above. This guide covers that, cold injury, records and family benefits.
          </span>
        </Link>
      )}

      <Link href="/vso" className="card block p-5 text-center transition hover:border-brand/50">
        <span className="block text-[0.9375rem] font-semibold text-ink">Have a VSO confirm what applies to you</span>
        <span className="mt-1 block text-sm text-muted">Free, every time, no matter which VSO you pick.</span>
      </Link>
    </div>
  );
}
