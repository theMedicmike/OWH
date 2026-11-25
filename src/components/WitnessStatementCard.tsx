"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { RELATIONSHIP_OPTIONS, WITNESS_TYPE_OPTIONS, getPublicStatementRequest, submitWitnessStatement, type PublicStatementRequest } from "@/lib/statementRequests";

const YEAR_OPTIONS = Array.from({ length: new Date().getUTCFullYear() - 1940 + 1 }, (_, i) => new Date().getUTCFullYear() - i);

// The other end of a link a veteran sent someone who isn't on this app — a
// spouse, a battle buddy, a commander. No account needed: the token in the URL
// is the whole key. This card never shows more of the veteran's record than the
// one subject_label + note the veteran chose to share (see 0018's
// create_statement_request — that boundary is enforced server-side, not here).
export default function WitnessStatementCard({ token }: { token: string }) {
  const { supabase } = useAuth();
  const [loading, setLoading] = useState(true);
  const [req, setReq] = useState<PublicStatementRequest | null>(null);

  const [witnessType, setWitnessType] = useState("");
  const [witnessName, setWitnessName] = useState("");
  const [relationship, setRelationship] = useState(RELATIONSHIP_OPTIONS[0]);
  const [relationshipDetail, setRelationshipDetail] = useState("");
  const [knewFrom, setKnewFrom] = useState("");
  const [knewTo, setKnewTo] = useState("");
  const [statement, setStatement] = useState("");
  const [contact, setContact] = useState("");
  const [firsthandConfirmed, setFirsthandConfirmed] = useState(false);
  const [attested, setAttested] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await getPublicStatementRequest(supabase, token);
      setReq(r);
      setLoading(false);
    })();
  }, [supabase, token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!witnessType) { setErr("Let them know how you know them: served together, or from home and family life."); return; }
    if (witnessName.trim().length < 2) { setErr("Let them know who you are."); return; }
    if (statement.trim().length < 20) { setErr("Say a little more. A sentence or two about what you remember."); return; }
    if (!firsthandConfirmed) { setErr("Please confirm you're describing only what you personally saw, heard, or were told at the time."); return; }
    if (!attested) { setErr("Please confirm your statement is true to the best of your knowledge."); return; }
    setBusy(true);
    const result = await submitWitnessStatement(supabase, {
      token, witnessName, relationship, statement, contact,
      witnessType, relationshipDetail,
      knewFrom: knewFrom ? parseInt(knewFrom, 10) : null,
      knewTo: knewTo ? parseInt(knewTo, 10) : null,
      firsthandConfirmed, attested,
    });
    setBusy(false);
    if (result === "ok") setDone(true);
    else if (result === "submitted") setReq((r) => (r ? { ...r, status: "submitted" } : r));
    else if (result === "expired") setReq((r) => (r ? { ...r, status: "expired" } : r));
    else setErr("That didn't go through. Give it another try.");
  }

  const shell = (children: React.ReactNode) => (
    <div className="w-full card card-raise p-6 sm:p-7">
      {children}
    </div>
  );

  const h2 = "text-lg font-semibold tracking-tight text-ink";
  const tile = (on: boolean) => `btn min-h-12 w-full justify-start text-left leading-snug ${on ? "btn-primary" : "btn-secondary"}`;
  const checkRow = "flex min-h-12 cursor-pointer items-start gap-3 rounded-xl px-1 py-2 hover:bg-canvas";

  if (loading) return shell(<p className="text-[0.9375rem] text-muted">One moment…</p>);

  if (done) {
    return shell(
      <>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-success" aria-hidden="true">
            <path d="m5 13 4 4L19 7" />
          </svg>
        </div>
        <h2 className={`${h2} text-center`}>Thank you. It&apos;s saved.</h2>
        <p className="mt-2 text-center text-[0.9375rem] leading-relaxed text-muted">
          Your statement has been added to their record. You can close this page.
        </p>
      </>,
    );
  }

  if (!req || req.status === "invalid") {
    return shell(
      <>
        <h2 className={h2}>This link isn&apos;t valid</h2>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
          Double-check the link you were sent, or ask them to send a fresh one.
        </p>
      </>,
    );
  }

  if (req.status === "expired") {
    return shell(
      <>
        <h2 className={h2}>This link has expired</h2>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
          These links are good for 90 days. Ask them to send you a new one and you can try again.
        </p>
      </>,
    );
  }

  if (req.status === "revoked") {
    return shell(
      <>
        <h2 className={h2}>This link is no longer active</h2>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">They&apos;ve cancelled this request. No need to do anything.</p>
      </>,
    );
  }

  if (req.status === "submitted") {
    return shell(
      <>
        <h2 className={h2}>Already taken care of</h2>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">A statement was already submitted for this request. Thank you.</p>
      </>,
    );
  }

  return shell(
    <>
      <h2 className={h2}>
        {req.requester_name ? `${req.requester_name} is asking` : "You're being asked"} for your help
      </h2>
      <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted">
        They want to confirm something about <span className="font-medium text-ink">{req.subject_label}</span> for
        their VA claim record. Only write what you actually remember or witnessed yourself.
      </p>
      {req.veteran_note && (
        <p className="mt-3 rounded-xl bg-canvas p-4 text-[0.9375rem] italic leading-relaxed text-ink">&ldquo;{req.veteran_note}&rdquo;</p>
      )}

      <form onSubmit={submit} className="mt-6 space-y-5">
        <fieldset>
          <legend className="field-label">How do you know them?</legend>
          <div className="grid grid-cols-1 gap-2">
            {WITNESS_TYPE_OPTIONS.map((o) => (
              <button key={o.v} type="button" aria-pressed={witnessType === o.v} onClick={() => setWitnessType(o.v)} className={tile(witnessType === o.v)}>
                {o.label}
              </button>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="witness-name" className="field-label">Your name</label>
          <input id="witness-name" value={witnessName} onChange={(e) => setWitnessName(e.target.value)} placeholder="First and last name" autoComplete="name" className="field" />
        </div>
        <fieldset>
          <legend className="field-label">Relationship</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {RELATIONSHIP_OPTIONS.map((o) => (
              <button key={o} type="button" aria-pressed={relationship === o} onClick={() => setRelationship(o)} className={tile(relationship === o)}>
                {o}
              </button>
            ))}
          </div>
          <label htmlFor="witness-rel-detail" className="sr-only">Relationship detail (optional)</label>
          <input
            id="witness-rel-detail"
            value={relationshipDetail}
            onChange={(e) => setRelationshipDetail(e.target.value)}
            placeholder="Optional detail, e.g. &quot;his squad leader, 2009–2011&quot; or &quot;wife of 12 years&quot;"
            className="field mt-2"
          />
        </fieldset>
        <fieldset>
          <legend className="field-label">
            {witnessType === "same_unit" ? "What years did you serve together?" : "What years have you known them?"} (optional)
          </legend>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <select aria-label="From year" value={knewFrom} onChange={(e) => setKnewFrom(e.target.value)} className="field">
              <option value="">From</option>
              {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <span className="text-[0.9375rem] text-muted">to</span>
            <select aria-label="To year" value={knewTo} onChange={(e) => setKnewTo(e.target.value)} className="field">
              <option value="">To (or now)</option>
              {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </fieldset>
        <div>
          <label htmlFor="witness-statement" className="field-label">
            {witnessType === "same_unit"
              ? "What did you see or experience together?"
              : "What have you noticed change in them, and since when?"}
          </label>
          <textarea
            id="witness-statement"
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            rows={5}
            maxLength={4000}
            placeholder={
              witnessType === "same_unit"
                ? "Write it in your own words: what you saw, noticed, or were told at the time."
                : "Write it in your own words: what's different now, when you first noticed it, and what it looks like."
            }
            className="field"
          />
        </div>
        <label className={checkRow}>
          <input type="checkbox" checked={firsthandConfirmed} onChange={(e) => setFirsthandConfirmed(e.target.checked)} className="mt-0.5 h-6 w-6 flex-none accent-brand" />
          <span className="text-[0.9375rem] leading-relaxed text-ink">
            I&apos;m only describing what I personally saw, heard, or was told at the time. Not assumptions or hearsay.
          </span>
        </label>
        <div>
          <label htmlFor="witness-contact" className="field-label">Your contact info (optional, in case they need to reach you)</label>
          <input id="witness-contact" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="email or phone" className="field" />
        </div>
        <label className={checkRow}>
          <input type="checkbox" checked={attested} onChange={(e) => setAttested(e.target.checked)} className="mt-0.5 h-6 w-6 flex-none accent-brand" />
          <span className="text-[0.9375rem] leading-relaxed text-ink">I confirm this statement is true to the best of my knowledge.</span>
        </label>
        {err && <p role="alert" className="text-[0.9375rem] font-medium text-scarlet">{err}</p>}
        <button
          type="submit"
          disabled={busy}
          className="btn btn-primary btn-lg w-full"
        >
          {busy ? "Submitting…" : "Submit my statement"}
        </button>
      </form>

      <p className="mt-5 border-t border-line pt-4 text-sm leading-relaxed text-muted">
        This isn&apos;t a legal document and you&apos;re not signing anything. Say only what&apos;s true and only
        what&apos;s yours to say.
      </p>
    </>,
  );
}
