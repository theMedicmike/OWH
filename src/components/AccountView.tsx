"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import VerifyCard from "./VerifyCard";
import DocumentsCard from "./DocumentsCard";
import CohortConsentCard from "./CohortConsentCard";
import OwnYourRecordCard from "./OwnYourRecordCard";
import { isMissingColumnError } from "@/lib/supabaseErrors";
import DD214Assist from "./DD214Assist";
import { bootCampsFor } from "@/lib/gazetteer";
import { saveBootCampCheckIn, findBootCampCheckIn } from "@/lib/bootCamp";

const BRANCHES = ["", "Army", "Marine Corps", "Navy", "Air Force", "Space Force", "Coast Guard", "National Guard", "Reserves"];

const LAYERS = [
  { v: "veteran", label: "A veteran or service member (me)" },
  { v: "first_responder", label: "A military first responder (me)" },
  { v: "family", label: "A family member or caregiver, helping a veteran" },
  { v: "civilian", label: "Someone supporting a veteran" },
];

export default function AccountView() {
  const { user, supabase } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [branch, setBranch] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [layer, setLayer] = useState("veteran");
  const [mos, setMos] = useState("");
  const [vaRating, setVaRating] = useState("");
  const [vaCare, setVaCare] = useState<boolean | null>(null);
  const [units, setUnits] = useState("");
  const [bootCamp, setBootCamp] = useState("");
  const [bootCampYear, setBootCampYear] = useState("");
  const [existingBootCamp, setExistingBootCamp] = useState<{ place: string; year: number | null } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Widened select (migration 0014) with a defensive fallback — these were
      // write-once-and-invisible before; now they live where they can be fixed.
      type M = Record<string, unknown> | null;
      let data: M = (await supabase.from("members")
        .select("display_name, branch, service_start, service_end, population_layer, mos, va_rating, va_healthcare, units")
        .eq("auth_id", user.id).maybeSingle()).data;
      if (!data) {
        // units has existed since 0001 — it MUST be in the fallback select, or
        // a pre-0014 save would quietly wipe it to [].
        data = (await supabase.from("members")
          .select("display_name, branch, service_start, service_end, population_layer, units")
          .eq("auth_id", user.id).maybeSingle()).data;
      }
      if (!data) {
        const created = await supabase.from("members").insert({ auth_id: user.id }).select("display_name, branch, service_start, service_end, population_layer").single();
        data = created.data;
      }
      setDisplayName((data?.display_name as string) ?? "");
      setBranch((data?.branch as string) ?? "");
      setStartYear(data?.service_start ? String(new Date(data.service_start as string).getUTCFullYear()) : "");
      setEndYear(data?.service_end ? String(new Date(data.service_end as string).getUTCFullYear()) : "");
      setLayer((data?.population_layer as string) ?? "veteran");
      setMos((data?.mos as string) ?? "");
      setVaRating((data?.va_rating as string) ?? "");
      if (typeof data?.va_healthcare === "boolean") setVaCare(data.va_healthcare as boolean);
      setUnits(Array.isArray(data?.units) ? (data.units as string[]).join(", ") : "");
      // Show the truth: if a boot-camp pin already exists, offer nothing to fill in.
      setExistingBootCamp(await findBootCampCheckIn(supabase, (data?.branch as string) ?? ""));
      setLoaded(true);
    })();
  }, [user, supabase]);

  async function save() {
    if (!user) return;
    setBusy(true);
    setSaved(false);
    const base = {
      display_name: displayName || null,
      branch: branch || null,
      population_layer: layer || "veteran",
      service_start: startYear ? `${startYear}-01-01` : null,
      service_end: endYear ? `${endYear}-12-31` : null,
      units: units.split(",").map((u) => u.trim()).filter(Boolean),
    };
    setSaveErr(null);
    const full = await supabase.from("members").update({
      ...base,
      mos: mos.trim() || null,
      va_rating: vaRating || null,
      va_healthcare: vaCare,
    }).eq("auth_id", user.id);
    let err = full.error;
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
      });
      if (res.status === "saved" || res.status === "already-there") {
        setExistingBootCamp({ place: res.place, year: parseInt(bootCampYear) || parseInt(startYear) || null });
        setBootCamp("");
        setBootCampYear("");
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
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                Thank you for standing in the gap. You can build this record on behalf of the veteran
                you&apos;re helping — fill in their service, locations, and health as you would your own.
              </p>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Service start</label>
              <input value={startYear} onChange={(e) => setStartYear(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="YYYY" inputMode="numeric" className={field} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Service end</label>
              <input value={endYear} onChange={(e) => setEndYear(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="YYYY" inputMode="numeric" className={field} />
            </div>
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
                {existingBootCamp.year ? <span className="text-muted"> · {existingBootCamp.year}</span> : null}
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
                  <input
                    value={bootCampYear}
                    onChange={(e) => setBootCampYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="Year you shipped (YYYY)"
                    inputMode="numeric"
                    className={`${field} mt-2`}
                  />
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
