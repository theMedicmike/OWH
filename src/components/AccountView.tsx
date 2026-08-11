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

const BRANCHES = ["", "Army", "Marine Corps", "Navy", "Air Force", "Space Force", "Coast Guard", "National Guard", "Reserves"];
const YEAR_WHEEL_OPTIONS = [...serviceYears()].reverse().map(String); // oldest first — scrolls forward through a career
const MONTH_WHEEL_OPTIONS = ["Not set", ...MONTHS];

const LAYERS = [
  { v: "veteran", label: "A veteran or service member (me)" },
  { v: "first_responder", label: "A military first responder (me)" },
  { v: "family", label: "A family member or caregiver, helping a veteran" },
  { v: "civilian", label: "Someone supporting a veteran" },
];

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
          <div className="mb-1 text-center text-[11px] font-medium text-muted">Year</div>
          <WheelPicker
            options={YEAR_WHEEL_OPTIONS}
            index={yearIndex}
            onChange={(i) => onChange(clampDay({ ...parts, year: YEAR_WHEEL_OPTIONS[i] }))}
            ariaLabel="Year"
          />
        </div>
        <div className={approximate ? "pointer-events-none" : ""}>
          <div className="mb-1 text-center text-[11px] font-medium text-muted">Month</div>
          <WheelPicker
            options={MONTH_WHEEL_OPTIONS}
            index={monthIndex}
            onChange={(i) => onChange(clampDay({ ...parts, month: i === 0 ? "" : String(i) }))}
            ariaLabel="Month"
          />
        </div>
        <div className={approximate ? "pointer-events-none" : ""}>
          <div className="mb-1 text-center text-[11px] font-medium text-muted">Day</div>
          <WheelPicker
            options={dayOptions}
            index={dayIndex}
            onChange={(i) => onChange({ ...parts, day: i === 0 ? "" : String(i) })}
            ariaLabel="Day"
          />
        </div>
      </div>
      {onApproximateChange && (
        <label className="mt-1.5 flex items-center gap-2 text-[11px] text-muted">
          <input type="checkbox" checked={!!approximate} onChange={(e) => onApproximateChange(e.target.checked)} />
          I&apos;m not sure of the exact date — this is my best guess
        </label>
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
  const [bootCampApprox, setBootCampApprox] = useState(false);
  const [existingBootCamp, setExistingBootCamp] = useState<{ place: string; year: number | null; month: number | null; approximate?: boolean } | null>(null);
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
        approximate: bootCampApprox,
      });
      if (res.status === "saved" || res.status === "already-there") {
        setExistingBootCamp({
          place: res.place,
          year: parseInt(bootCampYear) || parseInt(startYear) || null,
          month: bootCampApprox ? null : bootCampMonth || null,
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
    "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-faint focus:border-brand focus:ring-2 focus:ring-brand/15";

  // A load failure shows the reason and NO form. Rendering an empty form here is
  // what let a blank save overwrite a full record.
  if (loadErr) {
    return (
      <div className="rounded-xl border border-warn/40 bg-warn-soft p-5">
        <div className="text-sm font-semibold text-warn">Your profile didn&apos;t load</div>
        <p className="mt-1.5 text-sm leading-relaxed text-ink">{loadErr}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-600"
        >
          Refresh
        </button>
      </div>
    );
  }
  if (!loaded) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div className="space-y-5">
      <VerifyCard />

      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="text-sm font-semibold text-ink">Your profile</div>
        <p className="mt-1 text-sm text-muted">Used to personalize your timeline and your report.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-muted">Name</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" className={field} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-muted">Who is this account for?</label>
            <select value={layer} onChange={(e) => setLayer(e.target.value)} className={field}>
              {LAYERS.map((l) => (
                <option key={l.v} value={l.v}>{l.label}</option>
              ))}
            </select>
            {(layer === "family" || layer === "civilian") && (
              <div className="mt-1.5">
                <p className="text-xs leading-relaxed text-muted">
                  Thank you for standing in the gap. You can build this record on behalf of the veteran
                  you&apos;re helping — fill in their service, locations, and health as you would your own.
                </p>
                <label className="mb-1 mt-2 block text-xs font-medium text-muted">Your relationship to them</label>
                <input
                  value={proxyRelationship}
                  onChange={(e) => setProxyRelationship(e.target.value)}
                  placeholder="Spouse, mother, caregiver…"
                  className={field}
                />
                <p className="mt-1.5 text-[11px] leading-relaxed text-faint">
                  This is how their statement and claim packet will identify you — so anything you write is
                  never mistaken for the veteran&apos;s own words.
                </p>
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Branch</label>
            <select value={branch} onChange={(e) => setBranch(e.target.value)} className={field}>
              {BRANCHES.map((b) => (
                <option key={b} value={b}>{b || "Select…"}</option>
              ))}
            </select>
          </div>
          {/* Year is the only part that matters to the VA and the only part most
              men remember forty years on, so it is the only part required. Month
              and day are offered because some presumptive windows turn on months
              — and because storing a real answer beats stamping "1 January" on a
              date he never gave. */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Service start</label>
            <DatePickers parts={startParts} onChange={setStartParts} approximate={startApprox} onApproximateChange={setStartApprox} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Service end</label>
            {stillServing ? (
              <div className="rounded-lg border border-line bg-canvas px-3.5 py-2.5 text-sm text-muted">
                Still serving — no end date.
              </div>
            ) : (
              <DatePickers parts={endParts} onChange={setEndParts} approximate={endApprox} onApproximateChange={setEndApprox} />
            )}
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={stillServing}
                // Deliberately does NOT clear the end date. save() already writes
                // null when this is ticked, so clearing bought nothing — it only
                // meant a man who ticked the box to see what it did lost his
                // separation date on the spot, with no way to get it back.
                onChange={(e) => setStillServing(e.target.checked)}
                className="h-4 w-4 rounded border-line"
              />
              I am still serving
            </label>
            <p className="mt-1 text-[11px] leading-relaxed text-faint">
              Month and day are optional — the year on its own is enough. If you only remember the year, leave
              the rest blank and we will record it as the year, not guess the rest.
            </p>
          </div>
          {/* Boot camp. It is asked once in the signup wizard, but the wizard has no
              back-navigation — so a veteran who skipped it there previously had no
              way to add it, ever. It is worth having: everybody remembers where
              they shipped and what year, and several training posts carry
              documented exposures of their own. Saving creates a real check-in pin
              via the shared helper in lib/bootCamp.ts, never a duplicate. */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Where you went to boot camp</label>
            {existingBootCamp ? (
              <div className="rounded-lg border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink">
                {existingBootCamp.place}
                {existingBootCamp.year ? (
                  <span className="text-muted">
                    {" · "}
                    {existingBootCamp.approximate
                      ? `circa ${existingBootCamp.year}`
                      : `${existingBootCamp.month ? `${MONTHS[existingBootCamp.month - 1]} ` : ""}${existingBootCamp.year}`}
                  </span>
                ) : null}
                <span className="mt-0.5 block text-[11px] text-faint">
                  Already on your map. Edit it there like any other place you served.
                </span>
              </div>
            ) : branch ? (
              <>
                <select value={bootCamp} onChange={(e) => setBootCamp(e.target.value)} className={field}>
                  <option value="">Select…</option>
                  {bootCampsFor(branch).map((b) => (
                    <option key={b.name} value={b.name}>{b.name}, {b.region}</option>
                  ))}
                  <option value="__other">Somewhere else / I&apos;d rather not say</option>
                </select>
                {bootCamp && bootCamp !== "__other" && (
                  <div className="mt-2">
                    <MonthYearWheel
                      month={bootCampMonth}
                      year={parseInt(bootCampYear) || parseInt(startYear) || new Date().getUTCFullYear()}
                      onMonthChange={setBootCampMonth}
                      onYearChange={(y) => setBootCampYear(String(y))}
                      approximate={bootCampApprox}
                      onApproximateChange={setBootCampApprox}
                    />
                  </div>
                )}
                <p className="mt-1.5 text-[11px] leading-relaxed text-faint">
                  Everybody remembers boot camp — and it counts. Some training posts carry documented exposures
                  of their own. Saving adds it to your map as a place you served.
                </p>
              </>
            ) : (
              <p className="rounded-lg border border-line bg-canvas px-3.5 py-2.5 text-xs text-muted">
                Pick your branch above and the training posts for it will appear here.
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">MOS / Rate / AFSC</label>
            <input value={mos} onChange={(e) => setMos(e.target.value)} placeholder="e.g. 11B, HM, 1N0X1" className={field} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Unit(s) you served with</label>
            <input value={units} onChange={(e) => setUnits(e.target.value)} placeholder="e.g. 1-502 IN, 101st ABN" className={field} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Current VA rating</label>
            <select value={vaRating} onChange={(e) => setVaRating(e.target.value)} className={field}>
              <option value="">Select…</option>
              {["Not rated yet","0%","10%","20%","30%","40%","50%","60%","70%","80%","90%","100%"].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Receiving VA healthcare?</label>
            <div className="flex gap-2">
              {(["Yes", "No"] as const).map((v) => (
                <button key={v} type="button" aria-pressed={vaCare === (v === "Yes")}
                  onClick={() => setVaCare(v === "Yes")}
                  className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${vaCare === (v === "Yes") ? "border-brand bg-brand text-white" : "border-line text-muted hover:border-brand/30"}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button onClick={save} disabled={busy} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-600 disabled:opacity-60">
            {busy ? "Saving…" : "Save profile"}
          </button>
          {saved && <span className="text-xs text-success">Saved.</span>}
          {saveErr && <span role="status" className="text-xs font-medium text-red-600">{saveErr}</span>}
        </div>
      </div>

      <DocumentsCard />

      <DD214Assist />

      <OwnYourRecordCard />

      <CohortConsentCard />
    </div>
  );
}
