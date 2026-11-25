"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { listServiceEvents, deleteServiceEvent, PROVENANCE_LABEL, INFORMED_CONSENT_LABEL, type ServiceEvent } from "@/lib/serviceEvents";

export default function ShotsListCard() {
  const { user, supabase } = useAuth();
  const [ready, setReady] = useState(false);
  const [notSetUp, setNotSetUp] = useState(false);
  const [events, setEvents] = useState<ServiceEvent[]>([]);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await listServiceEvents(supabase);
    if ("error" in res) { setNotSetUp(res.error === "not-set-up"); return; }
    setEvents(res.events);
  }, [supabase]);

  useEffect(() => {
    if (!user) return;
    (async () => { await load(); setReady(true); })();
  }, [user, load]);

  async function remove(id: string) {
    await deleteServiceEvent(supabase, id);
    setConfirmDel(null);
    await load();
  }

  if (!ready) return null;

  if (notSetUp) {
    return (
      <div className="card p-5">
        <h2 className="text-lg font-semibold tracking-tight text-ink">Your entries</h2>
        <p className="mt-2 text-[0.9375rem] text-muted">This feature is on its way. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h2 className="text-lg font-semibold tracking-tight text-ink">Your entries</h2>
      <Link href="/shots/add" className="btn btn-primary btn-lg mt-4 w-full sm:w-auto">Add a shot</Link>
      {!events.length ? (
        <p className="mt-4 text-[0.9375rem] text-muted">Nothing logged yet. Start with whatever you remember. The year alone is worth writing down.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {events.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line p-4">
              <div className="min-w-0 flex-1">
                <div className="text-[0.9375rem] font-semibold text-ink">{e.label}</div>
                <div className="mt-0.5 text-sm text-muted">
                  {e.date_precision === "unsure" ? "Year not sure" : e.event_year ?? "Year not noted"}
                  {", "}
                  {PROVENANCE_LABEL[e.provenance]}
                  {e.informed_consent && (
                    <>
                      {", "}
                      {INFORMED_CONSENT_LABEL[e.informed_consent]}
                    </>
                  )}
                </div>
              </div>
              {confirmDel === e.id ? (
                <div className="flex flex-none flex-wrap gap-2">
                  <button type="button" onClick={() => setConfirmDel(null)} className="btn btn-secondary">Keep it</button>
                  <button type="button" onClick={() => remove(e.id)} className="btn btn-danger">Remove</button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDel(e.id)}
                  aria-label={`Remove ${e.label}`}
                  className="btn btn-ghost flex-none text-muted"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
