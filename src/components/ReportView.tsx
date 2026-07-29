"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { EXPOSURE_BASIS, CONDITION_BASIS } from "@/lib/citations";
import { ServiceRibbon } from "./Patriotic";
import { downloadClaimPdf } from "@/lib/claimPdf";
import { VA_FORMS, VSO_LOCATOR_URL, FILE_ONLINE_URL } from "@/lib/nextaction";
import { CONDITION_EXPOSURES, EXPOSURE_LABEL, RECOGNIZED_CLASSES } from "@/lib/education";


// Exposure classes that carry a recognized presumptive pathway.

type ExpoRow = { id: string; exposure_class: string };
type CheckRow = { place_name: string | null; date_start: string | null; date_end: string | null; exposures: ExpoRow[] | null };

function yr(d: string | null) {
  return d ? new Date(d).getUTCFullYear() : null;
}
// A year or a year-range, so a brief stop reads differently than a long tour.
function rangeLabel(ds: string | null, de: string | null): string {
  const s = yr(ds), e = yr(de);
  if (!s && !e) return "—";
  if (s && e && e !== s) return `${s}–${e}`;
  return String(s ?? e);
}
type Member = { display_name: string | null; branch: string | null; service_start: string | null; service_end: string | null };
type RecordFile = { name: string; url: string; isImage: boolean };

export default function ReportView() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [member, setMember] = useState<Member | null>(null);
  const [rows, setRows] = useState<CheckRow[]>([]);
  const [conditions, setConditions] = useState<{ label: string; claim_status: string }[]>([]);
  const [expoPlaces, setExpoPlaces] = useState<Record<string, string[]>>({});
  const [corroByClass, setCorroByClass] = useState<Record<string, number>>({});
  const [records, setRecords] = useState<RecordFile[]>([]);
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user ?? null);
      setReady(true);
      if (!data.user) return;
      const [{ data: m }, { data: c }, { data: cond }] = await Promise.all([
        supabase.from("members").select("display_name, branch, service_start, service_end").maybeSingle(),
        supabase.from("check_ins").select("place_name, date_start, date_end, exposures(id, exposure_class)").order("date_start"),
        supabase.from("conditions").select("label, claim_status").order("created_at"),
      ]);
      setMember((m as Member) ?? null);
      const checks = (c ?? []) as CheckRow[];
      setRows(checks);
      setConditions((cond ?? []) as { label: string; claim_status: string }[]);

      const map: Record<string, string[]> = {};
      const classOfExposure: Record<string, string> = {};
      const ids: string[] = [];
      for (const row of checks) {
        const place = row.place_name || "a logged location";
        for (const e of row.exposures ?? []) {
          (map[e.exposure_class] ??= []);
          if (!map[e.exposure_class].includes(place)) map[e.exposure_class].push(place);
          classOfExposure[e.id] = e.exposure_class;
          ids.push(e.id);
        }
      }
      setExpoPlaces(map);

      if (ids.length) {
        const { data: corr } = await supabase.from("corroborations").select("exposure_id").in("exposure_id", ids);
        const byClass: Record<string, number> = {};
        for (const r of (corr ?? []) as { exposure_id: string }[]) {
          const cl = classOfExposure[r.exposure_id];
          if (cl) byClass[cl] = (byClass[cl] ?? 0) + 1;
        }
        setCorroByClass(byClass);
      }

      const { data: fileList } = await supabase.storage
        .from("records")
        .list(data.user.id, { sortBy: { column: "created_at", order: "desc" } });
      const recs: RecordFile[] = [];
      for (const f of fileList ?? []) {
        if (f.name === ".emptyFolderPlaceholder") continue;
        const isImage = /\.(jpe?g|png|webp|gif)$/i.test(f.name);
        const { data: signed } = await supabase.storage
          .from("records")
          .createSignedUrl(`${data.user.id}/${f.name}`, 3600);
        recs.push({ name: f.name.replace(/^\d+-/, ""), url: signed?.signedUrl ?? "", isImage });
      }
      setRecords(recs);
    });
  }, [supabase]);

  if (!ready) return <p className="text-sm text-muted">Loading…</p>;
  if (!user) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6">
        <p className="text-sm text-muted">Sign in to generate your claim packet.</p>
        <Link href="/" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">← Go to sign in</Link>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const years =
    member?.service_start || member?.service_end
      ? `${member?.service_start ? new Date(member.service_start).getUTCFullYear() : "?"}–${member?.service_end ? new Date(member.service_end).getUTCFullYear() : "?"}`
      : null;

  const classesPresent = Object.keys(expoPlaces);
  const presumptiveConditions = conditions.filter((c) => CONDITION_BASIS[c.label]?.presumptive).length;

  // Contentions: conditions that line up with at least one logged exposure.
  const contentions = conditions
    .map((c) => {
      const matches = (CONDITION_EXPOSURES[c.label] ?? []).filter((e) => (expoPlaces[e] ?? []).length > 0);
      return { label: c.label, matches };
    })
    .filter((c) => c.matches.length > 0);

  async function handleDownload() {
    setPdfBusy(true);
    try {
      await downloadClaimPdf({
        name: member?.display_name || user?.email || "Veteran",
        branch: member?.branch ?? null,
        years,
        today,
        summary: `You logged service at ${rows.length} location${rows.length === 1 ? "" : "s"}. Documented exposures include ${classesPresent.length ? classesPresent.map((c) => EXPOSURE_LABEL[c] ?? c).join(", ") : "none yet"}.${conditions.length > 0 ? ` Of your ${conditions.length} condition${conditions.length === 1 ? "" : "s"}, ${presumptiveConditions} ${presumptiveConditions === 1 ? "carries" : "carry"} a recognized presumptive pathway.` : " Add your conditions to see which carry a recognized presumptive pathway."}`,
        nextStep: "bring this packet to an accredited VSO (DAV, VFW, American Legion), and ask a clinician to review the hand-off sheet on the last page.",
        timeline: rows.map((r) => ({
          year: rangeLabel(r.date_start, r.date_end),
          place: r.place_name || "a logged location",
          exposures: (r.exposures ?? []).map((e) => EXPOSURE_LABEL[e.exposure_class] ?? e.exposure_class).join(", "),
        })),
        exposures: classesPresent.map((c) => ({
          label: EXPOSURE_LABEL[c] ?? c,
          presumptive: RECOGNIZED_CLASSES.has(c),
          places: (expoPlaces[c] ?? []).join("; "),
          basis: EXPOSURE_BASIS[c] ?? "ATSDR toxicological profile.",
        })),
        conditions: conditions.map((c) => {
          const matches = (CONDITION_EXPOSURES[c.label] ?? []).filter((e) => (expoPlaces[e] ?? []).length > 0);
          const basis = CONDITION_BASIS[c.label];
          return {
            label: c.label,
            tag: basis?.tag,
            presumptive: basis?.presumptive,
            status: c.claim_status,
            matches: matches.length ? `Documented association with ${matches.map((e) => EXPOSURE_LABEL[e] ?? e).join(", ")}.` : "",
            cite: basis?.cite,
          };
        }),
        corroborations: Object.entries(corroByClass).map(
          ([c, n]) => `${n} fellow service member${n === 1 ? "" : "s"} corroborate${n === 1 ? "s" : ""} exposure to ${EXPOSURE_LABEL[c] ?? c} at ${(expoPlaces[c] ?? []).join("; ")}.`
        ),
        contentions: contentions.map((c) => ({
          label: c.label,
          matches: c.matches.map((e) => EXPOSURE_LABEL[e] ?? e).join(", "),
          cite: CONDITION_BASIS[c.label]?.cite,
        })),
        attachments: records.map((r) => ({ name: r.name, isImage: r.isImage, url: r.url })),
      });
    } finally {
      setPdfBusy(false);
    }
  }

  const sectionTitle = "mb-2 text-[13px] font-bold uppercase tracking-wide text-brand";
  const sectionWrap = "mt-6 break-inside-avoid border-t border-line pt-5 first:mt-0 first:border-0 first:pt-0";

  return (
    <div>
      <div className="mb-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-muted">A claim-support packet to bring to your VSO and clinician.</span>
          <div className="flex items-center gap-2">
            <button onClick={handleDownload} disabled={pdfBusy} className="flex-none rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-600 disabled:opacity-60">
              {pdfBusy ? "Building PDF…" : "Download PDF"}
            </button>
            <button onClick={() => window.print()} className="flex-none rounded-lg border border-line px-4 py-2 text-sm font-semibold text-muted hover:bg-canvas">
              Print
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-faint">
          Download PDF saves the packet as a file you can print or email — it works even inside an
          in-app browser like Gmail&apos;s. On some phones the PDF opens in a viewer first; use the
          share icon there to save or print it. Print works best on a computer.
        </p>
        <Link href="/reviewer" className="mt-2 inline-block text-xs font-medium text-brand hover:underline">
          Bringing this to a VSO or clinician? Print a 5-question cover sheet to clip on top →
        </Link>
      </div>

      {/* How to actually file this — the bridge from packet to filed claim */}
      <div className="mb-4 rounded-xl border border-brand/20 bg-brand/5 p-5 print:hidden">
        <div className="text-[13px] font-bold uppercase tracking-wide text-brand">How to file this</div>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Your packet is evidence — here&apos;s how to turn it into a filed claim. Filing is <strong>free</strong>, and
          an accredited VSO will help you for free. You never have to pay anyone to file a VA claim.
        </p>
        <ol className="mt-3 space-y-3">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">1</span>
            <div>
              <div className="text-sm font-semibold text-ink">Lock in your date</div>
              <p className="text-xs leading-relaxed text-muted">{VA_FORMS.intent.blurb}</p>
              <a href={VA_FORMS.intent.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-brand hover:underline">
                About VA Form {VA_FORMS.intent.number} (Intent to File) →
              </a>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">2</span>
            <div>
              <div className="text-sm font-semibold text-ink">Get free help from a VSO</div>
              <p className="text-xs leading-relaxed text-muted">
                A Veterans Service Officer (VSO) — through DAV, VFW, or the American Legion — reviews your packet and
                files with you at no cost. Bring the 5-question cover sheet above.
              </p>
              <a href={VSO_LOCATOR_URL} target="_blank" rel="noreferrer" className="text-xs font-semibold text-brand hover:underline">
                Find an accredited VSO near you →
              </a>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">3</span>
            <div>
              <div className="text-sm font-semibold text-ink">File the claim</div>
              <p className="text-xs leading-relaxed text-muted">
                Submit VA Form {VA_FORMS.claim.number} online at VA.gov (or on paper with your VSO), and attach this
                packet and your DD-214.
              </p>
              <a href={FILE_ONLINE_URL} target="_blank" rel="noreferrer" className="text-xs font-semibold text-brand hover:underline">
                File a disability claim online at VA.gov →
              </a>
            </div>
          </li>
        </ol>
        <p className="mt-3 border-t border-brand/15 pt-3 text-xs leading-relaxed text-muted">
          Denied before, or expecting a denial? It is common, even for strong claims — and it isn&apos;t the end. You
          can file a{" "}
          <a href={VA_FORMS.supplemental.url} target="_blank" rel="noreferrer" className="font-semibold text-brand hover:underline">Supplemental Claim (20-0995)</a>,
          request a{" "}
          <a href={VA_FORMS.hlr.url} target="_blank" rel="noreferrer" className="font-semibold text-brand hover:underline">Higher-Level Review (20-0996)</a>, or a{" "}
          <a href={VA_FORMS.board.url} target="_blank" rel="noreferrer" className="font-semibold text-brand hover:underline">Board Appeal (10182)</a>.
          Your VSO can help you pick the right lane.
        </p>
      </div>

      <div className="rounded-xl border border-line bg-white p-6 text-ink shadow-sm sm:p-8 print:border-0 print:p-0 print:shadow-none">
        {/* Cover */}
        <ServiceRibbon className="mb-4 rounded-full" />
        <div className="mb-4 flex items-center justify-between border-b border-line pb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/owh-logo.png" alt="Operation Whole Health" className="h-12 w-auto object-contain" />
          <div className="text-right text-xs text-muted">
            Prepared<br />{today}
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-accent">America&apos;s 250th · 1776–2026</div>
          </div>
        </div>
        <div className="border-b border-line pb-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-accent">Connecting the Dots of Service · Operation Whole Health</div>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-ink">Claim Support Packet</h2>
          <p className="mt-0.5 text-sm text-muted">
            {member?.display_name || user.email}
            {member?.branch ? ` · ${member.branch}` : ""}
            {years ? ` · ${years}` : ""}
          </p>
          <div className="mt-2 inline-block rounded-md border border-line bg-canvas px-2.5 py-1 text-[11px] font-semibold text-muted">
            A self-prepared record — not a medical diagnosis or a legal opinion.
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Prepared from veteran-entered data. This is a self-reported record with documented-source citations to
          assist an accredited VSO and a clinician. It is not a diagnosis or a determination of service connection.
        </p>

        {/* Plain-language summary */}
        <div className="mt-5 rounded-lg border border-brand/20 bg-brand/5 p-4">
          <div className="text-[13px] font-bold uppercase tracking-wide text-brand">What this means</div>
          <p className="mt-1.5 text-sm leading-relaxed text-ink">
            You logged service at {rows.length} location{rows.length === 1 ? "" : "s"}. Documented exposures include{" "}
            {classesPresent.length ? classesPresent.map((c) => EXPOSURE_LABEL[c] ?? c).join(", ") : "none yet"}.{" "}
            {conditions.length > 0
              ? `Of your ${conditions.length} condition${conditions.length === 1 ? "" : "s"}, ${presumptiveConditions} ${presumptiveConditions === 1 ? "carries" : "carry"} a recognized presumptive pathway.`
              : "Add your conditions to see which carry a recognized presumptive pathway."}
          </p>
          <p className="mt-2 text-sm font-medium text-ink">
            Your next step: bring this packet to an accredited VSO (DAV, VFW, American Legion), and ask a clinician to
            review the hand-off sheet on the last page.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted print:hidden">
            If the VA denies a first claim — which is common, even for strong ones — it isn&apos;t the end. You can
            appeal or file a supplemental claim, and this packet strengthens that too. If things feel heavy, the
            Veterans Crisis Line is one tap away: dial 988, then press 1.
          </p>
        </div>

        {/* 1. Service-exposure timeline */}
        <section className={sectionWrap}>
          <h3 className={sectionTitle}>1 · Service &amp; exposure timeline</h3>
          {rows.length === 0 ? (
            <p className="text-sm text-muted">No locations logged yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {rows.map((r, i) => (
                <li key={i} className="text-sm">
                  <span className="font-semibold">{rangeLabel(r.date_start, r.date_end)}</span>
                  {" · "}
                  {r.place_name || "a logged location"}
                  {" — "}
                  <span className="text-muted">
                    {(r.exposures ?? []).map((e) => EXPOSURE_LABEL[e.exposure_class] ?? e.exposure_class).join(", ") || "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 2. Documented exposure basis (citations) */}
        <section className={sectionWrap}>
          <h3 className={sectionTitle}>2 · Documented basis for each exposure</h3>
          {classesPresent.length === 0 ? (
            <p className="text-sm text-muted">Log exposures on the map to populate this.</p>
          ) : (
            <ul className="space-y-2.5">
              {classesPresent.map((c) => (
                <li key={c} className="text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{EXPOSURE_LABEL[c] ?? c}</span>
                    {RECOGNIZED_CLASSES.has(c) && (
                      <span className="rounded bg-success-soft px-1.5 py-0.5 text-[11px] font-medium text-success">Presumptive pathway</span>
                    )}
                    <span className="text-xs text-muted">({(expoPlaces[c] ?? []).join("; ")})</span>
                  </div>
                  <div className="mt-0.5 text-xs leading-relaxed text-muted">{EXPOSURE_BASIS[c] ?? "ATSDR toxicological profile."}</div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 3. Conditions & documented links */}
        <section className={sectionWrap}>
          <h3 className={sectionTitle}>3 · Conditions &amp; their documented links</h3>
          {conditions.length === 0 ? (
            <p className="text-sm text-muted">No conditions recorded.</p>
          ) : (
            <ul className="space-y-2">
              {conditions.map((c, i) => {
                const matches = (CONDITION_EXPOSURES[c.label] ?? []).filter((e) => (expoPlaces[e] ?? []).length > 0);
                const basis = CONDITION_BASIS[c.label];
                return (
                  <li key={i} className="text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{c.label}</span>
                      {basis && (
                        <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${basis.presumptive ? "bg-success-soft text-success" : "bg-warn-soft text-warn"}`}>
                          {basis.tag}
                        </span>
                      )}
                      {c.claim_status !== "none" ? <span className="text-xs text-muted">VA claim {c.claim_status}</span> : null}
                    </div>
                    {matches.length > 0 ? (
                      <div className="mt-0.5 text-xs leading-relaxed text-muted">
                        Documented association with {matches.map((e) => EXPOSURE_LABEL[e] ?? e).join(", ")}.
                      </div>
                    ) : (
                      <div className="mt-0.5 text-xs text-muted">No logged exposure linked yet.</div>
                    )}
                    {basis && <div className="mt-0.5 text-xs leading-relaxed text-faint">{basis.cite}</div>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* 4. Corroboration / lay statements */}
        <section className={sectionWrap}>
          <h3 className={sectionTitle}>4 · Corroboration by fellow service members</h3>
          {Object.keys(corroByClass).length === 0 ? (
            <p className="text-sm text-muted">
              No corroboration yet. In Battle buddies, others who served where you did can confirm your exposures —
              each confirmation strengthens this record.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {Object.entries(corroByClass).map(([c, n]) => (
                <li key={c} className="text-sm">
                  <span className="font-medium">{n}</span> fellow service member{n === 1 ? "" : "s"} corroborate
                  {n === 1 ? "s" : ""} exposure to <span className="font-medium">{EXPOSURE_LABEL[c] ?? c}</span> at{" "}
                  {(expoPlaces[c] ?? []).join("; ")}.
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-muted">Lay statements consistent with VA Form 21-10210. Corroborators are kept anonymous unless they consent to be named.</p>
        </section>

        {/* 5. Clinician hand-off sheet */}
        <section className="mt-6 break-before-page break-inside-avoid border-t border-line pt-5">
          <h3 className={sectionTitle}>5 · For the reviewing clinician</h3>
          <p className="text-sm leading-relaxed text-ink">
            The veteran requests your medical opinion on whether the following condition(s) are <strong>at least as
            likely as not</strong> (50% or greater probability) connected to the documented service exposures below. A
            signed nexus statement, or a completed Disability Benefits Questionnaire (DBQ), supports this claim.
          </p>
          {contentions.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Add conditions and exposures to generate the contentions list.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {contentions.map((c) => {
                const basis = CONDITION_BASIS[c.label];
                return (
                  <li key={c.label} className="text-sm">
                    <span className="font-semibold">{c.label}</span>
                    <span className="text-muted">
                      {" "}— claimed as connected to {c.matches.map((e) => EXPOSURE_LABEL[e] ?? e).join(", ")}
                    </span>
                    {basis && <div className="mt-0.5 text-xs text-faint">{basis.cite}</div>}
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-5 grid grid-cols-2 gap-6 text-sm">
            <div>
              <div className="border-b border-ink pb-6" />
              <div className="mt-1 text-xs text-muted">Clinician signature</div>
            </div>
            <div>
              <div className="border-b border-ink pb-6" />
              <div className="mt-1 text-xs text-muted">Date · License #</div>
            </div>
          </div>
        </section>

        {/* 6. Attachments */}
        <section className={sectionWrap}>
          <h3 className={sectionTitle}>6 · Attached records</h3>
          {records.length === 0 ? (
            <p className="text-sm text-muted">
              Upload your DD-214 and any service or medical records under Account — they&apos;ll be listed here and
              image scans will print with this packet.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted">The following records accompany this packet:</p>
              <ul className="mt-2 space-y-1 text-sm">
                {records.map((r) => (
                  <li key={r.name} className="text-ink">
                    • {r.name}
                    {r.isImage ? <span className="text-faint"> (printed below)</span> : <span className="text-faint"> — attach this file when you submit</span>}
                  </li>
                ))}
              </ul>
              {records.some((r) => r.isImage) && (
                <div className="mt-4 space-y-4">
                  {records
                    .filter((r) => r.isImage && r.url)
                    .map((r) => (
                      <figure key={r.name} className="break-inside-avoid">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.url} alt={r.name} className="max-h-[560px] w-auto rounded border border-line" />
                        <figcaption className="mt-1 text-xs text-faint">{r.name}</figcaption>
                      </figure>
                    ))}
                </div>
              )}
            </>
          )}
        </section>

        <p className="mt-6 border-t border-line pt-4 text-xs leading-relaxed text-faint">
          This packet assembles veteran-entered facts with documented sources. It states associations and presumptive
          pathways; it does not assert medical causation, which requires a licensed clinician&apos;s opinion. Citations
          are general and depend on your specific dates and locations — confirm with your VSO. Sources: PACT Act of
          2022, 38 CFR Part 3, Camp Lejeune Justice Act, and ATSDR toxicological profiles (VA.gov, June 2026). Veterans
          Crisis Line: dial 988, then press 1.
        </p>
      </div>
    </div>
  );
}
