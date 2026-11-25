"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../AuthProvider";
import { deleteSimple, insertSimple, listSimple, listSources, updateSimple, type FpResult, type FpSource, type Tier } from "@/lib/firstPage";
import { BackToHub, CardTitle, Input, Notice, PrimaryButton, QuickPicks, QuietButton, SourceSelect, Stance, TierSelect, Toggle } from "./Controls";

// Results that changed: two values, two dates, two sources. Copied as written.
// The page never adds an arrow, a word like "high", or a judgment; that is the
// clinician's call and the lint refuses anything else. The quick picks name a
// measure only; the values, dates and sources are always the veteran's.

const MEASURES = ["Blood pressure", "Weight", "Hemoglobin A1c"];

export default function ResultsEditor() {
  const { supabase, user } = useAuth();
  const [rows, setRows] = useState<FpResult[]>([]);
  const [sources, setSources] = useState<FpSource[]>([]);
  const [error, setError] = useState("");
  const [measure, setMeasure] = useState("");
  const [ev, setEv] = useState(""); const [ed, setEd] = useState(""); const [es, setEs] = useState<string | null>(null);
  const [lv, setLv] = useState(""); const [ld, setLd] = useState(""); const [ls, setLs] = useState<string | null>(null);
  const [tier, setTier] = useState<Tier>("record");
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);

  const refresh = useCallback(async () => {
    const [r, s] = await Promise.all([listSimple<FpResult>(supabase, "fp_results"), listSources(supabase)]);
    if (!r.ok) { setError(r.error); return; }
    setRows(r.data);
    if (s.ok) setSources(s.data);
  }, [supabase]);
  useEffect(() => {
    if (!user) return;
    (async () => { await refresh(); })();
  }, [user, refresh]);

  async function add() {
    setBusy(true); setError("");
    const r = await insertSimple<FpResult>(supabase, "fp_results", {
      measure: measure.trim(), earlier_value: ev.trim(), earlier_date: ed.trim(), earlier_source_id: es,
      later_value: lv.trim(), later_date: ld.trim(), later_source_id: ls, tier, show: true, sort: rows.length,
    });
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    setMeasure(""); setEv(""); setEd(""); setLv(""); setLd("");
    setAdded(true);
    refresh();
  }

  if (!user) return <Notice>Sign in to build your First Page.</Notice>;
  const canAdd = measure.trim() && ev.trim() && ed.trim() && lv.trim() && ld.trim();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <BackToHub />
      <Stance />
      <Notice error={error} />

      <section className="card p-5 sm:p-6">
        <CardTitle lede="Copy the value exactly as the lab report writes it, with its unit, and the date on the report. Earlier first, then later. Which source each came from. Nothing on the page will say whether the change matters.">
          Add a result that changed
        </CardTitle>
        <div className="mt-5 space-y-5">
          <div className="space-y-3">
            <QuickPicks label="What was measured?" picks={MEASURES} onPick={(p) => { setMeasure(p); setAdded(false); }} />
            <Input label="Measure" value={measure} onChange={(v) => { setMeasure(v); setAdded(false); }} placeholder="e.g. Hemoglobin A1c, Blood pressure, Weight" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <fieldset className="space-y-4 rounded-xl border border-line p-4">
              <legend className="px-1 text-[0.9375rem] font-semibold text-ink">Earlier</legend>
              <Input id="earlier-value" label="Value, as written" value={ev} onChange={setEv} placeholder="e.g. 5.4 %" />
              <Input id="earlier-date" label="Date" value={ed} onChange={setEd} placeholder="e.g. 2019-04-02" />
              <SourceSelect id="earlier-source" sources={sources} value={es} onChange={setEs} />
            </fieldset>
            <fieldset className="space-y-4 rounded-xl border border-line p-4">
              <legend className="px-1 text-[0.9375rem] font-semibold text-ink">Later</legend>
              <Input id="later-value" label="Value, as written" value={lv} onChange={setLv} placeholder="e.g. 5.9 %" />
              <Input id="later-date" label="Date" value={ld} onChange={setLd} placeholder="e.g. 2026-08-11" />
              <SourceSelect id="later-source" sources={sources} value={ls} onChange={setLs} />
            </fieldset>
          </div>
          <TierSelect value={tier} onChange={setTier} />
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <PrimaryButton large onClick={add} disabled={busy || !canAdd}>{busy ? "Saving…" : "Add to the page"}</PrimaryButton>
          {added && <span role="status" className="text-[0.9375rem] font-semibold text-success">Added.</span>}
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <CardTitle>On the page</CardTitle>
        {rows.length === 0 ? <p className="mt-2 text-[0.9375rem] text-muted">Nothing yet.</p> : (
          <ul className="mt-3 divide-y divide-line">
            {rows.map((r) => (
              <li key={r.id} className="space-y-2 py-4">
                <p className="text-[0.9375rem] leading-relaxed text-ink">
                  <span className="font-semibold">{r.measure}:</span> {r.earlier_value}, {r.earlier_date}, then {r.later_value}, {r.later_date}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Toggle checked={r.show} onChange={async (v) => { await updateSimple(supabase, "fp_results", r.id, { show: v }); refresh(); }} label="Print this result" />
                  <QuietButton danger onClick={async () => { await deleteSimple(supabase, "fp_results", r.id); refresh(); }}>Remove</QuietButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
