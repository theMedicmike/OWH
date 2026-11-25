"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../AuthProvider";
import { createSource, deleteSource, listSources, updateSource, SOURCE_STATUS_LABEL, type FpSource, type SourceStatus } from "@/lib/firstPage";
import { BackToHub, CardTitle, Input, Notice, PrimaryButton, QuietButton, Stance, StatusSelect } from "./Controls";

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
  const [added, setAdded] = useState(false);
  const [changing, setChanging] = useState<string | null>(null);

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
    setAdded(true);
    refresh();
  }

  async function setRowStatus(s: FpSource, st: SourceStatus) {
    await updateSource(supabase, s.id, { status: st });
    setChanging(null);
    refresh();
  }

  if (!user) return <Notice>Sign in to build your First Page.</Notice>;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <BackToHub />
      <Stance />
      <Notice error={error} />

      <section className="card p-5 sm:p-6">
        <CardTitle lede="Each one gets a number. Rows on the page point at that number. Write the date as it appears on the document, and say where the request stands if it has not arrived.">
          Add a document
        </CardTitle>

        <div className="mt-5">
          <p className="field-label">Tap one to fill it in</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SUGGESTIONS.map((s) => {
              const on = label === s.label;
              return (
                <button
                  key={s.label}
                  type="button"
                  aria-pressed={on}
                  onClick={() => { setLabel(s.label); if (s.author) setAuthor(s.author); setAdded(false); }}
                  className={`btn h-auto min-h-12 w-full justify-start text-left ${on ? "btn-primary" : "btn-secondary"}`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 space-y-5">
          <Input label="What it is" value={label} onChange={(v) => { setLabel(v); setAdded(false); }} placeholder="e.g. Pharmacy printout" />
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Date on it, or when it was requested" value={date} onChange={setDate} placeholder="e.g. 2026-11-02 or sent 2026-10-12" />
            <Input label="Who wrote it" value={author} onChange={setAuthor} placeholder="e.g. VA, the pharmacy, Carol Pruitt, daughter" />
          </div>
          <StatusSelect value={status} onChange={setStatus} />
          <div>
            <label htmlFor="source-file" className="field-label">The file, if you have it (optional)</label>
            <input
              id="source-file"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-[0.9375rem] text-muted file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-xl file:border file:border-solid file:border-line file:bg-surface file:px-4 file:text-[0.9375rem] file:font-semibold file:text-ink hover:file:bg-canvas"
            />
            <p className="mt-1.5 text-sm text-muted">Stored privately in your records. Cover any Social Security number before you photograph a page.</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <PrimaryButton large onClick={add} disabled={busy || !label.trim()}>{busy ? "Saving…" : "Add to the list"}</PrimaryButton>
          {added && <span role="status" className="text-[0.9375rem] font-semibold text-success">Added.</span>}
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <CardTitle>Your sources</CardTitle>
        {rows.length === 0 ? (
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">Nothing yet. The DD-214, the VA download and the pharmacy printout are the usual first three.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {rows.map((s) => (
              <li key={s.id} className="space-y-3 py-4">
                <p className="text-[0.9375rem] leading-relaxed text-ink">
                  <span className="tnum font-semibold">{s.number}.</span> {s.label}{s.source_date ? `, ${s.source_date}` : ""}{s.author ? `. ${s.author}.` : ""}
                </p>
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-full border border-line px-2.5 py-0.5 text-muted">{SOURCE_STATUS_LABEL[s.status]}</span>
                  {s.document_path && <span className="font-semibold text-success">File attached</span>}
                </p>
                {changing === s.id ? (
                  <div className="space-y-2">
                    <StatusSelect label="Tap where it stands now" value={s.status} onChange={(st) => setRowStatus(s, st)} />
                    <QuietButton onClick={() => setChanging(null)}>Cancel</QuietButton>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <QuietButton onClick={() => setChanging(s.id)}>Change where it stands</QuietButton>
                    <QuietButton danger onClick={async () => { await deleteSource(supabase, s.id); refresh(); }}>Remove</QuietButton>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-sm leading-relaxed text-muted">
          A request that has not come back still belongs on the list. The page prints it under &quot;No record found for&quot;
          so the doctor sees the gap instead of guessing.
        </p>
      </section>
    </div>
  );
}
