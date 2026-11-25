"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../AuthProvider";
import { deleteSimple, insertSimple, listSimple, listSources, updateSimple, type FpResult, type FpSource, type Tier } from "@/lib/firstPage";
import { BackToHub, Input, Notice, PrimaryButton, QuietButton, SourceSelect, Stance, TierSelect, Toggle } from "./Controls";

// Results that changed: two values, two dates, two sources. Copied as written.
// The page never adds an arrow, a word like "high", or a judgment; that is the
// clinician's call and the lint refuses anything else.

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
    refresh();
  }

  if (!user) return <Notice>Sign in to build your First Page.</Notice>;
  const canAdd = measure.trim() && ev.trim() && ed.trim() && lv.trim() && ld.trim();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <BackToHub />
      <Stance />
      <Notice error={error} />

      <div className="card p-5">
        <div className="text-sm font-semibold text-ink">Add a result that changed</div>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          Copy the value exactly as the lab report writes it, with its unit, and the date on the report. Earlier on the
          left, later on the right. Which source each came from. Nothing on the page will say whether the change matters.
        </p>
        <div className="mt-3 space-y-3">
          <Input label="Measure" value={measure} onChange={setMeasure} placeholder="e.g. Hemoglobin A1c, Blood pressure, Weight" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 rounded-lg border border-line p-3">
              <div className="text-[13px] font-semibold text-muted">Earlier</div>
              <Input label="Value, as written" value={ev} onChange={setEv} placeholder="e.g. 5.4 %" />
              <Input label="Date" value={ed} onChange={setEd} placeholder="e.g. 2019-04-02" />
              <SourceSelect sources={sources} value={es} onChange={setEs} />
            </div>
            <div className="space-y-2 rounded-lg border border-line p-3">
              <div className="text-[13px] font-semibold text-muted">Later</div>
              <Input label="Value, as written" value={lv} onChange={setLv} placeholder="e.g. 5.9 %" />
              <Input label="Date" value={ld} onChange={setLd} placeholder="e.g. 2026-08-11" />
              <SourceSelect sources={sources} value={ls} onChange={setLs} />
            </div>
          </div>
          <TierSelect value={tier} onChange={setTier} />
        </div>
        <div className="mt-3"><PrimaryButton onClick={add} disabled={busy || !canAdd}>{busy ? "Saving…" : "Add"}</PrimaryButton></div>
      </div>

      <div className="card p-5">
        <div className="text-sm font-semibold text-ink">On the page</div>
        {rows.length === 0 ? <p className="mt-1 text-[13px] text-faint">Nothing yet.</p> : (
          <ul className="mt-2 divide-y divide-line">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm text-ink">
                <span>{r.measure}: {r.earlier_value}, {r.earlier_date} then {r.later_value}, {r.later_date}</span>
                <span className="flex items-center gap-3">
                  <Toggle checked={r.show} onChange={async (v) => { await updateSimple(supabase, "fp_results", r.id, { show: v }); refresh(); }} label="Print" />
                  <QuietButton danger onClick={async () => { await deleteSimple(supabase, "fp_results", r.id); refresh(); }}>remove</QuietButton>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
