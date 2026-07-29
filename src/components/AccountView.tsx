"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import VerifyCard from "./VerifyCard";
import DocumentsCard from "./DocumentsCard";
import CohortConsentCard from "./CohortConsentCard";
import OwnYourRecordCard from "./OwnYourRecordCard";

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
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      let { data } = await supabase
        .from("members")
        .select("display_name, branch, service_start, service_end, population_layer")
        .eq("auth_id", user.id)
        .maybeSingle();
      if (!data) {
        const created = await supabase.from("members").insert({ auth_id: user.id }).select("display_name, branch, service_start, service_end, population_layer").single();
        data = created.data;
      }
      setDisplayName((data?.display_name as string) ?? "");
      setBranch((data?.branch as string) ?? "");
      setStartYear(data?.service_start ? String(new Date(data.service_start as string).getUTCFullYear()) : "");
      setEndYear(data?.service_end ? String(new Date(data.service_end as string).getUTCFullYear()) : "");
      setLayer((data?.population_layer as string) ?? "veteran");
      setLoaded(true);
    })();
  }, [user, supabase]);

  async function save() {
    if (!user) return;
    setBusy(true);
    setSaved(false);
    await supabase
      .from("members")
      .update({
        display_name: displayName || null,
        branch: branch || null,
        population_layer: layer || "veteran",
        service_start: startYear ? `${startYear}-01-01` : null,
        service_end: endYear ? `${endYear}-12-31` : null,
      })
      .eq("auth_id", user.id);
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
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button onClick={save} disabled={busy} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-600 disabled:opacity-60">
            {busy ? "Saving…" : "Save profile"}
          </button>
          {saved && <span className="text-xs text-success">Saved.</span>}
        </div>
      </div>

      <DocumentsCard />

      <OwnYourRecordCard />

      <CohortConsentCard />
    </div>
  );
}
