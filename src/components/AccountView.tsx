"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import VerifyCard from "./VerifyCard";
import DocumentsCard from "./DocumentsCard";
import CohortConsentCard from "./CohortConsentCard";
import OwnYourRecordCard from "./OwnYourRecordCard";
import { isMissingColumnError } from "@/lib/supabaseErrors";
import DD214Assist from "./DD214Assist";
import { bootCampsFor } from "@/lib/gazetteer";
import { saveBootCampCheckIn, findBootCampCheckIn } from "@/lib/bootCamp";
import {
  EMPTY_PARTS, MONTHS, clampDay, daysInMonth, fromParts, serviceYears, toParts,
  type ServiceDateParts,
} from "@/lib/serviceDates";
import WheelPicker from "./WheelPicker";
import MonthYearWheel from "./MonthYearWheel";

const BRANCHES = ["Army", "Marine Corps", "Navy", "Air Force", "Space Force", "Coast Guard", "National Guard", "Reserves"];
const VA_RATINGS = ["Not rated yet", "0%", "10%", "20%", "30%", "40%", "50%", "60%", "70%", "80%", "90%", "100%"];
const YEAR_WHEEL_OPTIONS = [...serviceYears()].reverse().map(String); // oldest first — scrolls forward through a career
const MONTH_WHEEL_OPTIONS = ["Not set", ...MONTHS];

const LAYERS = [
  { v: "veteran", label: "A veteran or service member (me)" },
  { v: "first_responder", label: "A military first responder (me)" },
  { v: "family", label: "A family member or caregiver, helping a veteran" },
  { v: "civilian", label: "Someone supporting a veteran" },
];

// One large tap target per choice: the same tile the intake wizard uses, so a
// veteran meets the same control on every screen. Chosen = filled navy.
function Tile({ on, onClick, children, sub }: { on: boolean; onClick: () => void; children: React.ReactNode; sub?: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`btn w-full flex-col items-start justify-center text-left ${on ? "btn-primary" : "btn-secondary"} min-h-14`}
    >
      <span className="block leading-snug">{children}</span>
      {sub && <span className={`block text-sm font-normal leading-snug ${on ? "text-white/80" : "text-muted"}`}>{sub}</span>}
    </button>
  );
}

// A checkbox as a full-width row: a big box, the words beside it, the whole
// row tappable.
function CheckRow({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-line bg-white px-3.5 py-2 text-[0.9375rem] font-medium text-ink hover:bg-canvas">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-6 w-6 flex-none accent-brand" />
      <span>{children}</span>
    </label>
  );
}

// Three wheels: year (required), month and day (optional, in that order of
// usefulness) — same "spin to select" control as the map and the wizard, so a
// veteran doesn't meet a different date control on every screen. A bad year
// silently distorts his timeline and his packet, so this is still a list he
// cannot mistype, just spun instead of dropped down.
function DatePickers({
  parts,
  onChange,
  approximate,
  onApproximateChange,
}: {
  parts: ServiceDateParts;
  onChange: (p: ServiceDateParts) => void;
  approximate?: boolean;
  onApproximateChange?: (v: boolean) => void;
}) {
  const maxDay = daysInMonth(parts.year, parts.month);
  const dayOptions = ["Not set", ...Array.from({ length: maxDay }, (_, i) => String(i + 1))];
  const yearIndex = Math.max(0, YEAR_WHEEL_OPTIONS.indexOf(parts.year || String(new Date().getUTCFullYear())));
  const monthIndex = parts.month ? parseInt(parts.month) : 0;
  const dayIndex = parts.day ? Math.min(maxDay, parseInt(parts.day)) : 0;
  return (
    <div>
      <div className={`grid grid-cols-3 gap-2 ${approximate ? "opacity-40" : ""}`}>
        <div className={approximate ? "pointer-events-none" : ""}>
          <div className="mb-1 text-center text-sm font-medium text-muted">Year</div>
          <WheelPicker
            options={YEAR_WHEEL_OPTIONS}
            index={yearIndex}
            onChange={(i) => onChange(clampDay({ ...parts, year: YEAR_WHEEL_OPTIONS[i] }))}
            ariaLabel="Year"
          />
        </div>
        <div className={approximate ? "pointer-events-none" : ""}>
          <div className="mb-1 text-center text-sm font-medium text-muted">Month</div>
          <WheelPicker
            options={MONTH_WHEEL_OPTIONS}
            index={monthIndex}
            onChange={(i) => onChange(clampDay({ ...parts, month: i === 0 ? "" : String(i) }))}
            ariaLabel="Month"
          />
        </div>
        <div className={approximate ? "pointer-events-none" : ""}>
          <div className="mb-1 text-center text-sm font-medium text-muted">Day</div>
          <WheelPicker
            options={dayOptions}
            index={dayIndex}
            onChange={(i) => onChange({ ...parts, day: i === 0 ? "" : String(i) })}
            ariaLabel="Day"
          />
        </div>
      </div>
      {onApproximateChange && (
        <div className="mt-2">
          <CheckRow checked={!!approximate} onChange={onApproximateChange}>
            I&apos;m not sure of the exact date. This is my best guess.
          </CheckRow>
        </div>
      )}
    </div>
  );
}

export default function AccountView() {
  const { user, supabase } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [branch, setBranch] = useState("");
  // Day/month/year, not a bare year — and "still serving", which the signup
  // wizard has always offered and this screen never did.
  const [startParts, setStartParts] = useState<ServiceDateParts>({ ...EMPTY_PARTS });
  const [startApprox, setStartApprox] = useState(false);
  const [endParts, setEndParts] = useState<ServiceDateParts>({ ...EMPTY_PARTS });
  const [endApprox, setEndApprox] = useState(false);
  const [stillServing, setStillServing] = useState(false);
  const [proxyRelationship, setProxyRelationship] = useState("");
  // Boot camp falls back to the service start year when he doesn't give it one.
  const startYear = startParts.year;
  const [layer, setLayer] = useState("veteran");
  const [mos, setMos] = useState("");
  const [vaRating, setVaRating] = useState("");
  const [vaCare, setVaCare] = useState<boolean | null>(null);
  const [units, setUnits] = useState("");
  const [bootCamp, setBootCamp] = useState("");
  const [bootCampYear, setBootCampYear] = useState("");
  const [bootCampMonth, setBootCampMonth] = useState(0);
  const [bootCampDay, setBootCampDay] = useState(0);
  const [bootCampApprox, setBootCampApprox] = useState(false);
  const [existingBootCamp, setExistingBootCamp] = useState<{ place: string; year: number | null; month: number | null; day?: number | null; approximate?: boolean } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const didLoad = useRef(false);

  useEffect(() => {
    if (!user) return;
    // 🔴 Guard against re-running on a form he is already typing into.
    // AuthProvider hands out a NEW user object on every token refresh, so an
    // effect keyed on `user` re-fires roughly hourly. Combined with the wipe
    // below, that meant a record could be blanked without the veteran doing
    // anything unusual at all.
    if (didLoad.current) return;
    didLoad.current = true;
    (async () => {
      type M = Record<string, unknown> | null;

      // 🔴 THE BUG THIS REPLACES — it was live in production, and it destroyed
      // records. The old chain tested only whether it got DATA BACK, never
      // whether the read FAILED. A failed read is indistinguishable from "brand
      // new veteran", so it fell through every tier to an INSERT that cannot
      // succeed (members.auth_id is UNIQUE, 0001_init.sql:38). Every field then
      // landed on `?? ""` and setLoaded(true) rendered a blank — but fully
      // SAVEABLE — form on top of a complete record. He retypes his name, taps
      // Save, and his branch, dates, units, MOS and rating are written as NULL.
      // Then it says "Saved."
      //
      // Now: step down ONLY for a missing column. Any other error stops the load
      // dead, exactly as the intake wizard's prefillOk guard does.
      const selects = [
        "display_name, branch, service_start, service_end, population_layer, mos, va_rating, va_healthcare, units, still_serving, service_start_precision, service_end_precision, proxy_relationship",
        "display_name, branch, service_start, service_end, population_layer, mos, va_rating, va_healthcare, units, still_serving, service_start_precision, service_end_precision",
        "display_name, branch, service_start, service_end, population_layer, mos, va_rating, va_healthcare, units",
        "display_name, branch, service_start, service_end, population_layer, units",
      ];
      let data: M = null;
      let readOk = false;
      for (const cols of selects) {
        const res = await supabase.from("members").select(cols).eq("auth_id", user.id).maybeSingle();
        if (!res.error) { data = res.data as M; readOk = true; break; }
        if (!isMissingColumnError(res.error)) { readOk = false; break; } // real failure — do NOT guess
      }

      if (!readOk) {
        // Leave `loaded` false: the form never renders, so it can never be saved
        // over a record we could not read.
        setLoadErr("Couldn't load your profile. Refresh the page before changing anything — saving now could overwrite what's already saved.");
        didLoad.current = false; // let a refresh try again
        return;
      }

      if (!data) {
        // A genuinely new member — the read succeeded and there is no row yet.
        const created = await supabase.from("members").insert({ auth_id: user.id })
          .select("display_name, branch, service_start, service_end, population_layer").single();
        if (created.error) {
          setLoadErr("Couldn't set up your profile. Refresh and try again.");
          didLoad.current = false;
          return;
        }
        data = created.data as M;
      }

      setDisplayName((data?.display_name as string) ?? "");
      setBranch((data?.branch as string) ?? "");
      // Read back only the precision he actually gave, per date. Rows written
      // before this shipped carry no precision and are year-only by definition —
      // showing "1 January" for them would be reading back an answer he never gave.
      setStartParts(toParts(data?.service_start as string | null, (data?.service_start_precision as string | null) ?? null));
      setStartApprox((data?.service_start_precision as string | null) === "approximate");
      setEndParts(toParts(data?.service_end as string | null, (data?.service_end_precision as string | null) ?? null));
      setEndApprox((data?.service_end_precision as string | null) === "approximate");
      setStillServing(data?.still_serving === true);
      setProxyRelationship((data?.proxy_relationship as string) ?? "");
      setLayer((data?.population_layer as string) ?? "veteran");
      setMos((data?.mos as string) ?? "");
      setVaRating((data?.va_rating as string) ?? "");
      if (typeof data?.va_healthcare === "boolean") setVaCare(data.va_healthcare as boolean);
      setUnits(Array.isArray(data?.units) ? (data.units as string[]).join(", ") : "");
      // Show the truth: if a boot-camp pin already exists, offer nothing to fill in.
      setExistingBootCamp(await findBootCampCheckIn(supabase, (data?.branch as string) ?? ""));
      setLoaded(true);
    })();
    // Keyed on user?.id ON PURPOSE. AuthProvider hands out a NEW user object on
    // every token refresh, so depending on `user` itself re-runs this loader
    // about hourly on a form the veteran may already be typing into. Do not
    // "fix" this to [user] — that is half of how a save became a wipe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, supabase]);

  async function save() {
    if (!user) return;
    // Never write over a record we could not read. The intake wizard has had this
    // guard all along (prefillOk); Account did not, and that is how a save became
    // a wipe.
    if (!loaded) return;
    setBusy(true);
    setSaved(false);
    const start = fromParts(startParts, "start", startApprox);
    const end = stillServing ? null : fromParts(endParts, "end", endApprox);
    // Each date carries its OWN precision. Sharing one value meant storing the
    // coarser of the two — so a man who knows the exact day he shipped but only
    // the year he got out would watch his ship date disappear from the screen,
    // and the next unrelated save would write the vaguer version over it.
    const base = {
      display_name: displayName || null,
      branch: branch || null,
      population_layer: layer || "veteran",
      service_start: start?.date ?? null,
      // Still serving means there IS no end date — not that one is missing.
      // still_serving carries the difference so the packet can print "present"
      // instead of the "?" it used to show.
      service_end: stillServing ? null : (end?.date ?? null),
      units: units.split(",").map((u) => u.trim()).filter(Boolean),
    };
    setSaveErr(null);
    const wide = {
      ...base,
      mos: mos.trim() || null,
      va_rating: vaRating || null,
      va_healthcare: vaCare,
      still_serving: stillServing,
      service_start_precision: start?.precision ?? null,
      service_end_precision: end?.precision ?? null,
    };
    // 0020: WHO is filling this out, when population_layer already says
    // someone other than the veteran is. Newest tier, so it falls off first —
    // the account behind it still saves everything else.
    const isProxy = layer === "family" || layer === "civilian";
    const widest = {
      ...wide,
      proxy_relationship: isProxy ? proxyRelationship.trim() || null : null,
    };
    const full = await supabase.from("members").update(widest).eq("auth_id", user.id);
    let err = full.error;
    if (err && isMissingColumnError(err)) {
      // Migration 0020 hasn't been run yet — drop the proxy fields and retry
      // with everything 0017 already covers.
      err = (await supabase.from("members").update(wide).eq("auth_id", user.id)).error;
    }
    if (err && isMissingColumnError(err)) {
      // Migration 0017 hasn't been run yet. Drop the three new columns — and
      // store the dates YEAR-ONLY, because without a precision column there is
      // nowhere to record that he gave a month or a day. Writing the precise date
      // anyway would leave it looking year-only on the next read, and a later save
      // would quietly flatten it. Better to keep only what we can describe.
      const { still_serving: _s, service_start_precision: _sp, service_end_precision: _ep, ...rest } = wide;
      void _s; void _sp; void _ep;
      const mid = {
        ...rest,
        service_start: start ? `${startParts.year}-01-01` : null,
        service_end: stillServing || !end ? null : `${endParts.year}-12-31`,
      };
      err = (await supabase.from("members").update(mid).eq("auth_id", user.id)).error;
    }
    if (err && isMissingColumnError(err)) {
      // Pre-migration-0014: save the base profile and check THAT result —
      // updates fail with PGRST204, not the 42703 text the old regex expected,
      // which made this fallback dead code and every save a silent no-op.
      err = (await supabase.from("members").update(base).eq("auth_id", user.id)).error;
    }
    if (err) {
      setBusy(false);
      setSaveErr(`Couldn't save: ${err.message}`);
      return;
    }

    // Boot camp is a check-in, not a profile column, so it saves separately — and
    // only when there isn't one already. A failure here must not report the whole
    // save as failed: the profile above did save.
    if (!existingBootCamp && bootCamp && bootCamp !== "__other") {
      const res = await saveBootCampCheckIn(supabase, {
        branch,
        campName: bootCamp,
        year: bootCampYear,
        fallbackYear: startYear,
        month: bootCampMonth,
        day: bootCampDay,
        approximate: bootCampApprox,
      });
      if (res.status === "saved" || res.status === "already-there") {
        setExistingBootCamp({
          place: res.place,
          year: parseInt(bootCampYear) || parseInt(startYear) || null,
          month: bootCampApprox ? null : bootCampMonth || null,
          day: bootCampApprox ? null : bootCampDay || null,
          approximate: bootCampApprox,
        });
        setBootCamp("");
        setBootCampYear("");
        setBootCampMonth(0);
        setBootCampApprox(false);
      } else if (res.status === "skipped" && res.reason.includes("year")) {
        setSaveErr("Saved everything else — boot camp needs the year you shipped before it can go on your map.");
        setBusy(false);
        return;
      }
    }

    setBusy(false);
    setSaved(true);
  }

  const field =
    "field";

  // A load failure shows the reason and NO form. Rendering an empty form here is
  // what let a blank save overwrite a full record.
  if (loadErr) {
    return (
      <div className="rounded-xl border border-warn/40 bg-warn-soft p-5">
        <h2 className="text-lg font-semibold tracking-tight text-ink">Your profile didn&apos;t load</h2>
        <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink">{loadErr}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 btn btn-primary btn-lg"
        >
          Refresh
        </button>
      </div>
    );
  }
  if (!loaded) return <p className="text-[0.9375rem] text-muted">Loading…</p>;

  return (
    <div className="space-y-5">
      <VerifyCard />

      <section className="card p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight text-ink">Your profile</h2>
        <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted">Used to personalize your timeline and your report.</p>

        <div className="mt-5 space-y-6">
          <div>
            <label htmlFor="acct-name" className="field-label">Name</label>
            <input id="acct-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" className={field} autoComplete="name" />
          </div>

          <div>
            <div id="acct-layer-label" className="field-label">Who is this account for?</div>
            <div role="group" aria-labelledby="acct-layer-label" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {LAYERS.map((l) => (
                <Tile key={l.v} on={layer === l.v} onClick={() => setLayer(l.v)}>{l.label}</Tile>
              ))}
            </div>
            {(layer === "family" || layer === "civilian") && (
              <div className="mt-3 rounded-xl bg-canvas p-4">
                <p className="text-[0.9375rem] leading-relaxed text-ink">
                  Thank you for standing in the gap. You can build this record on behalf of the veteran
                  you&apos;re helping. Fill in their service, locations, and health as you would your own.
                </p>
                <label htmlFor="acct-proxy" className="field-label mt-3">Your relationship to them</label>
                <input
                  id="acct-proxy"
                  value={proxyRelationship}
                  onChange={(e) => setProxyRelationship(e.target.value)}
                  placeholder="Spouse, mother, caregiver…"
                  className={field}
                />
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  This is how their statement and claim packet will identify you, so anything you write is
                  never mistaken for the veteran&apos;s own words.
                </p>
              </div>
            )}
          </div>

          <div>
            <div id="acct-branch-label" className="field-label">Branch</div>
            <div role="group" aria-labelledby="acct-branch-label" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {BRANCHES.map((b) => (
                // A boot camp picked for one branch is not on the next branch's
                // list, so switching branch clears the unsaved pick rather than
                // saving a hidden one.
                <Tile key={b} on={branch === b} onClick={() => { if (branch !== b) setBootCamp(""); setBranch(b); }}>{b}</Tile>
              ))}
            </div>
          </div>

          {/* Year is the only part that matters to the VA and the only part most
              men remember forty years on, so it is the only part required. Month
              and day are offered because some presumptive windows turn on months
              — and because storing a real answer beats stamping "1 January" on a
              date he never gave. */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <div className="field-label">Service start</div>
              <DatePickers parts={startParts} onChange={setStartParts} approximate={startApprox} onApproximateChange={setStartApprox} />
            </div>

            <div>
              <div className="field-label">Service end</div>
              <div className="mb-3">
                {/* Deliberately does NOT clear the end date. save() already writes
                    null when this is ticked, so clearing bought nothing; it only
                    meant a man who ticked the box to see what it did lost his
                    separation date on the spot, with no way to get it back. */}
                <CheckRow checked={stillServing} onChange={setStillServing}>I am still serving</CheckRow>
              </div>
              {stillServing ? (
                <div className="rounded-xl border border-line bg-canvas px-3.5 py-3 text-[0.9375rem] text-muted">
                  Still serving, so there is no end date.
                </div>
              ) : (
                <DatePickers parts={endParts} onChange={setEndParts} approximate={endApprox} onApproximateChange={setEndApprox} />
              )}
            </div>
          </div>
          <p className="-mt-3 text-sm leading-relaxed text-muted">
            Month and day are optional. The year on its own is enough. If you only remember the year, leave
            the rest blank and we will record it as the year, not guess the rest.
          </p>

          {/* Boot camp. It is asked once in the signup wizard, but the wizard has no
              back-navigation — so a veteran who skipped it there previously had no
              way to add it, ever. It is worth having: everybody remembers where
              they shipped and what year, and several training posts carry
              documented exposures of their own. Saving creates a real check-in pin
              via the shared helper in lib/bootCamp.ts, never a duplicate. */}
          <div>
            <div id="acct-boot-label" className="field-label">Where you went to boot camp</div>
            {existingBootCamp ? (
              <div className="rounded-xl border border-line bg-canvas px-4 py-3 text-[0.9375rem] text-ink">
                {existingBootCamp.place}
                {existingBootCamp.year ? (
                  <span className="text-muted">
                    {", "}
                    {existingBootCamp.approximate
                      ? `circa ${existingBootCamp.year}`
                      : `${existingBootCamp.day && existingBootCamp.month ? `${existingBootCamp.day} ` : ""}${existingBootCamp.month ? `${MONTHS[existingBootCamp.month - 1]} ` : ""}${existingBootCamp.year}`}
                  </span>
                ) : null}
                <span className="mt-0.5 block text-sm text-muted">
                  Already on your map. Edit it there like any other place you served.
                </span>
              </div>
            ) : branch ? (
              <>
                <div role="group" aria-labelledby="acct-boot-label" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {bootCampsFor(branch).map((b) => (
                    <Tile key={b.name} on={bootCamp === b.name} onClick={() => setBootCamp(b.name)} sub={b.region}>{b.name}</Tile>
                  ))}
                  <Tile on={bootCamp === "__other"} onClick={() => setBootCamp("__other")} sub="Or you'd rather not say">Somewhere else</Tile>
                </div>
                {bootCamp && bootCamp !== "__other" && (
                  <div className="mt-4">
                    <div className="field-label">When did you get there?</div>
                    <MonthYearWheel
                      month={bootCampMonth}
                      year={parseInt(bootCampYear) || parseInt(startYear) || new Date().getUTCFullYear()}
                      day={bootCampDay}
                      onMonthChange={setBootCampMonth}
                      onYearChange={(y) => setBootCampYear(String(y))}
                      onDayChange={setBootCampDay}
                      approximate={bootCampApprox}
                      onApproximateChange={setBootCampApprox}
                    />
                  </div>
                )}
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Everybody remembers boot camp, and it counts. Some training posts carry documented exposures
                  of their own. Saving adds it to your map as a place you served.
                </p>
              </>
            ) : (
              <p className="rounded-xl border border-line bg-canvas px-4 py-3 text-[0.9375rem] text-muted">
                Pick your branch above and the training posts for it will appear here.
              </p>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="acct-mos" className="field-label">MOS, rate or AFSC</label>
              <input id="acct-mos" value={mos} onChange={(e) => setMos(e.target.value)} placeholder="e.g. 11B, HM, 1N0X1" className={field} autoComplete="off" />
            </div>
            <div>
              {/* The example used to be Army-only, which is how a sailor decided this
                  box was not for him. Units print in the packet header, so a ship
                  and hull number typed here DO reach the VSO — today that is the
                  only place in this app a vessel can go. */}
              <label htmlFor="acct-units" className="field-label">Unit(s) or ship(s) you served with</label>
              <input id="acct-units" value={units} onChange={(e) => setUnits(e.target.value)} placeholder="e.g. 1-502 IN, 101st ABN, USS Kitty Hawk (CV-63)" className={field} autoComplete="off" />
            </div>
          </div>

          <div>
            <div id="acct-rating-label" className="field-label">Current VA rating</div>
            <div role="group" aria-labelledby="acct-rating-label" className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {VA_RATINGS.map((r) => (
                <Tile key={r} on={vaRating === r} onClick={() => setVaRating(r)}>{r === "Not rated yet" ? "Not yet" : r}</Tile>
              ))}
            </div>
          </div>

          <div>
            <div id="acct-care-label" className="field-label">Do you get health care from VA?</div>
            <div role="group" aria-labelledby="acct-care-label" className="grid grid-cols-2 gap-2 sm:max-w-sm">
              <Tile on={vaCare === true} onClick={() => setVaCare(true)}>Yes</Tile>
              <Tile on={vaCare === false} onClick={() => setVaCare(false)}>No</Tile>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button onClick={save} disabled={busy} className="btn btn-primary btn-lg">
            {busy ? "Saving…" : "Save profile"}
          </button>
          {saved && <span role="status" className="text-[0.9375rem] font-medium text-success">Saved.</span>}
          {saveErr && <span role="status" className="text-[0.9375rem] font-medium text-scarlet">{saveErr}</span>}
        </div>
      </section>

      <DocumentsCard />

      <DD214Assist />

      <OwnYourRecordCard />

      <CohortConsentCard />
    </div>
  );
}
