"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { ServiceRibbon } from "./Patriotic";
import { RELATIONSHIP_OPTIONS, getPublicStatementRequest, submitWitnessStatement, type PublicStatementRequest } from "@/lib/statementRequests";

// The other end of a link a veteran sent someone who isn't on this app — a
// spouse, a battle buddy, a commander. No account needed: the token in the URL
// is the whole key. This card never shows more of the veteran's record than the
// one subject_label + note the veteran chose to share (see 0018's
// create_statement_request — that boundary is enforced server-side, not here).
export default function WitnessStatementCard({ token }: { token: string }) {
  const { supabase } = useAuth();
  const [loading, setLoading] = useState(true);
  const [req, setReq] = useState<PublicStatementRequest | null>(null);

  const [witnessName, setWitnessName] = useState("");
  const [relationship, setRelationship] = useState(RELATIONSHIP_OPTIONS[0]);
  const [statement, setStatement] = useState("");
  const [contact, setContact] = useState("");
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

  const field =
    "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-faint focus:border-brand focus:ring-2 focus:ring-brand/15";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (witnessName.trim().length < 2) { setErr("Let them know who you are."); return; }
    if (statement.trim().length < 20) { setErr("Say a little more — a sentence or two about what you remember."); return; }
    setBusy(true);
    const result = await submitWitnessStatement(supabase, { token, witnessName, relationship, statement, contact });
    setBusy(false);
    if (result === "ok") setDone(true);
    else if (result === "submitted") setReq((r) => (r ? { ...r, status: "submitted" } : r));
    else if (result === "expired") setReq((r) => (r ? { ...r, status: "expired" } : r));
    else setErr("That didn't go through. Give it another try.");
  }

  const shell = (children: React.ReactNode) => (
    <div className="w-full rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-7">
      <ServiceRibbon className="mb-5 rounded-full opacity-90" />
      {children}
    </div>
  );

  if (loading) return shell(<p className="text-sm text-muted">One moment…</p>);

  if (done) {
    return shell(
      <>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-success">
            <path d="m5 13 4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-center text-base font-semibold text-ink">Thank you — it&apos;s saved.</h3>
        <p className="mt-2 text-center text-sm leading-relaxed text-muted">
          Your statement has been added to their record. You can close this page.
        </p>
      </>,
    );
  }

  if (!req || req.status === "invalid") {
    return shell(
      <>
        <h3 className="text-base font-semibold text-ink">This link isn&apos;t valid</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Double-check the link you were sent, or ask them to send a fresh one.
        </p>
      </>,
    );
  }

  if (req.status === "expired") {
    return shell(
      <>
        <h3 className="text-base font-semibold text-ink">This link has expired</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          These links are good for 90 days. Ask them to send you a new one and you can try again.
        </p>
      </>,
    );
  }

  if (req.status === "revoked") {
    return shell(
      <>
        <h3 className="text-base font-semibold text-ink">This link is no longer active</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">They&apos;ve cancelled this request. No need to do anything.</p>
      </>,
    );
  }

  if (req.status === "submitted") {
    return shell(
      <>
        <h3 className="text-base font-semibold text-ink">Already taken care of</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">A statement was already submitted for this request. Thank you.</p>
      </>,
    );
  }

  return shell(
    <>
      <h3 className="text-base font-semibold text-ink">
        {req.requester_name ? `${req.requester_name} is asking` : "You're being asked"} for your help
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">
        They want to confirm something about <span className="font-medium text-ink">{req.subject_label}</span> for
        their VA claim record. Only write what you actually remember or witnessed yourself.
      </p>
      {req.veteran_note && (
        <p className="mt-2 rounded-lg bg-canvas p-3 text-sm italic leading-relaxed text-ink/80">&ldquo;{req.veteran_note}&rdquo;</p>
      )}

      <form onSubmit={submit} className="mt-5 space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Your name</label>
          <input value={witnessName} onChange={(e) => setWitnessName(e.target.value)} placeholder="First and last name" className={field} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">How do you know them?</label>
          <select value={relationship} onChange={(e) => setRelationship(e.target.value)} className={field}>
            {RELATIONSHIP_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">What do you remember or witness yourself?</label>
          <textarea
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            rows={5}
            maxLength={4000}
            placeholder="Write it in your own words — what you saw, noticed, or were told at the time."
            className={field}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Your contact info (optional, in case they need to reach you)</label>
          <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="email or phone" className={field} />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground transition hover:bg-brand-600 disabled:opacity-60"
        >
          {busy ? "Submitting…" : "Submit my statement"}
        </button>
      </form>

      {err && <p className="mt-3 text-xs text-scarlet">{err}</p>}

      <p className="mt-5 border-t border-line pt-4 text-[11px] leading-relaxed text-faint">
        This isn&apos;t a legal document and you&apos;re not signing anything. Say only what&apos;s true and only
        what&apos;s yours to say.
      </p>
    </>,
  );
}
