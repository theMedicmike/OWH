"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { listServiceEvents, deleteServiceEvent, PROVENANCE_LABEL, INFORMED_CONSENT_LABEL, type ServiceEvent } from "@/lib/serviceEvents";

const card = "rounded-xl border border-line bg-surface p-5";

export default function ShotsListCard() {
  const { user, supabase } = useAuth();
  const [ready, setReady] = useState(false);
  const [notSetUp, setNotSetUp] = useState(false);
  const [events, setEvents] = useState<ServiceEvent[]>([]);

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
    await load();
  }

  if (!ready) return null;

  if (notSetUp) {
    return (
      <div className={card}>
        <div className="text-sm font-semibold text-ink">Your entries</div>
        <p className="mt-2 text-sm text-muted">This feature is on its way — check back soon.</p>
      </div>
    );
  }

  return (
    <div className={card}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-ink">Your entries</div>
        <Link href="/shots/add" className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground hover:bg-brand-600">＋ Add a shot</Link>
      </div>
      {!events.length ? (
        <p className="mt-3 text-sm text-muted">Nothing logged yet. Start with whatever you remember — the year alone is worth writing down.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {events.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-2 rounded-lg border border-line p-3">
              <div>
                <div className="text-sm font-medium text-ink">{e.label}</div>
                <div className="text-xs text-muted">
                  {e.date_precision === "unsure" ? "Year not sure" : e.event_year ?? "—"}
                  {" · "}
                  <span className="text-faint">{PROVENANCE_LABEL[e.provenance]}</span>
                  {e.informed_consent && (
                    <>
                      {" · "}
                      <span className="text-faint">{INFORMED_CONSENT_LABEL[e.informed_consent]}</span>
                    </>
                  )}
                </div>
              </div>
              <button onClick={() => remove(e.id)} className="rounded-md border border-line px-2 py-1 text-xs text-muted hover:bg-canvas">Remove</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
