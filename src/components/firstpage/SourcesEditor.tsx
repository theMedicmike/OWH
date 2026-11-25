"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../AuthProvider";
import { createSource, deleteSource, listSources, updateSource, SOURCE_STATUS_LABEL, type FpSource, type SourceStatus } from "@/lib/firstPage";
import { BackToHub, Input, Notice, PrimaryButton, QuietButton, Stance, StatusSelect } from "./Controls";

// The source registry: one numbered line per document behind the page.
// A row on the page is only as good as the number it points at.

const SUGGESTIONS: { label: string; author: string }[] = [
  { label: "VA medical record, Blue Button download", author: "VA" },
  { label: "Pharmacy printout", author: "" },
  { label: "DD-214, photographed", author: "" },
  { label: "Recorded statement, transcript in the folder", author: "" },
  { label: "Witness statement", author: "" },
  { label: "Service treatment record, SF 180 to the National Personnel Records Center", author: "NPRC" },
  { label: "Serum Repository draw dates", author: "Department of War (formerly DoD)" },
  { label: "Exposure record (ILER)", author: "Department of War (formerly DoD)" },
  { label: "VA electronic sharing with outside providers, checked", author: "VA" },
];

export default function SourcesEditor() {
  const { supabase, user } = useAuth();
  const [rows, setRows] = useState<FpSource[]>([]);
  const [error, setError] = useState("");
  const [label, setLabel] = useState("");
  const [date, setDate] = useState("");
  const [author, setAuthor] = useState("");
  const [status, setStatus] = useState<SourceStatus>("received");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const r = await listSources(supabase);
    if (!r.ok) { setError(r.error); return; }
    setRows(r.data);
  }, [supabase]);
  useEffect(() => {
    if (!user) return;
    (async () => { await refresh(); })();
  }, [user, refresh]);

  async function add() {
    if (!user) return;
    setBusy(true);
    setError("");
    let documentPath: string | null = null;
    if (file) {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const up = await supabase.storage.from("records").upload(path, file);
      if (up.error) { setError(up.error.message); setBusy(false); return; }
      documentPath = path;
    }
    const r = await createSource(supabase, { label, source_date: date, author, status, document_path: documentPath });
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    setLabel(""); setDate(""); setAuthor(""); setStatus("received"); setFile(null);
    refresh();
  }

  async function setRowStatus(s: FpSource, st: SourceStatus) {
    await updateSource(supabase, s.id, { status: st });
    refresh();
  }

  if (!user) return <Notice>Sign in to build your First Page.</Notice>;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <BackToHub />
      <Stance />
      <Notice error={error} />

      <div className="card p-5">
        <div className="text-sm font-semibold text-ink">Add a document</div>
        <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted">
          Each one gets a number. Rows on the page point at that number. Write the date as it appears on the document,
          and say where the request stands if it has not arrived.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button key={s.label} type="button" onClick={() => { setLabel(s.label); if (s.author) setAuthor(s.author); }} className="rounded-full border border-line px-2.5 py-1 text-[0.8125rem] text-muted hover:border-brand hover:text-brand">
              {s.label}
            </button>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Input label="What it is" value={label} onChange={setLabel} placeholder="e.g. Pharmacy printout" /></div>
          <Input label="Date on it, or when it was requested" value={date} onChange={setDate} placeholder="e.g. 2026-11-02 or sent 2026-10-12" />
          <Input label="Who wrote it" value={author} onChange={setAuthor} placeholder="e.g. VA, the pharmacy, Carol Pruitt, daughter" />
          <StatusSelect value={status} onChange={setStatus} />
          <div>
            <label className="mb-1 block text-[0.8125rem] font-semibold text-muted">The file, if you have it (optional)</label>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-[0.8125rem] text-muted" />
            <p className="mt-1 text-[0.8125rem] text-faint">Stored privately in your records. Cover any Social Security number before you photograph a page.</p>
          </div>
        </div>
        <div className="mt-3"><PrimaryButton onClick={add} disabled={busy || !label.trim()}>{busy ? "Saving…" : "Add to the list"}</PrimaryButton></div>
      </div>

      <div className="card p-5">
        <div className="text-sm font-semibold text-ink">Your sources</div>
        {rows.length === 0 ? (
          <p className="mt-1 text-[0.8125rem] text-faint">Nothing yet. The DD-214, the VA download and the pharmacy printout are the usual first three.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {rows.map((s) => (
              <li key={s.id} className="flex flex-wrap items-start justify-between gap-2 py-2">
                <div className="text-sm text-ink">
                  <span className="font-semibold">{s.number}.</span> {s.label}{s.source_date ? `, ${s.source_date}` : ""}{s.author ? `. ${s.author}.` : ""}
                  <span className="ml-2 rounded-full border border-line px-2 py-0.5 text-[0.8125rem] text-muted">{SOURCE_STATUS_LABEL[s.status]}</span>
                  {s.document_path && <span className="ml-2 text-[0.8125rem] text-success">file attached</span>}
                </div>
                <div className="flex items-center gap-2">
                  <select value={s.status} onChange={(e) => setRowStatus(s, e.target.value as SourceStatus)} className="rounded-md border border-line bg-white px-2 py-1 text-[0.8125rem] text-ink">
                    {(Object.keys(SOURCE_STATUS_LABEL) as SourceStatus[]).map((st) => <option key={st} value={st}>{SOURCE_STATUS_LABEL[st]}</option>)}
                  </select>
                  <QuietButton danger onClick={async () => { await deleteSource(supabase, s.id); refresh(); }}>remove</QuietButton>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[0.8125rem] leading-relaxed text-faint">
          A request that has not come back still belongs on the list. The page prints it under &quot;No record found for&quot;
          so the doctor sees the gap instead of guessing.
        </p>
      </div>
    </div>
  );
}
