"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { EXPOSURE_LABEL } from "@/lib/education";
import {
  createStatementRequest,
  listStatementRequests,
  revokeStatementRequest,
  type StatementRequest,
  type StatementSubjectType,
  type WitnessStatement,
} from "@/lib/statementRequests";

type Subject = { key: string; type: StatementSubjectType; id: string | null; label: string; detail?: string };

// Ask someone who is not on this app to confirm your record, in one tap:
// every thing they could confirm is a row with an Ask button. The tap makes
// the private link and opens the phone's share sheet, so it can go straight
// into a text message. The optional note above the list rides along.
//
// What the link opens is unchanged: they see only the one thing he chose,
// need no account, and the link expires in 90 days.
export default function WitnessRequestsCard() {
  const { user, supabase } = useAuth();
  const [ready, setReady] = useState(false);
  const [notSetUp, setNotSetUp] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [requests, setRequests] = useState<StatementRequest[]>([]);
  const [statements, setStatements] = useState<WitnessStatement[]>([]);

  const [note, setNote] = useState("");
  const [creatingKey, setCreatingKey] = useState<string | null>(null);
  const [fresh, setFresh] = useState<{ key: string; link: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const res = await listStatementRequests(supabase);
    if ("error" in res) {
      setNotSetUp(res.error === "not-set-up");
      return;
    }
    setRequests(res.requests);
    setStatements(res.statements);
  }, [supabase]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: ex }, { data: co }] = await Promise.all([
        supabase.from("exposures").select("id, exposure_class, check_ins(place_name, date_start)"),
        supabase.from("conditions").select("id, label"),
      ]);
      type ExRow = { id: string; exposure_class: string; check_ins: { place_name: string | null; date_start: string | null }[] | { place_name: string | null; date_start: string | null } | null };
      const exSubjects: Subject[] = ((ex ?? []) as ExRow[]).map((r) => {
        const ci = Array.isArray(r.check_ins) ? r.check_ins[0] : r.check_ins;
        const place = ci?.place_name;
        const year = ci?.date_start ? new Date(ci.date_start).getUTCFullYear() : null;
        const where = [place, year].filter(Boolean).join(", ");
        return { key: `e:${r.id}`, type: "exposure", id: r.id, label: EXPOSURE_LABEL[r.exposure_class] ?? r.exposure_class, detail: where || "An exposure you logged" };
      });
      const coSubjects: Subject[] = ((co ?? []) as { id: string; label: string }[]).map((r) => ({
        key: `c:${r.id}`, type: "condition", id: r.id, label: r.label, detail: "A condition you logged",
      }));
      setSubjects([
        { key: "general", type: "general", id: null, label: "My service in general", detail: "Where you served together, or what they saw at home" },
        ...exSubjects,
        ...coSubjects,
      ]);
      await load();
      setReady(true);
    })();
  }, [user, supabase, load]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  async function copyLink(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(link);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* clipboard may be unavailable; the link is still shown for manual copy */
    }
  }

  async function shareLink(link: string) {
    const nav = navigator as Navigator & { share?: (data: { title?: string; text?: string; url?: string }) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ title: "Help confirm my service record", text: "Would you help confirm something about my time in service? It only takes a couple minutes.", url: link });
        return;
      } catch {
        /* cancelled, or the browser refused; fall through to copy */
      }
    }
    copyLink(link);
  }

  async function ask(s: Subject) {
    setErr("");
    setCreatingKey(s.key);
    const res = await createStatementRequest(supabase, { subjectType: s.type, subjectId: s.id, note });
    setCreatingKey(null);
    if ("error" in res) {
      if (res.error === "not-set-up") setNotSetUp(true);
      else setErr("That link did not get made. Try again in a moment.");
      return;
    }
    const link = `${origin}/statement/${res.token}`;
    setFresh({ key: s.key, link });
    await load();
    // Straight to the share sheet on a phone. If the browser refuses (some
    // need a fresh tap), the Share button under the row does it.
    shareLink(link);
  }

  async function revoke(id: string) {
    await revokeStatementRequest(supabase, id);
    await load();
  }

  if (!ready) return null;

  if (notSetUp) {
    return (
      <div className="card p-5">
        <h3 className="text-lg font-semibold tracking-tight text-ink">Ask someone to confirm your record</h3>
        <p className="mt-2 text-[0.9375rem] text-muted">This is on its way. Check back soon.</p>
      </div>
    );
  }

  const statementsFor = (requestId: string) => statements.filter((s) => s.request_id === requestId);
  const pending = requests.filter((r) => r.status === "pending");
  const submitted = requests.filter((r) => r.status === "submitted");

  return (
    <div className="space-y-6">
      <p className="text-[0.9375rem] leading-relaxed text-muted">
        A spouse, a buddy you lost touch with, a commander. Tap Ask on what you want them to confirm and send them
        the private link. They don&apos;t need an account, and they see only that one thing, nothing else in your
        record.
      </p>

      <div>
        <label htmlFor="witness-note" className="field-label">Anything to jog their memory? (optional, shown to them)</label>
        <textarea
          id="witness-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="e.g. Our deployment together in 2009 at COP Blackhawk."
          className="field"
        />
      </div>

      {err && <p role="alert" className="text-[0.9375rem] font-medium text-scarlet">{err}</p>}

      <section>
        <h3 className="text-lg font-semibold tracking-tight text-ink">What should they confirm?</h3>
        <div className="card mt-3 overflow-hidden">
          {subjects.map((s) => (
            <div key={s.key} className="border-t border-line first:border-t-0">
              <div className="row">
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.9375rem] font-semibold leading-snug">{s.label}</span>
                  {s.detail && <span className="mt-0.5 block text-sm leading-snug text-muted">{s.detail}</span>}
                </span>
                <button
                  type="button"
                  onClick={() => ask(s)}
                  disabled={creatingKey !== null}
                  aria-label={`Ask someone to confirm: ${s.label}`}
                  className="btn btn-secondary min-w-[5.5rem] flex-none"
                >
                  {creatingKey === s.key ? "Making…" : "Ask"}
                </button>
              </div>
              {fresh?.key === s.key && (
                <div className="border-t border-line bg-canvas px-4 pb-4 pt-3" aria-live="polite">
                  <p className="text-[0.9375rem] font-semibold text-success">Your private link is ready. Send it however you would reach them.</p>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button onClick={() => shareLink(fresh.link)} className="btn btn-primary btn-lg w-full">Share it</button>
                    <button onClick={() => copyLink(fresh.link)} className="btn btn-secondary btn-lg w-full">{copied === fresh.link ? "Copied" : "Copy the link"}</button>
                  </div>
                  <p className="mt-2 break-all text-sm text-muted">{fresh.link}</p>
                  <p className="mt-1 text-sm text-muted">Good for 90 days. Only someone with the link can open it.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {(pending.length > 0 || submitted.length > 0) && (
        <section>
          <h3 className="text-lg font-semibold tracking-tight text-ink">Your requests</h3>
          <div className="mt-3 space-y-3">
            {submitted.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="text-[0.9375rem] font-semibold text-ink">{r.subject_label}</div>
                {statementsFor(r.id).map((s) => (
                  <div key={s.id} className="mt-2 rounded-xl bg-canvas p-3">
                    <div className="text-[0.9375rem] font-semibold text-ink">{s.witness_name} <span className="font-normal text-muted">({s.relationship})</span></div>
                    <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink">&ldquo;{s.statement}&rdquo;</p>
                  </div>
                ))}
              </div>
            ))}
            {pending.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="text-[0.9375rem] font-semibold text-ink">{r.subject_label}</div>
                <div className="text-sm text-muted">Waiting for a reply</div>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button onClick={() => shareLink(`${origin}/statement/${r.token}`)} className="btn btn-secondary w-full">Send it again</button>
                  <button onClick={() => revoke(r.id)} className="btn btn-ghost w-full text-muted">Cancel this request</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="px-1 text-sm leading-relaxed text-muted">
        Whoever you send this to should only write what they actually remember or witnessed themselves. Their
        statement is kept with your record and can be included in your claim packet, clearly marked as theirs,
        never presented as your own words.
      </p>
    </div>
  );
}
