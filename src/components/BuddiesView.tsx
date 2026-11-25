"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { EXPOSURE_LABEL } from "@/lib/education";

type Candidate = { exposure_id: string; place: string | null; ev_year: number | null; exposure_class: string };
type Connection = {
  id: string;
  direction: "sent" | "received";
  status: "pending" | "accepted" | "declined";
  place: string | null;
  ev_year: number | null;
  other_name: string | null;
  other_contact: string | null;
};

// Every action on this page is one tap, and every tap target is full size.
// Nothing about the rules changed: corroboration is only what he witnessed,
// and reconnection is double opt-in (names and contact details are shared
// only once both veterans accept).
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="m5 12 4 4L19 7" />
    </svg>
  );
}

export default function BuddiesView() {
  const { user, supabase } = useAuth();
  const [consent, setConsent] = useState<Record<string, unknown>>({});
  const [discoverable, setDiscoverable] = useState(false);
  const [contactable, setContactable] = useState(false);
  const [contactNote, setContactNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [requested, setRequested] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);

  const loadConnections = useCallback(async () => {
    const { data } = await supabase.rpc("list_buddy_connections");
    setConnections((data ?? []) as Connection[]);
  }, [supabase]);

  const loadCandidates = useCallback(async () => {
    const { data } = await supabase.rpc("find_corroboration_candidates");
    setCandidates((data ?? []) as Candidate[]);
  }, [supabase]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      let { data: m } = await supabase.from("members").select("consent").eq("auth_id", user.id).maybeSingle();
      if (!m) {
        const c = await supabase.from("members").insert({ auth_id: user.id }).select("consent").single();
        m = c.data;
      }
      const cs = (m?.consent ?? {}) as Record<string, unknown>;
      setConsent(cs);
      setDiscoverable(Boolean(cs.corroborate));
      setContactable(Boolean(cs.contactable));
      setContactNote((cs.contact_note as string) ?? "");
      await Promise.all([loadCandidates(), loadConnections()]);
      setReady(true);
    })();
  }, [user, supabase, loadCandidates, loadConnections]);

  async function saveConsent(next: Record<string, unknown>) {
    setConsent(next);
    if (user) await supabase.from("members").update({ consent: next }).eq("auth_id", user.id);
  }

  async function confirm(c: Candidate) {
    await supabase.rpc("corroborate", { p_exposure_id: c.exposure_id, p_witness_type: "same_location" });
    setConfirmed((p) => new Set(p).add(c.exposure_id));
  }

  async function reconnect(c: Candidate) {
    const { data } = await supabase.rpc("request_buddy_connection", { p_exposure_id: c.exposure_id });
    const msg =
      ({ sent: "Request sent", not_contactable: "They are not open to contact yet", self: "That is your own record", not_found: "Not found", no_member: "Sign in first" } as Record<string, string>)[
        data as string
      ] ?? "Request sent";
    setRequested((p) => ({ ...p, [c.exposure_id]: msg }));
    if (data === "sent") loadConnections();
  }

  async function respond(id: string, accept: boolean) {
    await supabase.rpc("respond_buddy_connection", { p_connection_id: id, p_accept: accept });
    loadConnections();
  }

  if (!ready) return <p className="text-[15px] text-muted">Loading…</p>;

  const pendingReceived = connections.filter((c) => c.direction === "received" && c.status === "pending");
  const accepted = connections.filter((c) => c.status === "accepted");
  const sentPending = connections.filter((c) => c.direction === "sent" && c.status === "pending");

  const toggleRow = (
    id: string,
    checked: boolean,
    onChange: (v: boolean) => void,
    title: string,
    detail: string,
  ) => (
    <label htmlFor={id} className="flex min-h-14 cursor-pointer items-start gap-3 rounded-xl px-1 py-2 hover:bg-canvas">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-6 w-6 flex-none accent-brand" />
      <span>
        <span className="block text-[15px] font-semibold text-ink">{title}</span>
        <span className="mt-0.5 block text-sm leading-relaxed text-muted">{detail}</span>
      </span>
    </label>
  );

  return (
    <div className="space-y-6">
      {/* A veteran reached out: the human moment comes first */}
      {pendingReceived.length > 0 && (
        <section className="card card-raise p-5 sm:p-6">
          <h3 className="text-lg font-semibold tracking-tight text-ink">Someone wants to reconnect</h3>
          <p className="mt-1 text-[15px] leading-relaxed text-muted">A veteran who served where you did. Their name is shown only if you accept.</p>
          <ul className="mt-4 space-y-3">
            {pendingReceived.map((c) => (
              <li key={c.id} className="rounded-xl bg-canvas p-4">
                <p className="text-[15px] text-ink">
                  A veteran who served near <span className="font-semibold">{c.place || "your location"}</span>
                  {c.ev_year ? <span className="text-muted"> in {c.ev_year}</span> : null}
                </p>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button onClick={() => respond(c.id, true)} className="btn btn-primary btn-lg w-full">Accept</button>
                  <button onClick={() => respond(c.id, false)} className="btn btn-secondary btn-lg w-full">Decline</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Candidates: corroborate + reconnect */}
      <section>
        <h3 className="text-xl font-semibold tracking-tight text-ink">Veterans who served where you did</h3>
        <p className="mt-1 text-[15px] leading-relaxed text-muted">
          Tap &ldquo;I was there too&rdquo; to confirm an exposure you witnessed. It strengthens both records. Or ask
          to reconnect with the veteran who logged it.
        </p>
        {candidates.length === 0 ? (
          <div className="card mt-3 p-5">
            <p className="text-[15px] leading-relaxed text-muted">
              No overlaps yet. As more veterans log where they served, the ones who were where you were will appear
              here. The more places you add, the more overlaps you can find.
            </p>
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {candidates.map((c) => {
              const req = requested[c.exposure_id];
              const isConfirmed = confirmed.has(c.exposure_id);
              return (
                <li key={c.exposure_id} className="card p-4 sm:p-5">
                  <p className="text-[15px] leading-relaxed text-ink">
                    A veteran logged <span className="font-semibold">{EXPOSURE_LABEL[c.exposure_class] ?? c.exposure_class}</span>{" "}
                    near <span className="font-semibold">{c.place || "your location"}</span>
                    {c.ev_year ? <span className="text-muted"> in {c.ev_year}</span> : null}.
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {isConfirmed ? (
                      <span className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-success-soft text-[15px] font-semibold text-success">
                        <CheckIcon /> You confirmed this
                      </span>
                    ) : (
                      <button onClick={() => confirm(c)} className="btn btn-secondary btn-lg w-full">I was there too</button>
                    )}
                    {req ? (
                      <span className="flex min-h-12 items-center justify-center rounded-xl bg-canvas text-[15px] font-semibold text-muted">{req}</span>
                    ) : (
                      <button onClick={() => reconnect(c)} className="btn btn-primary btn-lg w-full">Reconnect</button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {sentPending.length > 0 && (
          <p className="mt-3 text-[15px] text-muted">
            {sentPending.length} reconnection request{sentPending.length === 1 ? "" : "s"} waiting for a reply.
          </p>
        )}
      </section>

      {/* Connected buddies */}
      {accepted.length > 0 && (
        <section>
          <h3 className="text-xl font-semibold tracking-tight text-ink">Your battle buddies</h3>
          <div className="card mt-3 overflow-hidden">
            {accepted.map((c) => (
              <div key={c.id} className="row items-start">
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold">{c.other_name || "A fellow veteran"}</span>
                  <span className="mt-0.5 block text-sm text-muted">Served near {c.place || "the same place"}{c.ev_year ? ` in ${c.ev_year}` : ""}</span>
                  {c.other_contact ? (
                    <span className="mt-1 block text-[15px] text-ink">Reach them: <span className="font-semibold">{c.other_contact}</span></span>
                  ) : (
                    <span className="mt-1 block text-sm text-muted">No contact shared yet.</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Privacy & reachability */}
      <section className="card p-5 sm:p-6">
        <h3 className="text-lg font-semibold tracking-tight text-ink">Let the people you served with find you</h3>
        <div className="mt-3 space-y-1">
          {toggleRow(
            "buddy-corroborate",
            discoverable,
            (v) => { setDiscoverable(v); saveConsent({ ...consent, corroborate: v }); },
            "Let others who served where I did confirm my exposures",
            "Only your place, time, and exposure type are shared for matching. Never your name or health details.",
          )}
          {toggleRow(
            "buddy-contactable",
            contactable,
            (v) => { setContactable(v); saveConsent({ ...consent, contactable: v }); },
            "I am open to reconnecting with battle buddies",
            "A veteran who served where you did can ask to connect. Your name and contact are shared only after you accept.",
          )}
        </div>
        {contactable && (
          <div className="mt-3">
            <label htmlFor="buddy-contact" className="field-label">How should a buddy reach you? Shared only when you both connect.</label>
            <div className="flex gap-2">
              <input
                id="buddy-contact"
                value={contactNote}
                onChange={(e) => { setContactNote(e.target.value); setNoteSaved(false); }}
                placeholder="Email, phone, or social handle"
                className="field flex-1"
              />
              <button
                onClick={async () => { setSavingNote(true); await saveConsent({ ...consent, contact_note: contactNote, contactable: true }); setSavingNote(false); setNoteSaved(true); }}
                disabled={savingNote}
                className="btn btn-primary flex-none"
              >
                {savingNote ? "Saving…" : noteSaved ? "Saved" : "Save"}
              </button>
            </div>
          </div>
        )}
      </section>

      <p className="px-1 text-sm leading-relaxed text-muted">
        Confirm only what you actually witnessed. Reconnection is double opt-in: names and contact details are shared
        only when both veterans agree. There is no public messaging here; you connect, then talk on your own terms.
      </p>
    </div>
  );
}
