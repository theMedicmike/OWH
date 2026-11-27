"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { createServiceEvent, listServiceEvents, type Provenance, type ServiceEventKind } from "@/lib/serviceEvents";

// One tap from a shot onto the veteran's own shot record. Used at the top of
// each Shot library page, and inline under a row on the "Add a shot" list.
//
// The three "how do you know" answers ARE the add buttons. That is not a
// shortcut around the question: migration 0019 makes provenance NOT NULL on
// purpose ("an ungraded row must be unrepresentable"), so a one-tap add that
// quietly picked "I remember it" for him would grade his record on his
// behalf. Asking with the buttons keeps it one tap and keeps it his answer.
//
// What it does NOT ask, and therefore does not store: the year (saved as
// "Year not sure", never a guessed date) and whether anyone explained the
// shot (left blank). The quiet link below opens the full form on this shot
// for anyone who knows the year.
const ANSWERS: { value: Provenance; label: string }[] = [
  { value: "recalled", label: "I remember it" },
  { value: "in_record", label: "It's in my record" },
  { value: "document_held", label: "I have the document" },
];

type State = "loading" | "ask" | "saving" | "saved" | "already";

export default function ShotAddToRecord({
  slug,
  name,
  kind,
  inline = false,
  onAddWithDate,
}: {
  slug: string;
  name: string;
  kind: ServiceEventKind;
  /** Inside a list row: no card of its own, no heading. */
  inline?: boolean;
  /** When set, "add it with the date" opens the full form in place instead of navigating. */
  onAddWithDate?: () => void;
}) {
  const { user, supabase } = useAuth();
  const [state, setState] = useState<State>("loading");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!user) return;
    let alive = true;
    listServiceEvents(supabase).then((res) => {
      if (!alive) return;
      const onRecord = "events" in res && res.events.some((e) => e.ref_slug === slug);
      setState(onRecord ? "already" : "ask");
    });
    return () => { alive = false; };
  }, [user, supabase, slug]);

  async function add(provenance: Provenance) {
    setState("saving");
    setErr("");
    const res = await createServiceEvent(supabase, {
      kind,
      refSlug: slug,
      label: name,
      eventYear: null,
      eventMonth: null,
      eventDay: null,
      datePrecision: "unsure",
      provenance,
      informedConsent: null,
      note: "",
    });
    if (res.status === "error") {
      setErr(res.message === "not-set-up" ? "Shot records are not switched on yet. Nothing was saved." : "That did not save. Try again in a moment.");
      setState("ask");
      return;
    }
    setState("saved");
  }

  const wrap = inline ? "" : "card card-raise p-5 sm:p-6";

  if (!user || state === "loading") {
    return inline ? <p className="px-1 py-2 text-[0.9375rem] text-muted">One moment…</p> : null;
  }

  if (state === "saved" || state === "already") {
    return (
      <section className={wrap} aria-live="polite">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-success-soft text-success" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="m5 12 4 4L19 7" />
            </svg>
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-ink">
              {state === "saved" ? `${name} is on your shot record` : `${name} is already on your shot record`}
            </h2>
            {state === "saved" && (
              <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted">Saved without a date. It shows as &ldquo;Year not sure&rdquo;.</p>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href="/shots" className="btn btn-primary">See your shot record</Link>
          <button type="button" onClick={() => setState("ask")} className="btn btn-ghost">Add another dose</button>
        </div>
      </section>
    );
  }

  return (
    <section className={wrap}>
      {!inline && <h2 className="text-lg font-semibold tracking-tight text-ink">Add {name} to your shot record</h2>}
      <p className={`${inline ? "" : "mt-1"} text-[0.9375rem] leading-relaxed text-muted`}>Tap how you know, and it is saved.</p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {ANSWERS.map((a) => (
          <button
            key={a.value}
            type="button"
            onClick={() => add(a.value)}
            disabled={state === "saving"}
            className="btn btn-secondary btn-lg w-full"
          >
            {a.label}
          </button>
        ))}
      </div>
      {err && <p role="alert" className="mt-3 text-[0.9375rem] font-medium text-scarlet">{err}</p>}
      {onAddWithDate ? (
        <button type="button" onClick={onAddWithDate} className="mt-2 inline-flex min-h-11 items-center text-left text-[0.9375rem] font-semibold text-brand hover:underline">
          Know the year? Add it with the date instead
        </button>
      ) : (
        <Link href={`/shots/add?shot=${slug}`} className="mt-2 inline-flex min-h-11 items-center text-[0.9375rem] font-semibold text-brand hover:underline">
          Know the year? Add it with the date instead
        </Link>
      )}
    </section>
  );
}
