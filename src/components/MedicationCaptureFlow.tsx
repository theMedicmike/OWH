"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import WheelPicker from "./WheelPicker";
import { searchSeed, type SeedMedication } from "@/lib/medicationSeed";
import { createMedication } from "@/lib/medications";

const YEARS = Array.from({ length: new Date().getUTCFullYear() - 1940 + 1 }, (_, i) => String(1940 + i));
const NOT_SET = "Not sure";
const YEAR_OPTIONS = [NOT_SET, ...YEARS];

export default function MedicationCaptureFlow() {
  const { supabase } = useAuth();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<SeedMedication | null>(null);
  const [takenFor, setTakenFor] = useState("");
  const [stillTaking, setStillTaking] = useState<boolean | null>(null);
  const [startedIdx, setStartedIdx] = useState(0);
  const [stoppedIdx, setStoppedIdx] = useState(0);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const suggestions = useMemo(() => searchSeed(query), [query]);
  // Typed-in names are first-class: the seed list is an on-ramp, not a limit,
  // and openFDA holds ~260,000 labels. Anything typed still gets looked up.
  const name = picked ? picked.generic : query.trim();
  const canSave = name.length > 1;

  async function save() {
    if (!canSave) return;
    setBusy(true);
    setErr("");
    const res = await createMedication(supabase, {
      name,
      genericName: picked ? picked.generic : null,
      brandName: picked && picked.brands.length ? picked.brands[0] : null,
      takenFor,
      stillTaking,
      startedYear: startedIdx > 0 ? parseInt(YEAR_OPTIONS[startedIdx], 10) : null,
      stoppedYear: stoppedIdx > 0 ? parseInt(YEAR_OPTIONS[stoppedIdx], 10) : null,
      note,
    });
    setBusy(false);
    if (res.status === "error") { setErr(res.message); return; }
    router.push(`/medications/${res.id}`);
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="rounded-xl border border-line bg-canvas p-4 text-xs leading-relaxed text-muted">
        Nothing here is submitted anywhere. This is your own list of what you take, kept in your record until
        you choose to bring it to a VSO or your clinician. Nothing you write is touched by AI.
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-ink">Which medication?</label>
        <p className="mb-2 text-xs leading-relaxed text-faint">
          Type the name — generic or brand, whichever you know it by. If it isn&apos;t in the list, type it anyway;
          the FDA&apos;s own database covers far more than we can list here.
        </p>
        <input
          value={picked ? picked.generic : query}
          onChange={(e) => { setPicked(null); setQuery(e.target.value); }}
          placeholder="e.g. ibuprofen, Motrin, sertraline…"
          className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-brand focus:outline-none"
        />
        {!picked && suggestions.length > 0 && (
          <ul className="mt-2 space-y-1">
            {suggestions.map((s) => (
              <li key={s.generic}>
                <button
                  type="button"
                  onClick={() => { setPicked(s); setQuery(s.generic); }}
                  className="w-full rounded-lg border border-line bg-white px-3 py-2 text-left text-sm hover:border-brand hover:bg-canvas"
                >
                  <span className="font-medium text-ink">{s.generic}</span>
                  {s.brands.length > 0 && <span className="text-muted"> · {s.brands.join(", ")}</span>}
                  <span className="block text-xs text-faint">{s.klass}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {picked?.historicalNote && (
          <p className="mt-2 rounded-lg border border-line bg-canvas px-3 py-2 text-xs leading-relaxed text-muted">
            {picked.historicalNote}
          </p>
        )}
      </div>

      {canSave && (
        <>
          {/* The 38 CFR 3.310 hinge. Free text, always — the app never decides
              that a drug was treating a service-connected condition. */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-ink">What were you taking it for?</label>
            <p className="mb-2 text-xs leading-relaxed text-faint">
              This is the part that matters most. If a medication was treating something already connected to your
              service, that changes which routes your VSO can look at.
            </p>
            <input
              value={takenFor}
              onChange={(e) => setTakenFor(e.target.value)}
              placeholder="e.g. my back, sleep, PTSD, blood pressure"
              className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <div className="mb-1 text-sm font-semibold text-ink">Are you still taking it?</div>
            <div className="flex flex-wrap gap-2">
              {[
                { v: true, label: "Still taking it" },
                { v: false, label: "Stopped" },
              ].map((o) => (
                <button
                  key={String(o.v)}
                  type="button"
                  aria-pressed={stillTaking === o.v}
                  onClick={() => setStillTaking(stillTaking === o.v ? null : o.v)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${stillTaking === o.v ? "border-brand bg-brand/10 font-semibold text-brand" : "border-line text-muted hover:bg-canvas"}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Started around</label>
              <WheelPicker options={YEAR_OPTIONS} index={startedIdx} onChange={setStartedIdx} ariaLabel="Year you started" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Stopped around</label>
              <WheelPicker
                options={YEAR_OPTIONS}
                index={stoppedIdx}
                onChange={setStoppedIdx}
                ariaLabel="Year you stopped"
                disabled={stillTaking === true}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Anything else worth noting (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Who prescribed it, how long you were on it, anything you noticed."
              className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-brand focus:outline-none"
            />
          </div>

          {err && <p className="text-xs text-scarlet">{err}</p>}

          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={busy || !canSave}
              className="flex-1 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand-600 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save"}
            </button>
            <Link href="/medications" className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-muted hover:bg-canvas">
              Not now
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
