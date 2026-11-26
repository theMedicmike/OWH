"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../AuthProvider";
import { buildPage, lintPage, listPages, listVisits, NOT_SET_UP, type FpPage, type FpVisit, type LintProblem, type PageData } from "@/lib/firstPage";
import { Notice, Stance } from "./Controls";
import { SpineRow, type SpineState } from "../ui";

// The ten parts of the page, in the order they are best filled in. Each one
// knows how to tell whether it has been done, from the page data alone.
type Section = { href: string; label: string; what: string; done: (p: PageData) => boolean };

const SECTIONS: Section[] = [
  { href: "/first-page/sources", label: "Sources", what: "Every document behind the page, numbered, with its date and where the request stands.", done: (p) => p.sources.length > 0 },
  { href: "/first-page/profile", label: "Who you are, who comes with you", what: "Year of birth, the service lines, your care partner, how to help you in the room, the return address for the doctor's note.", done: (p) => !!p.born && !!p.carePartner && !!p.returnNoteTo },
  { href: "/first-page/allergies", label: "Allergies", what: 'Even "No known drug allergies." The box on the front is never blank.', done: (p) => p.allergies.some((a) => a.show) },
  { href: "/first-page/rows", label: "Your problems, medicines, postings, exposures and shots", what: "Already in your record. Here you pick what prints, attach a source to each row, and copy medication directions word for word.", done: (p) => p.problems.some((r) => r.show && r.sourceNumber != null) && p.medications.some((r) => r.show && r.sourceNumber != null) },
  { href: "/first-page/studies", label: "Key studies", what: "The MRI, the sleep study, the audiogram: type, date, and whether the report is in the folder.", done: (p) => p.studies.some((r) => r.show) },
  { href: "/first-page/tried", label: "What has been tried", what: "Medicines and therapies tried before, with the year and why each stopped.", done: (p) => p.tried.some((r) => r.show) },
  { href: "/first-page/results", label: "Results that changed", what: "Two values, two dates, two sources. Copied as written. No arrows.", done: (p) => p.results.some((r) => r.show) },
  { href: "/first-page/record", label: "Your story, recorded", what: "Ten minutes in your own words, on a good day. You pick the three lines the doctor reads first.", done: () => true },
  { href: "/first-page/chain", label: "The line between them", what: "The words you set in a chain on the front of the page, in your order. Yours, never the app's.", done: (p) => p.chain.length > 0 },
  { href: "/first-page/visit", label: "This visit", what: "Who you are seeing, what is open today, your two questions, since last visit, and the three lines.", done: (p) => !!p.visit && p.readFirst.length === 3 && p.questions.length === 2 },
];

export default function FirstPageHub() {
  const { supabase, user } = useAuth();
  const [page, setPage] = useState<PageData | null>(null);
  const [visits, setVisits] = useState<FpVisit[]>([]);
  const [versions, setVersions] = useState<FpPage[]>([]);
  const [lint, setLint] = useState<LintProblem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      const [p, v, pg] = await Promise.all([buildPage(supabase, null), listVisits(supabase), listPages(supabase)]);
      if (!alive) return;
      if (!p.ok) { setError(p.error); setLoading(false); return; }
      setPage(p.data);
      setLint(lintPage(p.data));
      if (v.ok) setVisits(v.data);
      if (pg.ok) setVersions(pg.data);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [supabase, user]);

  if (!user) return <Notice>Sign in to build your First Page.</Notice>;
  if (error === NOT_SET_UP) return <Notice error={NOT_SET_UP} />;
  if (error) return <Notice error={error} />;

  const doneFlags = SECTIONS.map((s) => (page ? s.done(page) : false));
  const nextIndex = doneFlags.findIndex((d) => !d);
  const stateFor = (i: number): SpineState => (doneFlags[i] ? "done" : i === nextIndex ? "next" : "todo");

  return (
    <div className="space-y-7">
      <div>
        <h2 className="display text-[1.75rem] text-ink sm:text-[2rem]">One sheet. Two sides. Same layout every time.</h2>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          The front is what a specialist needs in the first ninety seconds: allergies, who came with you, three lines in
          your own words, your problems with dates, your medicines copied from the pharmacy printout, what has been
          tried, and your two questions. The back is where you served, what you were around, the numbers that changed,
          what could not be found, and every source. Every row names where it came from and when.
        </p>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
          Build it once. Print it before every visit. Hand it over at check-in. The doctor reads it; you do not start
          from zero.
        </p>
      </div>

      <Stance />

      {loading ? (
        <p className="text-[0.9375rem] text-muted">Loading your page…</p>
      ) : (
        <>
          <section>
            <h3 className="text-lg font-semibold tracking-tight text-ink">Build the page</h3>
            <div className="card mt-3 overflow-hidden">
              <ol className="spine p-2">
                {SECTIONS.map((s, i) => (
                  <SpineRow key={s.href} href={s.href} step={i + 1} label={s.label} detail={s.what} state={stateFor(i)} />
                ))}
              </ol>
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <h3 className="text-lg font-semibold tracking-tight text-ink">Print</h3>
            {lint.length === 0 ? (
              <p className="mt-1 text-[0.9375rem] leading-relaxed text-success">The page passes every check. It can be printed.</p>
            ) : (
              <>
                <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted">
                  The page will not print until every row has a source and a year, and nothing on it reads like a
                  conclusion. Still to fix:
                </p>
                <ul className="mt-3 space-y-1.5">
                  {lint.slice(0, 12).map((l, i) => (
                    <li key={i} className="text-[0.9375rem] leading-relaxed text-ink"><span className="font-semibold">{l.where}</span> {l.what}</li>
                  ))}
                  {lint.length > 12 && <li className="text-sm text-muted">and {lint.length - 12} more.</li>}
                </ul>
              </>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {visits.length === 0 ? (
                <Link href="/first-page/visit" className="btn btn-primary">Set up a visit first</Link>
              ) : (
                visits.map((v) => (
                  <Link key={v.id} href={`/first-page/print?visit=${v.id}`} className="btn btn-secondary">
                    Preview and print for {v.specialist || "this visit"}{v.visit_date ? `, ${v.visit_date}` : ""}
                  </Link>
                ))
              )}
            </div>
          </section>

          {versions.length > 0 && (
            <section className="card p-5 sm:p-6">
              <h3 className="text-lg font-semibold tracking-tight text-ink">Pages you have printed</h3>
              <ul className="mt-2 divide-y divide-line">
                {versions.map((v) => (
                  <li key={v.id} className="py-2.5 text-[0.9375rem] text-muted">
                    Version {v.version_date}{v.assembled_by ? `, assembled by ${v.assembled_by}` : ""}{v.signed ? ", signed by the veteran" : ", not signed"}.
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm leading-relaxed text-muted">A correction is a new version, never a hand edit. Corrections go to the helper named on side 2.</p>
            </section>
          )}
        </>
      )}

      <section className="card p-5 sm:p-6">
        <h3 className="text-lg font-semibold tracking-tight text-ink">What stays private</h3>
        <ul className="mt-3 space-y-2 text-[0.9375rem] leading-relaxed text-muted">
          <li>Your recording and the words your browser heard sit in your own private storage. Only you can open them, and you can delete them at any time.</li>
          <li>Nothing on this page is written, rewritten or listened to by AI. The words are yours, copied as you said them.</li>
          <li>Rows you leave off never print. Mental-health conditions, sexual trauma and assault start off and stay off unless you turn them on.</li>
          <li>The page is printed from your device. Nothing is sent to a clinic, to VA or to Operation Whole Health by this app. You hand it over yourself.</li>
          <li>Each print is kept as a dated version so a wrong row can be corrected by re-issuing the page, never by a hand edit.</li>
        </ul>
      </section>

      <p className="px-1 text-sm leading-relaxed text-muted">
        This section documents. It does not diagnose, does not advise you, does not file for you, and is not your
        representative. If you or someone you know is struggling, the Veterans Crisis Line is here 24/7: dial 988, then
        press 1. Text 838255.
      </p>
    </div>
  );
}
