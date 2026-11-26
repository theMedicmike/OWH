"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { buildPage, createPageVersion, lintPage, NOT_SET_UP, TIER_LABEL, type LintProblem, type PageData, type PageRow } from "@/lib/firstPage";
import SavePdfButton from "./SavePdfButton";
import ReadAloud from "./ReadAloud";

// The print route. Side 1 and side 2 of the Service Health Summary v1, in the
// fixed order, on US Letter. The page prints only when the lint passes. Each
// print is saved as a version with exactly what was printed.
//
// No AppShell here: the sidebar and header must not print, and the sheet must
// be exactly 8.5 by 11 inches.

export const PRINT_CSS = `
@page { size: Letter; margin: 0; }
.shs-wrap { background: #e9edf2; padding: 24px 0; }
.side { width: 8.5in; min-height: 11in; margin: 0 auto 24px; box-sizing: border-box; padding: 0.4in 0.46in 0.36in 0.46in; display: flex; flex-direction: column; gap: 8px; background: #ffffff; color: #000000; font-family: "Atkinson Hyperlegible", system-ui, -apple-system, "Segoe UI", sans-serif; box-shadow: 0 2px 12px rgba(0,0,0,0.12); page-break-after: always; break-after: page; }
.side:last-child { page-break-after: auto; break-after: auto; }
.side.one { font-size: 13.5px; line-height: 1.3; }
.side.two { font-size: 12.5px; line-height: 1.28; }
.side h2 { margin: 0; font-size: 15px; font-weight: 700; color: #16314f; }
.sheethd { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; border-bottom: 2px solid #16314f; padding-bottom: 6px; }
.sheethd .t { font-family: var(--font-source-serif), Georgia, serif; font-weight: 600; font-size: 26px; line-height: 1; letter-spacing: -0.01em; color: #15212e; }
.sheethd .what { font-size: 12px; color: #444444; margin-top: 4px; }
.sheethd .meta { text-align: right; font-size: 12px; color: #444444; line-height: 1.4; white-space: nowrap; }
.sheethd .meta b { display: block; color: #b22234; font-size: 13px; }
.chain { display: flex; flex-direction: column; padding-top: 2px; }
.chain .c { position: relative; padding: 0 0 9px 20px; }
.chain .c::before { content: ""; position: absolute; left: 5px; top: 10px; bottom: -8px; width: 2px; background: #b22234; }
.chain .c:last-child::before { display: none; }
.chain .c::after { content: ""; position: absolute; left: 0; top: 4px; width: 12px; height: 12px; box-sizing: border-box; border-radius: 50%; background: #ffffff; border: 2.5px solid #b22234; }
.chain .c strong { display: block; font-family: var(--font-source-serif), Georgia, serif; font-weight: 600; font-size: 15.5px; line-height: 1.15; }
.chain .c small { display: block; font-size: 11.5px; color: #444444; }
.side.two h2 { font-size: 14.5px; }
.side table { border-collapse: collapse; width: 100%; }
.side th { font-weight: 700; text-align: left; font-size: 12px; color: #444444; border-bottom: 1.5px solid #000000; padding: 2px 6px 3px 0; vertical-align: bottom; }
.side td { border-bottom: 1px solid #b8b8b8; padding: 3px 6px 3px 0; vertical-align: top; }
.side.two td { padding: 2px 6px 2px 0; }
.side td.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.side td.src { white-space: nowrap; color: #595959; font-size: 12px; padding-right: 0; }
.side th.right { text-align: right; }
.tag { display: inline-block; border: 1px solid #767676; border-radius: 3px; padding: 0 4px; font-size: 11.5px; line-height: 16px; color: #333333; vertical-align: middle; margin-left: 3px; }
.rule { border: 0; border-top: 1px solid #000000; margin: 0; }
.topline { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; }
.topline .what { font-size: 12px; color: #444444; }
.hdr { display: grid; grid-template-columns: 1.35fr 1fr 1.1fr; gap: 12px; align-items: stretch; }
.name { font-size: 24px; font-weight: 700; line-height: 1.1; }
.box { border: 1px solid #000000; border-radius: 4px; padding: 6px 9px; display: flex; flex-direction: column; gap: 2px; }
.box.allergy { border: 2px solid #8b1e1e; }
.box .lbl { font-weight: 700; }
.box.allergy .lbl { color: #8b1e1e; }
.readfirst { border-left: 3px solid #16314f; padding: 4px 2px 4px 12px; display: flex; flex-direction: column; gap: 4px; }
.readfirst .lbl { font-size: 12px; font-weight: 700; color: #16314f; }
.readfirst .words { font-family: var(--font-source-serif), Georgia, serif; font-style: italic; font-size: 18px; line-height: 1.3; color: #15212e; }
.returnline { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; border: 1px solid #000000; border-radius: 4px; padding: 4px 9px; }
.small { font-size: 12px; color: #444444; }
.grid2 { display: grid; grid-template-columns: 1.22fr 1fr; gap: 18px; flex-grow: 1; min-height: 0; align-content: start; }
.side.two .grid2 { grid-template-columns: 1.15fr 1fr; }
.col { display: flex; flex-direction: column; gap: 10px; }
.sec { display: flex; flex-direction: column; gap: 5px; }
.foot { display: flex; justify-content: space-between; gap: 20px; font-size: 12px; color: #333333; line-height: 1.3; }
.foot .right { flex: 0 0 290px; text-align: right; }
.sources { display: grid; grid-template-columns: 1fr 1fr; gap: 1px 20px; font-size: 12px; line-height: 1.28; }
.writeline { height: 20px; border-bottom: 1px dotted #767676; }
.grow { flex-grow: 1; min-height: 40px; }
@media print {
  .shs-wrap { background: #ffffff; padding: 0; }
  .side { margin: 0; box-shadow: none; }
  .no-print { display: none !important; }
}
`;

const tag = (t: PageRow["tier"]) => <span className="tag">{TIER_LABEL[t]}</span>;
const src = (r: PageRow) => <td className="src">{r.sourceNumber != null ? `${r.sourceNumber} ${TIER_LABEL[r.tier]}` : TIER_LABEL[r.tier]}</td>;
const shown = (rows: PageRow[]) => rows.filter((r) => r.show);

export function Side1({ p }: { p: PageData }) {
  return (
    <section className="side one">
      <div className="sheethd">
        <div>
          <div className="t">The First Page</div>
          <div className="what">Service Health Summary, side 1 of 2. Fixed format v1. Page made {p.versionDate}{p.assembledBy ? ` by helper ${p.assembledBy}` : ""}, signed by the veteran.</div>
        </div>
        <div className="meta"><b>Bring to every visit</b>Updated {p.versionDate}</div>
      </div>
      <div className="hdr">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div className="name">{p.name}</div>
          <div>{p.line1}</div>
          <div>{p.line2}</div>
        </div>
        <div className="box allergy">
          <div className="lbl">Allergies</div>
          {shown(p.allergies).map((a) => <div key={a.id}>{a.cells[0]} {tag(a.tier)}</div>)}
        </div>
        <div className="box">
          <div className="lbl">Care partner in the room</div>
          <div>{p.carePartner?.line}</div>
          <div className="small">{p.carePartner?.contact}</div>
        </div>
      </div>
      <div className="readfirst">
        <div className="lbl">Read this first. In my own words. I chose these lines.</div>
        <div className="words">{p.readFirst.join(" ")}</div>
      </div>
      <div className="returnline">
        <div><b>Return your note to:</b> {p.returnNoteTo}</div>
        <div className="small" style={{ whiteSpace: "nowrap" }}>Rows the veteran chose not to show are left off.</div>
      </div>
      <div className="grid2">
        <div className="col">
          <div className="sec">
            <h2>Problems, active first</h2>
            <table><thead><tr><th>Problem</th><th>Onset</th><th>Diagnosed by</th><th>Status</th><th className="right">Source</th></tr></thead>
              <tbody>{shown(p.problems).map((r) => <tr key={r.id}><td>{r.cells[0]}</td><td className="num">{r.cells[1]}</td><td>{r.cells[2]}</td><td>{r.cells[3]}</td>{src(r)}</tr>)}</tbody></table>
          </div>
          <div className="sec">
            <h2>Medications, copied word for word from the pharmacy printout</h2>
            <div className="small" style={{ marginTop: -3 }}>{p.medicationsAsOf ? `As of ${p.medicationsAsOf}. ` : ""}Verify with the pharmacy. Printout is in the folder.</div>
            <table><thead><tr><th>Medication and directions as printed</th><th>Since</th><th className="right">Source</th></tr></thead>
              <tbody>{shown(p.medications).map((r) => <tr key={r.id}><td>{r.cells[0]}</td><td className="num">{r.cells[1]}</td>{src(r)}</tr>)}</tbody></table>
          </div>
        </div>
        <div className="col">
          <div className="sec">
            <h2>Key studies, reports in the folder</h2>
            <table><tbody>{shown(p.studies).map((r) => <tr key={r.id}><td>{r.cells[0]}</td><td className="num">{r.cells[1]}</td>{src(r)}</tr>)}</tbody></table>
          </div>
          <div className="sec">
            <h2>{p.triedTitle}</h2>
            <table><tbody>{shown(p.tried).map((r) => <tr key={r.id}><td>{r.cells[0]}</td>{src(r)}</tr>)}</tbody></table>
          </div>
          <div className="sec"><h2>Open today</h2><div>{p.openToday}</div></div>
          <div className="box">
            <div className="lbl">My two questions</div>
            {p.questions.map((q, i) => <div key={i}>{i + 1}. {q}</div>)}
          </div>
        </div>
      </div>
      <hr className="rule" />
      <div className="foot">
        <div>From my own records. This is my record, not a diagnosis. Every line names its source and date. Record: a document in the folder. Recalled: the veteran&apos;s memory. Witness: a signed statement. Clinic: a clinician&apos;s note. This page organizes records; it does not interpret them. Corrections go to the helper on side 2; a corrected page is re-issued, never hand-edited.</div>
        <div className="right" style={{ flexBasis: 210 }}>Side 2: service, exposures, results that changed, specimens, what could not be found, sources.</div>
      </div>
    </section>
  );
}

export function Side2({ p }: { p: PageData }) {
  const immunNote = p.sources.some((s) => /service treatment record/i.test(s.label) && s.status === "pending") ? "The service treatment record that would confirm these is requested, not yet received." : "";
  return (
    <section className="side two">
      <div className="sheethd">
        <div>
          <div className="t">The First Page</div>
          <div className="what">Service Health Summary, side 2 of 2. {p.name}{p.born ? `, born ${p.born}` : ""}. Page made {p.versionDate}. The second look: where the veteran served, what was around, what changed, and where each fact came from.</div>
        </div>
        <div className="meta"><b>Bring to every visit</b>Updated {p.versionDate}</div>
      </div>
      <div className="grid2">
        <div className="col">
          <div className="sec">
            <h2>Service history, one line per posting</h2>
            <table><thead><tr><th>Years</th><th>Where and with whom</th><th>Role</th><th className="right">Source</th></tr></thead>
              <tbody>{shown(p.service).map((r) => <tr key={r.id}><td className="num">{r.cells[0]}</td><td>{r.cells[1]}</td><td>{r.cells[2]}</td>{src(r)}</tr>)}</tbody></table>
          </div>
          <div className="sec">
            <h2>Toxic exposure screening, with the where, when and who VA does not record</h2>
            <table><thead><tr><th>Exposure</th><th>Where and when</th><th>Unit</th><th className="right">Source</th></tr></thead>
              <tbody>{shown(p.exposures).map((r) => <tr key={r.id}><td>{r.cells[0]}</td><td>{r.cells[1]}</td><td>{r.cells[2]}</td>{src(r)}</tr>)}</tbody></table>
          </div>
          <div className="sec">
            <h2>Results that changed, two values, two dates, two sources</h2>
            <table><thead><tr><th>Measure</th><th className="right">Earlier</th><th className="right">Later</th><th className="right">Source</th></tr></thead>
              <tbody>{shown(p.results).map((r) => <tr key={r.id}><td>{r.cells[0]}</td><td className="num">{r.cells[1]}</td><td className="num">{r.cells[2]}</td><td className="src">{r.cells[3] || (r.sourceNumber != null ? `${r.sourceNumber} ${TIER_LABEL[r.tier]}` : TIER_LABEL[r.tier])}</td></tr>)}</tbody></table>
            <div className="small">Values are copied as written in the source. Nothing on this page says whether a change matters. That is the clinician&apos;s call.</div>
          </div>
        </div>
        <div className="col">
          {p.chain.length > 0 && (
            <div className="sec">
              <h2>The line between them, in my words and my order</h2>
              <div className="chain">
                {p.chain.map((c, i) => <div key={i} className="c"><strong>{c.word}</strong>{c.detail && <small>{c.detail}</small>}</div>)}
              </div>
            </div>
          )}
          <div className="sec">
            <h2>Immunizations and medications given in service</h2>
            <table><tbody>{shown(p.shots).map((r) => <tr key={r.id}><td>{r.cells[0]}</td><td className="num">{r.cells[1]}</td>{src(r)}</tr>)}</tbody></table>
            {immunNote && <div className="small">{immunNote}</div>}
          </div>
          {p.specimens && <div className="sec"><h2>Stored blood specimens</h2><div>{p.specimens}</div></div>}
          {p.noRecordFoundFor && <div className="sec"><h2>No record found for</h2><div>{p.noRecordFoundFor}</div></div>}
          {p.helpMe && <div className="box"><div className="lbl">How to help me in the room</div><div>{p.helpMe}</div></div>}
          {p.sinceLastVisit && <div className="box"><div className="lbl">Since last visit</div><div>{p.sinceLastVisit}</div></div>}
          <div className="box grow"><div className="lbl">Notes from this visit (optional)</div><div className="writeline" /><div className="writeline" /><div className="writeline" /></div>
        </div>
      </div>
      <div className="sec">
        <h2>Sources, and where each request stands</h2>
        <div className="sources">
          {p.sources.map((s) => <div key={s.id}>{s.number}. {s.label}{s.source_date ? `, ${s.source_date}` : ""}{s.author ? `. ${s.author}` : ""}. {({ received: "Received.", pending: "Pending.", not_requested: "Not yet requested.", not_found: "Not found.", closed: "Closed." })[s.status]}</div>)}
        </div>
      </div>
      <hr className="rule" />
      <div className="foot">
        <div>Signed by the veteran, {p.name}, {p.versionDate}, after every row was read back. {p.assembledBy ? `Assembled by ${p.assembledBy}. ` : ""}Originals are in the veteran&apos;s folder and are one request away.</div>
        <div className="right">Service Health Summary v1, public domain. Page version {p.versionDate}.{p.correctionsTo ? ` Corrections to ${p.correctionsTo}.` : ""} Format steward: Operation Whole Health, until a public body takes it over. The steward certifies nothing.</div>
      </div>
    </section>
  );
}

export default function FirstPagePrint() {
  const params = useSearchParams();
  const visitId = params.get("visit");
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<PageData | null>(null);
  const [lint, setLint] = useState<LintProblem[]>([]);
  const [error, setError] = useState("");
  const [signed, setSigned] = useState(false);
  const [assembledBy, setAssembledBy] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedVersion, setSavedVersion] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user ?? null);
      if (!data.user) return;
      const r = await buildPage(supabase, visitId);
      if (!r.ok) { setError(r.error); return; }
      setPage(r.data);
      setAssembledBy(r.data.assembledBy);
      setLint(lintPage(r.data));
    });
  }, [supabase, visitId]);

  async function print() {
    if (!page) return;
    setSaving(true);
    const data = { ...page, assembledBy: assembledBy.trim() };
    const r = await createPageVersion(supabase, { visit_id: page.visit?.id ?? null, assembled_by: data.assembledBy || null, signed, corrections_to: data.correctionsTo || null, snapshot: data });
    setSaving(false);
    if (!r.ok) { setError(r.error); return; }
    setSavedVersion(r.data.version_date);
    setPage(data);
    setTimeout(() => window.print(), 150);
  }

  const ok = page && lint.length === 0;

  return (
    <div className="min-h-screen bg-canvas">
      <style>{PRINT_CSS}</style>
      <div className="no-print sticky top-0 z-10 border-b border-line bg-white/95 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/first-page" className="inline-flex min-h-11 items-center text-[0.875rem] font-medium text-brand hover:underline">Back to your First Page</Link>
            <div className="text-[0.9375rem] font-semibold text-ink">Preview and print{page?.visit?.specialist ? `: ${page.visit.specialist}` : ""}</div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-[0.875rem] text-ink"><span className="font-semibold">Assembled by</span><input value={assembledBy} onChange={(e) => setAssembledBy(e.target.value)} className="min-h-11 rounded-lg border border-line px-3 text-[0.9375rem]" placeholder="name" /></label>
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2.5 text-[0.875rem] text-ink"><input type="checkbox" checked={signed} onChange={(e) => setSigned(e.target.checked)} className="h-6 w-6 flex-none accent-brand" />Every row was read back to the veteran and he signs this page</label>
            <button type="button" onClick={print} disabled={!ok || saving} className="btn btn-flag min-h-11">{saving ? "Saving…" : "Print"}</button>
          </div>
        </div>
        {/* No printer: the same page as a PDF, on the phone screen, or read aloud. Same gate as the print. */}
        <div className="mx-auto mt-2 flex max-w-4xl flex-wrap items-center gap-2">
          {ok && <SavePdfButton page={page} className="btn btn-outline min-h-11" />}
          {ok && <Link href={`/first-page/phone${visitId ? `?visit=${visitId}` : ""}`} className="btn btn-outline min-h-11">Show on my phone</Link>}
          <ReadAloud page={page} />
        </div>
        {savedVersion && <p className="mx-auto mt-1 max-w-4xl text-[0.875rem] text-success">Saved as version {savedVersion}. Print two-sided at full size, no scaling, no browser headers or footers.</p>}
      </div>

      <div className="mx-auto max-w-4xl px-5 py-4">
        {!user && <p className="text-sm text-muted">Sign in to see your page.</p>}
        {error === NOT_SET_UP && <p className="rounded-xl border border-warn/40 bg-warn-soft p-4 text-sm text-ink">This section isn&apos;t switched on yet; the database update for the First Page has not been applied.</p>}
        {error && error !== NOT_SET_UP && <p className="rounded-xl border border-scarlet/40 bg-scarlet/5 p-4 text-sm text-scarlet">{error}</p>}
        {page && lint.length > 0 && (
          <div className="no-print mb-4 rounded-xl border border-warn/40 bg-warn-soft p-4">
            <div className="text-[0.9375rem] font-semibold text-ink">Not ready to print. Fix these first:</div>
            <ul className="mt-2 space-y-1">{lint.map((l, i) => <li key={i} className="text-[0.875rem] leading-relaxed text-ink"><span className="font-semibold">{l.where}</span> {l.what}</li>)}</ul>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link href="/first-page/rows" className="btn btn-secondary btn-sm min-h-11">Rows</Link>
              <Link href="/first-page/sources" className="btn btn-secondary btn-sm min-h-11">Sources</Link>
              <Link href="/first-page/profile" className="btn btn-secondary btn-sm min-h-11">Profile</Link>
              <Link href="/first-page/visit" className="btn btn-secondary btn-sm min-h-11">Visit</Link>
            </div>
            <p className="mt-2 text-[0.875rem] text-muted">The preview below shows the page as it stands, with the gaps.</p>
          </div>
        )}
      </div>

      {page && (
        <div className="shs-wrap">
          <Side1 p={page} />
          <Side2 p={page} />
        </div>
      )}
    </div>
  );
}
