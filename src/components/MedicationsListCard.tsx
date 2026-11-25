"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { listMedications, deleteMedication, type Medication } from "@/lib/medications";

function whenLabel(m: Medication): string {
  if (m.started_year && m.stopped_year) return `${m.started_year}–${m.stopped_year}`;
  if (m.started_year && m.still_taking) return `since ${m.started_year}`;
  if (m.started_year) return `from ${m.started_year}`;
  if (m.still_taking) return "still taking";
  if (m.stopped_year) return `until ${m.stopped_year}`;
  return "";
}

export default function MedicationsListCard() {
  const { user, supabase } = useAuth();
  const [ready, setReady] = useState(false);
  const [notSetUp, setNotSetUp] = useState(false);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await listMedications(supabase);
    if ("error" in res) { setNotSetUp(true); return; }
    setMeds(res.medications);
  }, [supabase]);

  useEffect(() => {
    if (!user) return;
    (async () => { await load(); setReady(true); })();
  }, [user, load]);

  async function remove(id: string) {
    await deleteMedication(supabase, id);
    setConfirmDel(null);
    await load();
  }

  if (!ready) return null;

  if (notSetUp) {
    return (
      <div className="card p-5">
        <h2 className="text-lg font-semibold tracking-tight text-ink">What you take</h2>
        <p className="mt-2 text-[0.9375rem] text-muted">This feature is on its way. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h2 className="text-lg font-semibold tracking-tight text-ink">What you take</h2>
      <Link href="/medications/add" className="btn btn-primary btn-lg mt-4 w-full sm:w-auto">
        Add a medication
      </Link>
      {!meds.length ? (
        <p className="mt-4 text-[0.9375rem] text-muted">
          Nothing added yet. Start with whatever you take most days. You don&apos;t need the bottle in front of you.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {meds.map((m) => {
            const when = whenLabel(m);
            return (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line p-4">
                <div className="min-w-0 flex-1">
                  <div className="text-[0.9375rem] font-semibold text-ink">
                    {m.name}
                    {m.brand_name && m.brand_name.toLowerCase() !== m.name.toLowerCase() && (
                      <span className="font-normal text-muted">, {m.brand_name}</span>
                    )}
                  </div>
                  <div className="mt-0.5 text-sm text-muted">
                    {m.taken_for ? `for ${m.taken_for}` : "no reason noted yet"}
                    {when && <>, {when}</>}
                  </div>
                </div>
                <div className="flex flex-none flex-wrap items-center gap-2">
                  {confirmDel === m.id ? (
                    <>
                      <button type="button" onClick={() => setConfirmDel(null)} className="btn btn-secondary">Keep it</button>
                      <button type="button" onClick={() => remove(m.id)} className="btn btn-danger">Remove</button>
                    </>
                  ) : (
                    <>
                      <Link href={`/medications/${m.id}`} className="btn btn-secondary" aria-label={`Open ${m.name}`}>
                        Open
                      </Link>
                      <button
                        type="button"
                        onClick={() => setConfirmDel(m.id)}
                        aria-label={`Remove ${m.name}`}
                        className="btn btn-ghost text-muted"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
