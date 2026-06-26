"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";

const EXPOSURE_LABEL: Record<string, string> = {
  burn_pit: "Burn pits",
  heavy_metal: "Heavy metals",
  chemical_solvent: "Chemical / solvent",
  water_contamination: "Water contamination",
  pesticide: "Pesticide / herbicide",
  asbestos_silica: "Asbestos / silica",
  nerve_agent: "Nerve agent",
  particulate: "Particulate / dust",
  radiation: "Radiation / depleted uranium",
  pfas_afff: "PFAS / AFFF",
  gulf_war_agent: "Gulf War agent",
};

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

const card = "rounded-xl border border-line bg-surface p-5";

export default function BuddiesView() {
  const { user, supabase } = useAuth();
  const [consent, setConsent] = useState<Record<string, unknown>>({});
  const [discoverable, setDiscoverable] = useState(false);
  const [contactable, setContactable] = useState(false);
  const [contactNote, setContactNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
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
      ({ sent: "Request sent", not_contactable: "Not open to contact yet", self: "That's your own record", not_found: "Not found", no_member: "Sign in first" } as Record<string, string>)[
        data as string
      ] ?? "Request sent";
    setRequested((p) => ({ ...p, [c.exposure_id]: msg }));
    if (data === "sent") loadConnections();
  }

  async function respond(id: string, accept: boolean) {
    await supabase.rpc("respond_buddy_connection", { p_connection_id: id, p_accept: accept });
    loadConnections();
  }

  if (!ready) return <p className="text-sm text-muted">Loading…</p>;

  const pendingReceived = connections.filter((c) => c.direction === "received" && c.status === "pending");
  const accepted = connections.filter((c) => c.status === "accepted");
  const sentPending = connections.filter((c) => c.direction === "sent" && c.status === "pending");

  return (
    <div className="space-y-4">
      {/* Privacy & reachability */}
      <div className={card}>
        <div className="text-sm font-semibold text-ink">Be findable to those you served with</div>
        <label className="mt-3 flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={discoverable}
            onChange={(e) => { setDiscoverable(e.target.checked); saveConsent({ ...consent, corroborate: e.target.checked }); }}
            className="mt-0.5"
          />
          <span>
            <span className="font-medium text-ink">Let others who served where I did corroborate my exposures</span>
            <span className="mt-0.5 block text-xs text-muted">Only your place, time, and exposure type are shared for matching — never your name or health details.</span>
          </span>
        </label>
        <label className="mt-3 flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={contactable}
            onChange={(e) => { setContactable(e.target.checked); saveConsent({ ...consent, contactable: e.target.checked }); }}
            className="mt-0.5"
          />
          <span>
            <span className="font-medium text-ink">I&apos;m open to reconnecting with battle buddies</span>
            <span className="mt-0.5 block text-xs text-muted">A veteran who served where you did can ask to connect. Your name and contact are shared only after you accept.</span>
          </span>
        </label>
        {contactable && (
          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium text-muted">How should a buddy reach you? (shared only when you both connect)</label>
            <div className="flex gap-2">
              <input
                value={contactNote}
                onChange={(e) => setContactNote(e.target.value)}
                placeholder="email, phone, or social handle"
                className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
              />
              <button
                onClick={async () => { setSavingNote(true); await saveConsent({ ...consent, contact_note: contactNote, contactable: true }); setSavingNote(false); }}
                disabled={savingNote}
                className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-600 disabled:opacity-60"
              >
                {savingNote ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Incoming reconnection requests */}
      {pendingReceived.length > 0 && (
        <div className={card}>
          <div className="text-sm font-semibold text-ink">Reconnection requests</div>
          <div className="mt-1 text-xs text-muted">A veteran who served where you did wants to reconnect. Their name is shown only if you accept.</div>
          <ul className="mt-3 space-y-2">
            {pendingReceived.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line p-3">
                <span className="text-sm text-ink">
                  A veteran who served near <span className="font-medium">{c.place || "your location"}</span>
                  {c.ev_year ? <span className="text-muted"> in {c.ev_year}</span> : null}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => respond(c.id, true)} className="rounded-md bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground hover:bg-brand-600">Accept</button>
                  <button onClick={() => respond(c.id, false)} className="rounded-md border border-line px-3 py-1 text-xs text-muted hover:bg-canvas">Decline</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Connected buddies */}
      {accepted.length > 0 && (
        <div className={card}>
          <div className="text-sm font-semibold text-ink">Your battle buddies ({accepted.length})</div>
          <ul className="mt-3 space-y-2">
            {accepted.map((c) => (
              <li key={c.id} className="rounded-lg border border-line p-3 text-sm">
                <div className="font-medium text-ink">{c.other_name || "A fellow veteran"}</div>
                <div className="text-xs text-muted">Served near {c.place || "the same place"}{c.ev_year ? ` in ${c.ev_year}` : ""}</div>
                {c.other_contact ? (
                  <div className="mt-1 text-sm text-ink">Reach them: <span className="font-medium">{c.other_contact}</span></div>
                ) : (
                  <div className="mt-1 text-xs text-muted">No contact shared yet.</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Candidates: corroborate + reconnect */}
      <div className={card}>
        <div className="text-sm font-semibold text-ink">Veterans who served where you did</div>
        <div className="mt-1 text-xs text-muted">
          Confirm an exposure you witnessed (it strengthens both records), or ask to reconnect with the veteran who logged it.
        </div>

        {candidates.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No overlaps yet. As more veterans log their service, the ones who were where you were will appear here.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {candidates.map((c) => {
              const req = requested[c.exposure_id];
              const isConfirmed = confirmed.has(c.exposure_id);
              return (
                <li key={c.exposure_id} className="rounded-lg border border-line p-3">
                  <div className="text-sm text-ink">
                    A veteran logged{" "}
                    <span className="rounded-md bg-brand/10 px-2 py-0.5 text-xs text-brand">{EXPOSURE_LABEL[c.exposure_class] ?? c.exposure_class}</span>{" "}
                    near <span className="font-medium">{c.place || "your location"}</span>
                    {c.ev_year ? <span className="text-muted"> in {c.ev_year}</span> : null}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {isConfirmed ? (
                      <span className="text-xs font-medium text-success">✓ You confirmed this</span>
                    ) : (
                      <button onClick={() => confirm(c)} className="rounded-md border border-line px-3 py-1 text-xs text-ink hover:bg-canvas">I was there too</button>
                    )}
                    {req ? (
                      <span className="text-xs text-muted">{req}</span>
                    ) : (
                      <button onClick={() => reconnect(c)} className="rounded-md bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground hover:bg-brand-600">Reconnect</button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {sentPending.length > 0 && (
          <p className="mt-3 text-xs text-muted">{sentPending.length} reconnection request{sentPending.length === 1 ? "" : "s"} waiting for a reply.</p>
        )}
      </div>

      <p className="px-1 text-xs leading-relaxed text-faint">
        Confirm only what you actually witnessed. Reconnection is double opt-in — names and contact details are shared
        only when both veterans agree. There&apos;s no public messaging here; you connect, then talk on your own terms.
      </p>
    </div>
  );
}
