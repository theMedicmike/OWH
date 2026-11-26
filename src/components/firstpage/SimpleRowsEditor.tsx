"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../AuthProvider";
import {
  deleteSimple, insertSimple, listSimple, listSources, updateSimple, TIER_LABEL,
  type FpSource, type SimpleTable, type Tier,
} from "@/lib/firstPage";
import { listMedications } from "@/lib/medications";
import { KeptNotice, useDraft, useUndo } from "../Keep";
import { BackToHub, CardTitle, Input, Notice, PrimaryButton, QuickPicks, QuietButton, SourceSelect, Stance, TextField, TierSelect, Toggle } from "./Controls";

// One editor for the three single-line tables: allergies, key studies, what
// has been tried. Each row is a sentence copied from a document (or the
// veteran's own memory, marked so), with a source and a tier.
//
// Quick picks only start the sentence: a drug name, a kind of study, a
// medicine already on Your medications. They never fill in a date, a reaction,
// a result or a source; the veteran writes those. The one exception is the
// one-tap "No known drug allergies.", which is a whole answer on its own and
// is offered only while the list is empty.

type Kind = "allergies" | "studies" | "tried";
type Row = { id: string; text: string; study_date?: string; tier: Tier; source_id: string | null; show: boolean };

const NKDA = "No known drug allergies.";

const CONFIG: Record<Kind, {
  table: SimpleTable; title: string; help: string; placeholder: string; dateField: boolean; defaultTier: Tier;
  picksLabel: string; picks: string[]; joiner: string;
}> = {
  allergies: {
    table: "fp_allergies",
    title: "Allergies",
    help: "Drug allergies and what happened, with the year if you know it. If there are none, say so; the box on the front of the page is never left blank.",
    placeholder: "e.g. Penicillin: rash, 1970.",
    dateField: false,
    defaultTier: "recalled",
    picksLabel: "Start with the drug",
    picks: ["Penicillin", "Sulfa drugs", "Codeine", "Aspirin", "Ibuprofen", "Contrast dye"],
    joiner: ": ",
  },
  studies: {
    table: "fp_studies",
    title: "Key studies",
    help: "Imaging, sleep studies, hearing tests, nerve studies. Say what it was, where, and whether the report is in the folder. The date is the date on the report.",
    placeholder: "e.g. MRI brain without contrast, community imaging center. Report and disc in hand.",
    dateField: true,
    defaultTier: "record",
    picksLabel: "What kind of study?",
    picks: ["MRI", "CT scan", "X-ray", "Ultrasound", "Sleep study", "Hearing test (audiogram)", "Nerve study (EMG)", "EEG"],
    joiner: " ",
  },
  tried: {
    table: "fp_tried",
    title: "What has been tried",
    help: "Medicines and therapies tried before, the years, and why each stopped, in plain words. Put the year inside the sentence.",
    placeholder: "e.g. Amitriptyline 2019 to 2021, stopped for morning grogginess.",
    dateField: false,
    defaultTier: "record",
    picksLabel: "Start with a therapy",
    picks: ["Physical therapy", "Talk therapy", "Acupuncture", "Chiropractic care"],
    joiner: " ",
  },
};

export default function SimpleRowsEditor({ kind }: { kind: Kind }) {
  const cfg = CONFIG[kind];
  const { supabase, user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [sources, setSources] = useState<FpSource[]>([]);
  const [medNames, setMedNames] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [date, setDate] = useState("");
  const [tier, setTier] = useState<Tier>(cfg.defaultTier);
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const { offer } = useUndo();
  const [hidden, setHidden] = useState<string[]>([]);
  const [kept, setKept] = useState(false);
  const draft = useDraft<{ text: string; date: string; tier: Tier; sourceId: string | null }>(`fp-${kind}-add`);
  const restoredRef = useRef(false);

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

  // "What has been tried" can start from a medicine already on Your
  // medications: the name only, never its years.
  useEffect(() => {
    if (!user || kind !== "tried") return;
    let alive = true;
    listMedications(supabase).then((res) => {
      if (!alive || !("medications" in res)) return;
      setMedNames(Array.from(new Set(res.medications.map((m) => m.name.trim()).filter(Boolean))));
    });
    return () => { alive = false; };
  }, [user, supabase, kind]);

  function pick(p: string) {
    setText((t) => (t.trim() ? t : `${p}${cfg.joiner}`));
    setAdded(false);
    requestAnimationFrame(() => {
      const el = textRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    });
  }

  async function insert(lineText: string, lineTier: Tier, lineSource: string | null, lineDate: string) {
    setBusy(true);
    setError("");
    const row: Record<string, unknown> = { text: lineText, tier: lineTier, source_id: lineSource, show: true, sort: rows.length };
    if (cfg.dateField) row.study_date = lineDate;
    const r = await insertSimple<Row>(supabase, cfg.table, row);
    setBusy(false);
    if (!r.ok) { setError(r.error); return false; }
    setAdded(true);
    refresh();
    return true;
  }

  async function add() {
    const ok = await insert(text.trim(), tier, sourceId, date.trim());
    if (ok) { setText(""); setDate(""); }
  }

  async function patch(id: string, p: Record<string, unknown>) {
    const r = await updateSimple(supabase, cfg.table, id, p);
    if (!r.ok) setError(r.error);
    refresh();
  }

  // Remove is held behind the Undo bar and carried out when the bar closes.
  function remove(r: Row) {
    setHidden((h) => [...h, r.id]);
    offer({
      message: `Removed: ${r.text.length > 40 ? `${r.text.slice(0, 40)}…` : r.text}`,
      commit: async () => { await deleteSimple(supabase, cfg.table, r.id); setHidden((h) => h.filter((x) => x !== r.id)); refresh(); },
      undo: () => setHidden((h) => h.filter((x) => x !== r.id)),
    });
  }

  // The add form keeps a copy on this device until the line is added.
  useEffect(() => {
    if (!draft.ready || restoredRef.current) return;
    restoredRef.current = true;
    const local = draft.read();
    if (local && (local.text || local.date)) {
      queueMicrotask(() => { setText(local.text); setDate(local.date); setTier(local.tier); setSourceId(local.sourceId); setKept(true); });
    }
  }, [draft]);
  useEffect(() => {
    if (!restoredRef.current) return;
    if (text || date) draft.write({ text, date, tier, sourceId });
    else draft.clear();
  }, [text, date, tier, sourceId, draft]);

  if (!user) return <Notice>Sign in to build your First Page.</Notice>;
  const canAdd = text.trim().length > 1 && (!cfg.dateField || date.trim().length >= 4);
  const picks = kind === "tried" ? [...medNames, ...cfg.picks] : cfg.picks;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <BackToHub />
      <Stance />
      <Notice error={error} />
      <KeptNotice show={kept} />

      {kind === "allergies" && rows.length === 0 && (
        <section className="card card-raise p-5 sm:p-6">
          <CardTitle lede="If no drug has ever given you a reaction, one tap fills the box on the front of the page.">
            No drug allergies?
          </CardTitle>
          <button
            type="button"
            onClick={() => insert(NKDA, "recalled", null, "")}
            disabled={busy}
            className="btn btn-primary btn-lg mt-4 w-full sm:w-auto"
          >
            No known drug allergies
          </button>
          <p className="mt-2 text-sm text-muted">Saved as something you know yourself. You can add a source to it afterward.</p>
        </section>
      )}

      <section className="card p-5 sm:p-6">
        <CardTitle lede={cfg.help}>{kind === "allergies" ? "Add an allergy" : "Add a line"}</CardTitle>
        <div className="mt-5 space-y-5">
          <QuickPicks
            label={kind === "tried" && medNames.length > 0 ? "Start with a medicine from your list, or a therapy" : cfg.picksLabel}
            picks={picks}
            onPick={pick}
          />
          <TextField
            label="The line, as the document says it"
            inputRef={textRef}
            value={text}
            onChange={(v) => { setText(v); setAdded(false); }}
            rows={2}
            placeholder={cfg.placeholder}
          />
          {cfg.dateField && <Input label="Date on the report" value={date} onChange={setDate} placeholder="e.g. 2019-06-03" />}
          <TierSelect value={tier} onChange={setTier} />
          <SourceSelect sources={sources} value={sourceId} onChange={setSourceId} />
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <PrimaryButton large onClick={add} disabled={busy || !canAdd}>{busy ? "Saving…" : "Add to the page"}</PrimaryButton>
          {added && <span role="status" className="text-[0.9375rem] font-semibold text-success">Added.</span>}
        </div>
        {cfg.dateField && text.trim().length > 1 && date.trim().length < 4 && (
          <p className="mt-2 text-sm text-muted">Add the date on the report to save it.</p>
        )}
      </section>

      <section className="card p-5 sm:p-6">
        <CardTitle>{cfg.title} on the page</CardTitle>
        {rows.length === 0 ? (
          <p className="mt-2 text-[0.9375rem] text-muted">Nothing yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {rows.filter((r) => !hidden.includes(r.id)).map((r) => (
              <li key={r.id} className="space-y-3 py-4">
                <p className="text-[0.9375rem] leading-relaxed text-ink">
                  {r.text}{r.study_date ? ` (${r.study_date})` : ""}
                  <span className="ml-2 inline-block rounded-md border border-line px-2 py-0.5 text-sm text-muted">{TIER_LABEL[r.tier]}</span>
                </p>
                <SourceSelect
                  sources={sources}
                  value={r.source_id}
                  onChange={(id) => {
                    const before = { source_id: r.source_id, tier: r.tier };
                    patch(r.id, { source_id: id, tier: id ? "record" : r.tier });
                    offer({ message: "Source changed.", commit: () => {}, undo: () => patch(r.id, before) });
                  }}
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Toggle checked={r.show} onChange={(v) => patch(r.id, { show: v })} label="Print this line" />
                  <QuietButton danger onClick={() => remove(r)}>Remove</QuietButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
