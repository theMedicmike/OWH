"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../AuthProvider";
import {
  deleteSimple, insertSimple, listSimple, listSources, updateSimple, TIER_LABEL,
  type FpSource, type SimpleTable, type Tier,
} from "@/lib/firstPage";
import { BackToHub, Input, Notice, PrimaryButton, QuietButton, SourceSelect, Stance, TextField, TierSelect, Toggle } from "./Controls";

// One editor for the three single-line tables: allergies, key studies, what
// has been tried. Each row is a sentence copied from a document (or the
// veteran's own memory, marked so), with a source and a tier.

type Kind = "allergies" | "studies" | "tried";
type Row = { id: string; text: string; study_date?: string; tier: Tier; source_id: string | null; show: boolean };

const CONFIG: Record<Kind, { table: SimpleTable; title: string; help: string; placeholder: string; dateField: boolean; defaultTier: Tier; examples: string[] }> = {
  allergies: {
    table: "fp_allergies",
    title: "Allergies",
    help: "Drug allergies and what happened, with the year if you know it. If there are none, say so; the box on the front of the page is never left blank.",
    placeholder: "e.g. Penicillin: rash, 1970.",
    dateField: false,
    defaultTier: "recalled",
    examples: ["No known drug allergies.", "Sulfa drugs: hives, 2007."],
  },
  studies: {
    table: "fp_studies",
    title: "Key studies",
    help: "Imaging, sleep studies, hearing tests, nerve studies. Say what it was, where, and whether the report is in the folder. The date is the date on the report.",
    placeholder: "e.g. MRI brain without contrast, community imaging center. Report and disc in hand.",
    dateField: true,
    defaultTier: "record",
    examples: [],
  },
  tried: {
    table: "fp_tried",
    title: "What has been tried",
    help: "Medicines and therapies tried before, the years, and why each stopped, in plain words. Put the year inside the sentence.",
    placeholder: "e.g. Amitriptyline 2019 to 2021, stopped for morning grogginess.",
    dateField: false,
    defaultTier: "record",
    examples: [],
  },
};

export default function SimpleRowsEditor({ kind }: { kind: Kind }) {
  const cfg = CONFIG[kind];
  const { supabase, user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [sources, setSources] = useState<FpSource[]>([]);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [date, setDate] = useState("");
  const [tier, setTier] = useState<Tier>(cfg.defaultTier);
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const [r, s] = await Promise.all([listSimple<Row>(supabase, cfg.table), listSources(supabase)]);
    if (!r.ok) { setError(r.error); return; }
    setRows(r.data);
    if (s.ok) setSources(s.data);
  }, [supabase, cfg.table]);
  useEffect(() => {
    if (!user) return;
    (async () => { await refresh(); })();
  }, [user, refresh]);

  async function add() {
    setBusy(true);
    setError("");
    const row: Record<string, unknown> = { text: text.trim(), tier, source_id: sourceId, show: true, sort: rows.length };
    if (cfg.dateField) row.study_date = date.trim();
    const r = await insertSimple<Row>(supabase, cfg.table, row);
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    setText(""); setDate("");
    refresh();
  }

  async function patch(id: string, p: Record<string, unknown>) {
    const r = await updateSimple(supabase, cfg.table, id, p);
    if (!r.ok) setError(r.error);
    refresh();
  }

  if (!user) return <Notice>Sign in to build your First Page.</Notice>;
  const canAdd = text.trim().length > 1 && (!cfg.dateField || date.trim().length >= 4);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <BackToHub />
      <Stance />
      <Notice error={error} />

      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="text-sm font-semibold text-ink">Add a line</div>
        <p className="mt-1 text-xs leading-relaxed text-muted">{cfg.help}</p>
        {cfg.examples.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {cfg.examples.map((e) => <button key={e} type="button" onClick={() => setText(e)} className="rounded-full border border-line px-2.5 py-1 text-xs text-muted hover:border-brand hover:text-brand">{e}</button>)}
          </div>
        )}
        <div className="mt-3 space-y-3">
          <TextField label="The line, as the document says it" value={text} onChange={setText} rows={2} placeholder={cfg.placeholder} />
          <div className="grid gap-3 sm:grid-cols-2">
            {cfg.dateField && <Input label="Date on the report" value={date} onChange={setDate} placeholder="e.g. 2019-06-03" />}
            <TierSelect value={tier} onChange={setTier} />
            <SourceSelect sources={sources} value={sourceId} onChange={setSourceId} />
          </div>
        </div>
        <div className="mt-3"><PrimaryButton onClick={add} disabled={busy || !canAdd}>{busy ? "Saving…" : "Add"}</PrimaryButton></div>
      </div>

      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="text-sm font-semibold text-ink">{cfg.title} on the page</div>
        {rows.length === 0 ? (
          <p className="mt-1 text-xs text-faint">Nothing yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {rows.map((r) => (
              <li key={r.id} className="space-y-2 py-3">
                <div className="text-sm text-ink">
                  {r.text}{r.study_date ? ` (${r.study_date})` : ""}
                  <span className="ml-2 rounded border border-line px-1.5 py-0.5 text-[11px] text-muted">{TIER_LABEL[r.tier]}</span>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-[220px] flex-1"><SourceSelect sources={sources} value={r.source_id} onChange={(id) => patch(r.id, { source_id: id, tier: id ? "record" : r.tier })} /></div>
                  <Toggle checked={r.show} onChange={(v) => patch(r.id, { show: v })} label="Print this line" />
                  <QuietButton danger onClick={async () => { await deleteSimple(supabase, cfg.table, r.id); refresh(); }}>remove</QuietButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
