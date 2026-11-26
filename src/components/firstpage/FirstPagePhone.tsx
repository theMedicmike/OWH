"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../AuthProvider";
import { buildPage, lintPage, NOT_SET_UP, TIER_LABEL, type LintProblem, type PageData, type PageRow } from "@/lib/firstPage";
import { Notice } from "./Controls";

// "Show on my phone": the page for a veteran with no printer. The same content
// in the same order as the two printed sides, in one tall column of large type
// on a light background, so he can hold the phone up in the room or hand it
// across the desk. Nothing on the sheet is a link. The same lint that gates
// the print gates this: what the doctor reads is copied, never concluded.

const shown = (rows: PageRow[]) => rows.filter((r) => r.show);
const srcOf = (r: PageRow) => (r.sourceNumber != null ? `Source ${r.sourceNumber}, ${TIER_LABEL[r.tier].toLowerCase()}` : TIER_LABEL[r.tier]);

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-4">
      <h2 className="text-[1.0625rem] font-semibold leading-snug text-brand">{title}</h2>
      <div className="mt-2 space-y-2.5">{children}</div>
    </section>
  );
}

function Row({ main, sub }: { main: string; sub?: string }) {
  return (
    <div>
      <p className="text-[1.1875rem] leading-snug text-ink">{main}</p>
      {sub && <p className="mt-0.5 text-[0.9375rem] leading-snug text-muted">{sub}</p>}
    </div>
  );
}

export function PhoneSheet({ p }: { p: PageData }) {
  const join = (xs: (string | null | undefined)[]) => xs.filter((x) => x && x.trim()).join(". ");
  return (
    <article className="mx-auto max-w-xl space-y-5 bg-white px-5 pb-8 pt-6 text-ink sm:rounded-2xl sm:border sm:border-line sm:px-8">
      <header className="border-b-2 border-brand pb-3">
        <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1.5">
          <h1 className="display whitespace-nowrap text-[1.875rem] leading-none">The First Page</h1>
          <p className="whitespace-nowrap text-[0.8125rem] leading-tight text-muted sm:text-right">
            <b className="block text-[0.875rem] font-bold text-flag">Bring to every visit</b>Updated {p.versionDate}
          </p>
        </div>
        <p className="mt-3 text-[1.375rem] font-semibold leading-tight">{p.name}</p>
        {p.line1 && <p className="mt-1 text-[1.0625rem] leading-snug">{p.line1}</p>}
        {p.line2 && <p className="mt-0.5 text-[1.0625rem] leading-snug">{p.line2}</p>}
      </header>

      <Sec title="Allergies">
        {shown(p.allergies).length ? shown(p.allergies).map((a) => <Row key={a.id} main={a.cells[0]} sub={TIER_LABEL[a.tier]} />) : <Row main="None entered." />}
      </Sec>

      {p.carePartner && (
        <Sec title="Care partner in the room">
          <Row main={p.carePartner.line} sub={p.carePartner.contact} />
        </Sec>
      )}

      {p.readFirst.length > 0 && (
        <section className="border-l-4 border-brand bg-paper px-4 py-3">
          <h2 className="text-[0.9375rem] font-semibold text-brand">Read this first. In my own words. I chose these lines.</h2>
          <div className="mt-2 space-y-2">
            {p.readFirst.map((l, i) => <p key={i} className="[font-family:var(--font-source-serif)] text-[1.3125rem] italic leading-snug">{l}</p>)}
          </div>
        </section>
      )}

      {p.returnNoteTo && <Sec title="Return your note to"><Row main={p.returnNoteTo} /></Sec>}

      {shown(p.problems).length > 0 && (
        <Sec title="Problems, active first">
          {shown(p.problems).map((r) => <Row key={r.id} main={r.cells[0]} sub={join([r.cells[1] && `Since ${r.cells[1]}`, r.cells[2] && `Diagnosed by ${r.cells[2]}`, r.cells[3], srcOf(r)])} />)}
        </Sec>
      )}

      {shown(p.medications).length > 0 && (
        <Sec title="Medications, copied word for word from the pharmacy printout">
          <p className="text-[0.9375rem] text-muted">{p.medicationsAsOf ? `As of ${p.medicationsAsOf}. ` : ""}Verify with the pharmacy.</p>
          {shown(p.medications).map((r) => <Row key={r.id} main={r.cells[0]} sub={join([r.cells[1] && `Since ${r.cells[1]}`, srcOf(r)])} />)}
        </Sec>
      )}

      {shown(p.studies).length > 0 && (
        <Sec title="Key studies, reports in the folder">
          {shown(p.studies).map((r) => <Row key={r.id} main={r.cells[0]} sub={join([r.cells[1], srcOf(r)])} />)}
        </Sec>
      )}

      {shown(p.tried).length > 0 && (
        <Sec title={p.triedTitle}>
          {shown(p.tried).map((r) => <Row key={r.id} main={r.cells[0]} sub={srcOf(r)} />)}
        </Sec>
      )}

      {p.openToday && <Sec title="Open today"><Row main={p.openToday} /></Sec>}

      {p.questions.length > 0 && (
        <Sec title="My two questions">
          {p.questions.map((q, i) => <Row key={i} main={`${i + 1}. ${q}`} />)}
        </Sec>
      )}

      {shown(p.service).length > 0 && (
        <Sec title="Service history, one line per posting">
          {shown(p.service).map((r) => <Row key={r.id} main={join([r.cells[0], r.cells[1]])} sub={join([r.cells[2], srcOf(r)])} />)}
        </Sec>
      )}

      {shown(p.exposures).length > 0 && (
        <Sec title="Toxic exposure screening, with the where, when and who VA does not record">
          {shown(p.exposures).map((r) => <Row key={r.id} main={r.cells[0]} sub={join([r.cells[1], r.cells[2], srcOf(r)])} />)}
        </Sec>
      )}

      {shown(p.results).length > 0 && (
        <Sec title="Results that changed, two values, two dates, two sources">
          {shown(p.results).map((r) => <Row key={r.id} main={r.cells[0]} sub={join([r.cells[1] && `Earlier: ${r.cells[1]}`, r.cells[2] && `Later: ${r.cells[2]}`, r.cells[3] || srcOf(r)])} />)}
          <p className="text-[0.9375rem] text-muted">Values are copied as written in the source. Nothing on this page says whether a change matters.</p>
        </Sec>
      )}

      {p.chain.length > 0 && (
        <Sec title="The line between them, in my words and my order">
          <ol className="space-y-0">
            {p.chain.map((c, i) => (
              <li key={i} className="relative pb-4 pl-7 last:pb-0">
                {i < p.chain.length - 1 && <span aria-hidden="true" className="absolute bottom-0 left-[0.4375rem] top-4 w-0.5 bg-flag" />}
                <span aria-hidden="true" className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-[3px] border-flag bg-white" />
                <p className="display text-[1.375rem] leading-tight">{c.word}</p>
                {c.detail && <p className="text-[0.9375rem] text-muted">{c.detail}</p>}
              </li>
            ))}
          </ol>
        </Sec>
      )}

      {shown(p.shots).length > 0 && (
        <Sec title="Immunizations and medications given in service">
          {shown(p.shots).map((r) => <Row key={r.id} main={r.cells[0]} sub={join([r.cells[1], srcOf(r)])} />)}
        </Sec>
      )}

      {p.specimens && <Sec title="Stored blood specimens"><Row main={p.specimens} /></Sec>}
      {p.noRecordFoundFor && <Sec title="No record found for"><Row main={p.noRecordFoundFor} /></Sec>}
      {p.helpMe && <Sec title="How to help me in the room"><Row main={p.helpMe} /></Sec>}
      {p.sinceLastVisit && <Sec title="Since last visit"><Row main={p.sinceLastVisit} /></Sec>}

      {p.sources.length > 0 && (
        <Sec title="Sources, and where each request stands">
          {p.sources.map((s) => (
            <Row
              key={s.id}
              main={`${s.number}. ${s.label}${s.source_date ? `, ${s.source_date}` : ""}`}
              sub={({ received: "Received.", pending: "Pending.", not_requested: "Not yet requested.", not_found: "Not found.", closed: "Closed." })[s.status]}
            />
          ))}
        </Sec>
      )}

      <footer className="border-t-2 border-brand pt-4">
        <p className="text-[1.0625rem] font-medium leading-snug">From my own records. This is my record, not a diagnosis. Ask me about any line.</p>
      </footer>
    </article>
  );
}

export default function FirstPagePhone() {
  const { supabase, user, ready } = useAuth();
  const params = useSearchParams();
  const visitId = params.get("visit");
  const [page, setPage] = useState<PageData | null>(null);
  const [lint, setLint] = useState<LintProblem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const r = await buildPage(supabase, visitId);
      if (!r.ok) { setError(r.error); return; }
      setPage(r.data);
      setLint(lintPage(r.data));
    })();
  }, [supabase, user, visitId]);

  return (
    <div className="min-h-screen bg-paper sm:py-6">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-2 print:hidden">
        <Link href="/first-page" className="btn btn-ghost -ml-2 min-h-11">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>
          Back
        </Link>
        <span className="text-[0.875rem] text-muted">Hold it up, or hand it over.</span>
      </div>
      <div className="px-0 sm:px-4">
        {ready && !user && <div className="mx-auto max-w-xl px-4"><Notice>Sign in to see your page.</Notice></div>}
        {error && <div className="mx-auto max-w-xl px-4"><Notice error={error === NOT_SET_UP ? NOT_SET_UP : error} /></div>}
        {page && lint.length > 0 && (
          <div className="mx-auto max-w-xl px-4">
            <div className="rounded-xl border border-warn/40 bg-warn-soft p-4 text-[0.9375rem] text-ink">
              <p className="font-semibold">Not ready to show yet. The same check as the print:</p>
              <ul className="mt-2 space-y-1">{lint.slice(0, 8).map((l, i) => <li key={i}><span className="font-semibold">{l.where}</span> {l.what}</li>)}</ul>
              {lint.length > 8 && <p className="mt-1 text-muted">And {lint.length - 8} more.</p>}
              <Link href="/first-page" className="btn btn-secondary mt-3 min-h-11">Fix them on your First Page</Link>
            </div>
          </div>
        )}
        {page && lint.length === 0 && <PhoneSheet p={page} />}
      </div>
    </div>
  );
}
