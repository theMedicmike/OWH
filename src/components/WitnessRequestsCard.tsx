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

type ExposureOpt = { id: string; label: string };
type ConditionOpt = { id: string; label: string };

const card = "rounded-xl border border-line bg-surface p-5";

export default function WitnessRequestsCard() {
  const { user, supabase } = useAuth();
  const [ready, setReady] = useState(false);
  const [notSetUp, setNotSetUp] = useState(false);
  const [exposures, setExposures] = useState<ExposureOpt[]>([]);
  const [conditions, setConditions] = useState<ConditionOpt[]>([]);
  const [requests, setRequests] = useState<StatementRequest[]>([]);
  const [statements, setStatements] = useState<WitnessStatement[]>([]);

  const [subjectType, setSubjectType] = useState<StatementSubjectType>("general");
  const [subjectId, setSubjectId] = useState("");
  const [note, setNote] = useState("");
  const [creating, setCreating] = useState(false);
  const [freshLink, setFreshLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
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
      type ExRow = { id: string; exposure_class: string; check_ins: { place_name: string | null; date_start: string | null }[] | null };
      setExposures(
        ((ex ?? []) as ExRow[]).map((r) => {
          const ci = r.check_ins?.[0];
          const place = ci?.place_name;
          const year = ci?.date_start ? new Date(ci.date_start).getUTCFullYear() : null;
          const where = [place, year].filter(Boolean).join(", ");
          return { id: r.id, label: `${EXPOSURE_LABEL[r.exposure_class] ?? r.exposure_class}${where ? ` — ${where}` : ""}` };
        }),
      );
      setConditions(((co ?? []) as { id: string; label: string }[]).map((r) => ({ id: r.id, label: r.label })));
      await load();
      setReady(true);
    })();
  }, [user, supabase, load]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  async function create() {
    if (subjectType !== "general" && !subjectId) {
      setErr("Pick which one this statement is about.");
      return;
    }
    setErr("");
    setCreating(true);
    const res = await createStatementRequest(supabase, {
      subjectType,
      subjectId: subjectType === "general" ? null : subjectId,
      note,
    });
    setCreating(false);
    if ("error" in res) {
      if (res.error === "not-set-up") setNotSetUp(true);
      else setErr(res.error);
      return;
    }
    setFreshLink(`${origin}/statement/${res.token}`);
    setNote("");
    setSubjectId("");
    await load();
  }

  async function copyLink(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be unavailable — the link is still shown for manual copy */
    }
  }

  async function shareLink(link: string) {
    const nav = navigator as Navigator & { share?: (data: { title?: string; text?: string; url?: string }) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ title: "Help confirm my service record", text: "Would you help confirm something about my time in service? It only takes a couple minutes.", url: link });
        return;
      } catch {
        /* user cancelled the share sheet — fall through to copy */
      }
    }
    copyLink(link);
  }

  async function revoke(id: string) {
    await revokeStatementRequest(supabase, id);
    await load();
  }

  if (!ready) return null;

  if (notSetUp) {
    return (
      <div className={card}>
        <div className="text-sm font-semibold text-ink">Ask someone to confirm your record</div>
        <p className="mt-2 text-sm text-muted">This feature is on its way — check back soon.</p>
      </div>
    );
  }

  const statementsFor = (requestId: string) => statements.filter((s) => s.request_id === requestId);
  const pending = requests.filter((r) => r.status === "pending");
  const submitted = requests.filter((r) => r.status === "submitted");

  return (
    <div className="space-y-4">
      <div className={card}>
        <div className="text-sm font-semibold text-ink">Ask someone to confirm your record</div>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Not everyone who can vouch for you is on this app — a spouse, a battle buddy you&apos;ve lost touch with,
          a commander. Send them a private link. They don&apos;t need an account, and they see only what you
          choose below — nothing else in your record.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">What&apos;s this about?</label>
            <select
              value={subjectType}
              onChange={(e) => { setSubjectType(e.target.value as StatementSubjectType); setSubjectId(""); }}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            >
              <option value="general">My service in general</option>
              <option value="exposure">A specific exposure I logged</option>
              <option value="condition">A specific condition I logged</option>
            </select>
          </div>

          {subjectType === "exposure" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Which exposure?</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
              >
                <option value="">Choose one…</option>
                {exposures.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
              </select>
              {exposures.length === 0 && <p className="mt-1 text-xs text-faint">You haven&apos;t logged an exposure yet.</p>}
            </div>
          )}

          {subjectType === "condition" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Which condition?</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
              >
                <option value="">Choose one…</option>
                {conditions.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              {conditions.length === 0 && <p className="mt-1 text-xs text-faint">You haven&apos;t logged a condition yet.</p>}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Anything to jog their memory? (optional, shown to them)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="e.g. This was our deployment together in 2009 at COP Blackhawk."
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
          </div>

          {err && <p className="text-xs text-scarlet">{err}</p>}

          <button
            onClick={create}
            disabled={creating}
            className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground transition hover:bg-brand-600 disabled:opacity-60"
          >
            {creating ? "Creating…" : "Create a link"}
          </button>
        </div>

        {freshLink && (
          <div className="mt-4 rounded-lg border border-brand/30 bg-brand/5 p-3">
            <div className="text-xs font-medium text-ink">Your link is ready — send it however you&apos;d reach them:</div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <code className="flex-1 truncate rounded bg-white px-2 py-1.5 text-xs text-ink">{freshLink}</code>
              <button onClick={() => shareLink(freshLink)} className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground hover:bg-brand-600">Share</button>
              <button onClick={() => copyLink(freshLink)} className="rounded-md border border-line px-3 py-1.5 text-xs text-ink hover:bg-canvas">{copied ? "Copied" : "Copy"}</button>
            </div>
            <div className="mt-2 text-[11px] leading-relaxed text-faint">Good for 90 days. Only they can open it — the link itself is the key.</div>
          </div>
        )}
      </div>

      {(pending.length > 0 || submitted.length > 0) && (
        <div className={card}>
          <div className="text-sm font-semibold text-ink">Your requests</div>
          <ul className="mt-3 space-y-3">
            {submitted.map((r) => (
              <li key={r.id} className="rounded-lg border border-line p-3">
                <div className="text-sm font-medium text-ink">{r.subject_label}</div>
                {statementsFor(r.id).map((s) => (
                  <div key={s.id} className="mt-2 rounded-md bg-canvas p-3">
                    <div className="text-xs font-semibold text-ink">{s.witness_name} <span className="font-normal text-muted">· {s.relationship}</span></div>
                    <p className="mt-1 text-sm leading-relaxed text-ink/90">&ldquo;{s.statement}&rdquo;</p>
                  </div>
                ))}
              </li>
            ))}
            {pending.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line p-3">
                <div>
                  <div className="text-sm text-ink">{r.subject_label}</div>
                  <div className="text-xs text-muted">Waiting for a reply</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => copyLink(`${origin}/statement/${r.token}`)} className="rounded-md border border-line px-3 py-1 text-xs text-ink hover:bg-canvas">Copy link</button>
                  <button onClick={() => revoke(r.id)} className="rounded-md border border-line px-3 py-1 text-xs text-muted hover:bg-canvas">Cancel</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="px-1 text-xs leading-relaxed text-faint">
        Whoever you send this to should only write what they actually remember or witnessed themselves. Their
        statement is kept with your record and can be included in your claim packet, clearly marked as theirs —
        never presented as your own words.
      </p>
    </div>
  );
}
