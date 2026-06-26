"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { useRouter } from "next/navigation";

// ─── Constants ────────────────────────────────────────────────────────────────

const BRANCHES = [
  "Army", "Navy", "Marine Corps", "Air Force", "Space Force",
  "Coast Guard", "National Guard", "Reserves",
];

const EXPOSURES = [
  { label: "Burn pits / open-air fire",    value: "burn_pit" },
  { label: "Heavy metals",                  value: "heavy_metal" },
  { label: "Chemical / solvent",            value: "chemical_solvent" },
  { label: "Water contamination",           value: "water_contamination" },
  { label: "Pesticide / herbicide",         value: "pesticide" },
  { label: "Asbestos / silica dust",        value: "asbestos_silica" },
  { label: "Nerve agent",                   value: "nerve_agent" },
  { label: "Particulate / dust storms",     value: "particulate" },
  { label: "Radiation / depleted uranium",  value: "radiation" },
  { label: "PFAS / AFFF firefighting foam", value: "pfas_afff" },
  { label: "Gulf War agents",               value: "gulf_war_agent" },
];

const EXPOSURE_LABEL: Record<string, string> = Object.fromEntries(
  EXPOSURES.map((e) => [e.value, e.label])
);

const CONDITIONS = [
  "Chronic rhinitis / sinusitis",
  "Asthma / reactive airway",
  "COPD / chronic bronchitis",
  "Constrictive bronchiolitis",
  "Respiratory or lung cancer",
  "Other cancer",
  "Thyroid disorder",
  "Kidney disease",
  "Hypertension",
  "Neurological / cognitive (TBI)",
  "Peripheral neuropathy",
  "Gut / GI disorder",
  "Autoimmune disorder",
  "Hormonal / reproductive",
  "PTSD / mental health",
];

const VA_RATINGS = ["Not rated yet", "0%", "10%", "20%", "30%", "40%", "50%", "60%", "70%", "80%", "90%", "100%"];

const STEPS = ["Your service", "Where you served", "Your health", "Done"];

// ─── Types ────────────────────────────────────────────────────────────────────

type SiteOption = {
  name: string;
  exposure_classes: string[] | null;
  date_from: string | null;
  date_to: string | null;
};

type LocationEntry = {
  id: string;
  name: string;
  region: string;
  fromYear: string;
  toYear: string;
  exposures: string[];
  confirmed: string[];      // documented exposure classes for the matched site
  matchedSite: string | null;
  other: string;            // free-text exposure not on the standard list
};

function makeLocation(): LocationEntry {
  return {
    id: crypto.randomUUID(),
    name: "", region: "", fromYear: "", toYear: "",
    exposures: [], confirmed: [], matchedSite: null, other: "",
  };
}

async function geocode(name: string, region: string): Promise<{ lat: number; lng: number }> {
  try {
    const q = [name, region].filter(Boolean).join(", ");
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
      { headers: { "User-Agent": "ConnectingDots-OWH/1.0" } }
    );
    const json = await res.json();
    if (json[0]) return { lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) };
  } catch { /* fall through */ }
  return { lat: 0, lng: 0 };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepBar({ step }: { step: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {STEPS.map((label, i) => (
          <div key={i} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-all ${
                i < step  ? "border-accent bg-accent text-white" :
                i === step ? "border-brand bg-brand text-white" :
                             "border-line bg-white text-muted"
              }`}>
                {i < step ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : i + 1}
              </div>
              <span className={`mt-1.5 text-center text-[11px] font-medium leading-tight ${
                i === step ? "text-brand" : i < step ? "text-accent" : "text-faint"
              }`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-1 mb-4 h-0.5 flex-1 transition-all ${i < step ? "bg-accent" : "bg-line"}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <div className="border-b-[3px] border-brand bg-brand px-6 py-4">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-white/70">{subtitle}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-ink">{label}</label>
      {hint && <p className="mb-1.5 text-xs text-muted">{hint}</p>}
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink placeholder:text-faint focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/15 transition";
const selectCls = inputCls + " appearance-none cursor-pointer";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function IntakeFormView({ sites = [] }: { sites?: SiteOption[] }) {
  const { supabase, user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [openDrop, setOpenDrop] = useState<string | null>(null);

  // Step 1 state
  const [displayName, setDisplayName] = useState("");
  const [branch, setBranch] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [currentlyServing, setCurrentlyServing] = useState(false);
  const [mos, setMos] = useState("");

  // Step 2 state
  const [locations, setLocations] = useState<LocationEntry[]>([makeLocation()]);
  const [showNaval, setShowNaval] = useState(false);

  // Step 3 state
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [vaRating, setVaRating] = useState("Not rated yet");
  const [vaCare, setVaCare] = useState<boolean | null>(null);

  // Prefill from existing member record
  useEffect(() => {
    if (!user) return;
    supabase.from("members")
      .select("display_name, branch, service_start, service_end")
      .eq("auth_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        if (data.display_name) setDisplayName(data.display_name);
        if (data.branch) setBranch(data.branch);
        if (data.service_start) setStartYear(String(new Date(data.service_start).getUTCFullYear()));
        if (data.service_end) setEndYear(String(new Date(data.service_end).getUTCFullYear()));
      });
    supabase.from("conditions")
      .select("label")
      .then(({ data }) => {
        if (data?.length) setSelectedConditions(data.map((r) => r.label));
      });
  }, [user, supabase]);

  // ── Save helpers ──────────────────────────────────────────────────────────

  async function ensureMemberId(): Promise<string | null> {
    if (!user) return null;
    const { data: ex } = await supabase.from("members").select("id").eq("auth_id", user.id).maybeSingle();
    if (ex?.id) return ex.id;
    const { data: cr } = await supabase.from("members").insert({ auth_id: user.id }).select("id").single();
    return cr?.id ?? null;
  }

  async function saveStep1() {
    setError(""); setSaving(true);
    try {
      const memberId = await ensureMemberId();
      if (!memberId) throw new Error("Could not create account record.");
      await supabase.from("members").update({
        display_name: displayName.trim() || null,
        branch: branch || null,
        service_start: startYear ? `${startYear}-01-01` : null,
        service_end: (!currentlyServing && endYear) ? `${endYear}-12-31` : null,
      }).eq("id", memberId);
      setStep(1);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function saveStep2() {
    setError(""); setSaving(true);
    try {
      for (const loc of locations) {
        if (!loc.name.trim() && loc.exposures.length === 0 && !loc.other.trim()) continue;
        const coords = await geocode(loc.name, loc.region);
        const year = parseInt(loc.fromYear) || new Date().getFullYear();
        const { data: newId, error: rpcErr } = await supabase.rpc("log_check_in", {
          p_lng: coords.lng,
          p_lat: coords.lat,
          p_year: year,
          p_conflict: null,
          p_exposures: loc.exposures,
        });
        if (rpcErr) throw new Error(rpcErr.message);
        if (newId) {
          const patch: { place_name?: string; notes?: string } = {};
          if (loc.name.trim()) patch.place_name = loc.name.trim();
          if (loc.other.trim()) patch.notes = `Other exposure noted: ${loc.other.trim()}`;
          if (Object.keys(patch).length > 0) {
            await supabase.from("check_ins").update(patch).eq("id", newId);
          }
        }
      }
      setStep(2);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong saving locations.");
    } finally {
      setSaving(false);
    }
  }

  async function saveStep3() {
    setError(""); setSaving(true);
    try {
      const memberId = await ensureMemberId();
      if (!memberId) throw new Error("Could not find account record.");
      // Clear existing, re-insert selected
      await supabase.from("conditions").delete().eq("member_id", memberId);
      if (selectedConditions.length > 0) {
        await supabase.from("conditions").insert(
          selectedConditions.map((label) => ({ member_id: memberId, label, claim_status: "none" }))
        );
      }
      setStep(3);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong saving conditions.");
    } finally {
      setSaving(false);
    }
  }

  // ── Location helpers ──────────────────────────────────────────────────────

  function updateLocation(id: string, patch: Partial<LocationEntry>) {
    setLocations((prev) => prev.map((l) => l.id === id ? { ...l, ...patch } : l));
  }

  // When a veteran picks a prebuilt site, pre-fill its documented exposures
  // (marked "confirmed") and the documented year range — same idea as the map.
  function selectSite(id: string, site: SiteOption) {
    const classes = Array.from(new Set(site.exposure_classes ?? []));
    const fromY = site.date_from ? String(new Date(site.date_from).getUTCFullYear()) : "";
    const toY = site.date_to ? String(new Date(site.date_to).getUTCFullYear()) : "";
    setLocations((prev) => prev.map((l) => {
      if (l.id !== id) return l;
      return {
        ...l,
        name: site.name,
        matchedSite: site.name,
        confirmed: classes,
        // union of anything they'd already checked with the documented ones
        exposures: Array.from(new Set([...l.exposures, ...classes])),
        fromYear: l.fromYear || fromY,
        toYear: l.toYear || toY,
      };
    }));
    setOpenDrop(null);
  }

  function siteMatches(query: string): SiteOption[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return sites.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 8);
  }

  // Naval / submarine service doesn't sit on a map — the honest anchor is the
  // homeport and the shipyard. Surface those sites for one-tap quick-add.
  const NAVAL_RE = /naval|submarine|shipyard|electric boat|newport news|pearl harbor|kitsap|kings bay|point loma|charleston|portsmouth|puget sound|mare island|philadelphia naval|long beach naval|hunters point/i;
  const navalSites = sites.filter((s) => NAVAL_RE.test(s.name));

  function navalShort(name: string) {
    return name.replace(/\s*\(.*?\)\s*/g, " ").split(",")[0].trim();
  }

  function addNavalSite(site: SiteOption) {
    const classes = Array.from(new Set(site.exposure_classes ?? []));
    const fromY = site.date_from ? String(new Date(site.date_from).getUTCFullYear()) : "";
    const toY = site.date_to ? String(new Date(site.date_to).getUTCFullYear()) : "";
    const entry: LocationEntry = {
      ...makeLocation(),
      name: site.name, matchedSite: site.name, confirmed: classes, exposures: classes, fromYear: fromY, toYear: toY,
    };
    setLocations((prev) => {
      const firstEmpty = prev.length === 1 && !prev[0].name.trim() && prev[0].exposures.length === 0 && !prev[0].other.trim();
      return firstEmpty ? [entry] : [...prev, entry];
    });
    setShowNaval(false);
  }

  function toggleExposure(id: string, value: string) {
    setLocations((prev) => prev.map((l) => {
      if (l.id !== id) return l;
      const has = l.exposures.includes(value);
      return {
        ...l,
        exposures: has ? l.exposures.filter((e) => e !== value) : [...l.exposures, value],
        // unchecking a documented exposure drops its "Confirmed" badge too
        confirmed: has ? l.confirmed.filter((e) => e !== value) : l.confirmed,
      };
    }));
  }

  function toggleCondition(label: string) {
    setSelectedConditions((prev) =>
      prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (!user) return <p className="text-sm text-muted">Sign in to use the intake form.</p>;

  return (
    <div className="space-y-6">
      <StepBar step={step} />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* ── Step 1: Your Service ─────────────────────────────────────────── */}
      {step === 0 && (
        <SectionCard
          title="Your service"
          subtitle="Tell us about your military career. Everything here is private and stays in your record."
        >
          <div className="space-y-5">
            <Field label="Your name" hint="How should we address you in your record?">
              <input className={inputCls} placeholder="e.g. John Smith" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </Field>

            <Field label="Branch of service">
              <select className={selectCls} value={branch} onChange={(e) => setBranch(e.target.value)}>
                <option value="">Select your branch…</option>
                {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Service start year">
                <input className={inputCls} type="number" placeholder="e.g. 1998" min="1940" max={new Date().getFullYear()} value={startYear} onChange={(e) => setStartYear(e.target.value)} />
              </Field>
              <Field label="Service end year">
                <input className={inputCls} type="number" placeholder="e.g. 2010" min="1940" max={new Date().getFullYear()} value={endYear} disabled={currentlyServing} onChange={(e) => setEndYear(e.target.value)} />
                <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-muted">
                  <input type="checkbox" checked={currentlyServing} onChange={(e) => { setCurrentlyServing(e.target.checked); if (e.target.checked) setEndYear(""); }} className="rounded" />
                  I am currently serving
                </label>
              </Field>
            </div>

            <Field label="MOS / Rate / AFSC / NEC" hint="Your military job code — optional but helpful for your record.">
              <input className={inputCls} placeholder="e.g. 11B, HM, 1N0X1" value={mos} onChange={(e) => setMos(e.target.value)} />
            </Field>

            <button
              onClick={saveStep1}
              disabled={saving}
              className="w-full rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save & continue →"}
            </button>
          </div>
        </SectionCard>
      )}

      {/* ── Step 2: Where You Served ─────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-accent/30 bg-accent/5">
            <button
              type="button"
              onClick={() => setShowNaval((v) => !v)}
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-accent">
                  <circle cx="12" cy="5" r="3" />
                  <path d="M12 8v13M5 12H3a9 9 0 0 0 18 0h-2" />
                </svg>
                Served aboard a ship or submarine?
              </span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 text-muted transition-transform ${showNaval ? "rotate-180" : ""}`}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {showNaval && (
              <div className="border-t border-accent/20 px-4 py-3">
                <p className="text-sm leading-relaxed text-muted">
                  A ship or sub doesn&apos;t sit in one place on the map. The honest way to capture it is to
                  pin your <strong className="text-ink">homeport</strong> and the{" "}
                  <strong className="text-ink">shipyard</strong> where your vessel was overhauled — that&apos;s
                  where the documented exposures were: asbestos, solvents and fuels, the sealed-atmosphere
                  chemicals you breathed for months, and refueling radiological work.
                </p>
                {navalSites.length > 0 ? (
                  <>
                    <div className="mt-3 text-[11px] font-bold uppercase tracking-wide text-muted">Quick-add a naval site</div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {navalSites.map((s) => (
                        <button
                          key={s.name}
                          type="button"
                          onClick={() => addNavalSite(s)}
                          className="rounded-full border border-line bg-white px-2.5 py-1 text-xs text-ink transition hover:border-brand hover:text-brand"
                        >
                          + {navalShort(s.name)}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="mt-2 text-xs text-faint">
                    Type your homeport or shipyard in a location below — it&apos;ll auto-fill the documented exposures.
                  </p>
                )}
              </div>
            )}
          </div>

          <SectionCard
            title="Where you served"
            subtitle="Add every base, deployment, or location you remember. Don't worry about being exact — we'll figure out the rest."
          >
            <div className="space-y-6">
              {locations.map((loc, idx) => (
                <div key={loc.id} className="rounded-xl border border-line p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-brand">Location {idx + 1}</span>
                    {locations.length > 1 && (
                      <button
                        onClick={() => setLocations((prev) => prev.filter((l) => l.id !== loc.id))}
                        className="text-xs text-muted hover:text-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Base / location name" hint="Start typing — pick from our recognized sites to auto-fill documented exposures.">
                        <div className="relative">
                          <input
                            className={inputCls}
                            placeholder="e.g. Camp Lejeune, Ali Al Salem AB"
                            value={loc.name}
                            autoComplete="off"
                            onChange={(e) => { updateLocation(loc.id, { name: e.target.value, matchedSite: null, confirmed: [] }); setOpenDrop(loc.id); }}
                            onFocus={() => setOpenDrop(loc.id)}
                            onBlur={() => setTimeout(() => setOpenDrop((cur) => (cur === loc.id ? null : cur)), 150)}
                          />
                          {loc.matchedSite && (
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-success">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            </span>
                          )}
                          {openDrop === loc.id && loc.name.trim() !== loc.matchedSite && siteMatches(loc.name).length > 0 && (
                            <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-line bg-white shadow-lg">
                              {siteMatches(loc.name).map((s) => (
                                <button
                                  key={s.name}
                                  type="button"
                                  onMouseDown={(e) => { e.preventDefault(); selectSite(loc.id, s); }}
                                  className="flex w-full flex-col items-start gap-0.5 border-b border-line px-3.5 py-2.5 text-left transition last:border-0 hover:bg-canvas"
                                >
                                  <span className="text-sm font-semibold text-ink">{s.name}</span>
                                  {(s.exposure_classes?.length ?? 0) > 0 && (
                                    <span className="text-[11px] text-muted">
                                      Documented: {(s.exposure_classes ?? []).slice(0, 3).map((c) => EXPOSURE_LABEL[c] ?? c).join(", ")}
                                      {(s.exposure_classes?.length ?? 0) > 3 ? "…" : ""}
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </Field>
                      <Field label="Country / region">
                        <input className={inputCls} placeholder="e.g. Iraq, North Carolina, Germany" value={loc.region} onChange={(e) => updateLocation(loc.id, { region: e.target.value })} />
                      </Field>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="From year">
                        <input className={inputCls} type="number" placeholder="e.g. 2004" min="1940" max={new Date().getFullYear()} value={loc.fromYear} onChange={(e) => updateLocation(loc.id, { fromYear: e.target.value })} />
                      </Field>
                      <Field label="To year">
                        <input className={inputCls} type="number" placeholder="e.g. 2006" min="1940" max={new Date().getFullYear()} value={loc.toYear} onChange={(e) => updateLocation(loc.id, { toYear: e.target.value })} />
                      </Field>
                    </div>

                    <Field
                      label="Exposures at this location"
                      hint="Check everything you remember — the app fills in the rest based on documented sources."
                    >
                      {loc.matchedSite && loc.confirmed.length > 0 && (
                        <div className="mb-3 flex items-start gap-2 rounded-lg border border-success/30 bg-success-soft px-3 py-2 text-xs text-success">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 flex-none">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3" />
                          </svg>
                          <span>
                            <strong>{loc.confirmed.length} documented exposure{loc.confirmed.length > 1 ? "s" : ""}</strong> for {loc.matchedSite} {loc.confirmed.length > 1 ? "are" : "is"} confirmed and pre-selected below. Add or remove anything else that applies.
                          </span>
                        </div>
                      )}
                      <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {EXPOSURES.map((exp) => {
                          const checked = loc.exposures.includes(exp.value);
                          const isConfirmed = loc.confirmed.includes(exp.value);
                          return (
                            <label key={exp.value} className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition ${
                              isConfirmed ? "border-success/40 bg-success-soft font-medium text-success" :
                              checked ? "border-brand bg-brand/5 font-medium text-brand" :
                              "border-line text-muted hover:border-brand/30"
                            }`}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleExposure(loc.id, exp.value)}
                                className={`rounded ${isConfirmed ? "accent-green-700" : "accent-brand"}`}
                              />
                              <span className="flex-1">{exp.label}</span>
                              {isConfirmed && (
                                <span className="rounded bg-success px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                  Confirmed
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>

                      <div className="mt-3">
                        <label className="mb-1.5 block text-xs font-medium text-muted">
                          Something else? Add an exposure that isn&apos;t listed.
                        </label>
                        <input
                          className={inputCls}
                          placeholder="e.g. specific chemical, contaminated fuel, paint fumes…"
                          value={loc.other}
                          onChange={(e) => updateLocation(loc.id, { other: e.target.value })}
                        />
                      </div>
                    </Field>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setLocations((prev) => [...prev, makeLocation()])}
                className="w-full rounded-xl border-2 border-dashed border-line py-3 text-sm font-semibold text-muted transition hover:border-brand hover:text-brand"
              >
                + Add another location
              </button>
            </div>
          </SectionCard>

          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="rounded-xl border border-line px-6 py-3 text-sm font-semibold text-muted transition hover:bg-canvas">
              ← Back
            </button>
            <button
              onClick={saveStep2}
              disabled={saving}
              className="flex-1 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-60"
            >
              {saving ? "Saving locations…" : "Save & continue →"}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Your Health ──────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          <SectionCard
            title="Your health"
            subtitle="Check every condition you live with or have been diagnosed with. This helps us find the documented connections to your service."
          >
            <div className="space-y-5">
              <Field label="Conditions" hint="Select all that apply. You can add more or remove them later.">
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {CONDITIONS.map((cond) => (
                    <label key={cond} className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition ${selectedConditions.includes(cond) ? "border-brand bg-brand/5 font-medium text-brand" : "border-line text-muted hover:border-brand/30"}`}>
                      <input
                        type="checkbox"
                        checked={selectedConditions.includes(cond)}
                        onChange={() => toggleCondition(cond)}
                        className="rounded accent-brand"
                      />
                      {cond}
                    </label>
                  ))}
                </div>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Current VA disability rating">
                  <select className={selectCls} value={vaRating} onChange={(e) => setVaRating(e.target.value)}>
                    {VA_RATINGS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </Field>
                <Field label="Are you currently receiving VA healthcare?">
                  <div className="mt-1 flex gap-3">
                    {(["Yes", "No"] as const).map((v) => (
                      <label key={v} className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition ${vaCare === (v === "Yes") ? "border-brand bg-brand text-white" : "border-line text-muted hover:border-brand/30"}`}>
                        <input type="radio" name="vacare" value={v} checked={vaCare === (v === "Yes")} onChange={() => setVaCare(v === "Yes")} className="sr-only" />
                        {v}
                      </label>
                    ))}
                  </div>
                </Field>
              </div>
            </div>
          </SectionCard>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="rounded-xl border border-line px-6 py-3 text-sm font-semibold text-muted transition hover:bg-canvas">
              ← Back
            </button>
            <button
              onClick={saveStep3}
              disabled={saving}
              className="flex-1 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save my record →"}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Done ─────────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-success">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-ink">Your record is saved.</h2>
          <p className="mt-2 text-sm text-muted">
            Your service, locations, exposures, and health conditions are all on file. Now let&apos;s build your claim packet.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <button onClick={() => router.push("/map")} className="rounded-xl border border-line px-4 py-3 text-sm font-semibold text-muted transition hover:border-brand hover:text-brand">
              📍 Add more locations on the map
            </button>
            <button onClick={() => router.push("/buddies")} className="rounded-xl border border-line px-4 py-3 text-sm font-semibold text-muted transition hover:border-brand hover:text-brand">
              🤝 Find your battle buddies
            </button>
            <button onClick={() => router.push("/report")} className="rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-600">
              📄 View my claim packet →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
