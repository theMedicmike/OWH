"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { listMedications, deleteMedication, type Medication } from "@/lib/medications";

const card = "rounded-xl border border-line bg-surface p-5";

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
      <div className={card}>
        <div className="text-sm font-semibold text-ink">What you take</div>
        <p className="mt-2 text-sm text-muted">This feature is on its way — check back soon.</p>
      </div>
    );
  }

  return (
    <div className={card}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-ink">What you take</div>
        <Link href="/medications/add" className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground hover:bg-brand-600">
          ＋ Add one
        </Link>
      </div>
      {!meds.length ? (
        <p className="mt-3 text-sm text-muted">
          Nothing added yet. Start with whatever you take most days — you don&apos;t need the bottle in front of you.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {meds.map((m) => {
            const when = whenLabel(m);
            return (
              <li key={m.id} className="flex items-center justify-between gap-2 rounded-lg border border-line p-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink">
                    {m.name}
                    {m.brand_name && m.brand_name.toLowerCase() !== m.name.toLowerCase() && (
                      <span className="font-normal text-muted"> · {m.brand_name}</span>
                    )}
                  </div>
                  <div className="text-xs text-muted">
                    {m.taken_for ? `for ${m.taken_for}` : "no reason noted yet"}
                    {when && <span className="text-faint"> · {when}</span>}
                  </div>
                </div>
                <div className="flex flex-none items-center gap-2">
                  <Link href={`/medications/${m.id}`} className="text-xs font-semibold text-brand hover:underline">
                    Open
                  </Link>
                  {confirmDel === m.id ? (
                    <button onClick={() => remove(m.id)} className="text-xs font-semibold text-scarlet hover:underline">Confirm remove</button>
                  ) : (
                    <button onClick={() => setConfirmDel(m.id)} className="text-xs text-faint hover:text-red-600">Remove</button>
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
