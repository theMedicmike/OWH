"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import MonthYearWheel from "./MonthYearWheel";
import { SHOTS, GROUP_LABEL, type Shot, type ShotGroup } from "@/lib/shotlibrary";
import { createServiceEvent, INFORMED_CONSENT_OPTIONS, type Provenance, type InformedConsent, type DatePrecision, type ServiceEventKind } from "@/lib/serviceEvents";

const GROUPS: ShotGroup[] = ["basic", "posted", "yearly", "other"];
const PROVENANCE_OPTIONS: { value: Provenance; label: string }[] = [
  { value: "recalled", label: "I remember it" },
  { value: "in_record", label: "It's in my record" },
  { value: "document_held", label: "I have the document" },
];

type Picked = { label: string; refSlug: string | null; kind: ServiceEventKind };

export default function ShotCaptureFlow() {
  const [query, setQuery] = useState("");
  const [openGroup, setOpenGroup] = useState<ShotGroup | null>(null);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [freeText, setFreeText] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return SHOTS.filter((s) => s.name.toLowerCase().includes(q) || s.hook.toLowerCase().includes(q));
  }, [query]);

  function pickShot(s: Shot) {
    setPicked({ label: s.name, refSlug: s.slug, kind: s.group === "other" ? "medication" : "vaccination" });
  }
  function pickFreeText() {
    const label = freeText.trim();
    if (!label) return;
    setPicked({ label, refSlug: null, kind: "other" });
  }

  if (picked) return <CaptureSheet picked={picked} onCancel={() => setPicked(null)} />;

  const Row = ({ s }: { s: Shot }) => (
    <button
      onClick={() => pickShot(s)}
      className="flex w-full items-baseline justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-canvas"
    >
      <span className="font-medium text-ink">{s.name}</span>
      <span className="text-xs text-muted">{s.hook}</span>
    </button>
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Search by name or how it was given</label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. anthrax, the yellow card, two pills"
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-faint focus:border-brand focus:ring-2 focus:ring-brand/15"
        />
      </div>

      <div className="rounded-xl border border-dashed border-line p-4">
        <label className="mb-1 block text-xs font-medium text-muted">Don&apos;t see it, or don&apos;t know the name?</label>
        <div className="flex gap-2">
          <input
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="Type it in your own words"
            className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-faint focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
          <button onClick={pickFreeText} disabled={!freeText.trim()} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-600 disabled:opacity-50">
            ＋ Something else
          </button>
        </div>
      </div>

      {filtered ? (
        <div className="rounded-xl border border-line bg-surface">
          {filtered.length === 0 ? (
            <p className="p-4 text-sm text-muted">Nothing matches. Type it in your own words above instead.</p>
          ) : (
            <div className="divide-y divide-line">{filtered.map((s) => <Row key={s.slug} s={s} />)}</div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {GROUPS.map((g) => {
            const items = SHOTS.filter((s) => s.group === g).sort((a, b) => a.name.localeCompare(b.name));
            const open = openGroup === g;
            return (
              <div key={g} className="rounded-xl border border-line bg-surface">
                <button
                  onClick={() => setOpenGroup(open ? null : g)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-ink"
                >
                  {GROUP_LABEL[g]}
                  <span className="text-muted">{open ? "−" : "+"}</span>
                </button>
                {open && <div className="divide-y divide-line border-t border-line">{items.map((s) => <Row key={s.slug} s={s} />)}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CaptureSheet({ picked, onCancel }: { picked: Picked; onCancel: () => void }) {
  const { supabase } = useAuth();
  const [year, setYear] = useState(new Date().getUTCFullYear());
  const [month, setMonth] = useState(0); // 0 = not sure, 1-12
  const [day, setDay] = useState(0); // 0 = not set
  const [unsure, setUnsure] = useState(false);
  const [provenance, setProvenance] = useState<Provenance | null>(null);
  const [informedConsent, setInformedConsent] = useState<InformedConsent | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);

  const canSave = provenance !== null && informedConsent !== null;

  async function save() {
    if (!canSave || !provenance || !informedConsent) return;
    setBusy(true);
    setErr("");
    const datePrecision: DatePrecision = unsure ? "unsure" : day ? "day" : month ? "month" : "year";
    const res = await createServiceEvent(supabase, {
      kind: picked.kind,
      refSlug: picked.refSlug,
      label: picked.label,
      eventYear: unsure ? null : year,
      eventMonth: unsure || !month ? null : month,
      eventDay: unsure || !day ? null : day,
      datePrecision,
      provenance,
      informedConsent,
      note,
    });
    setBusy(false);
    if (res.status === "error") { setErr(res.message === "not-set-up" ? "This feature isn't switched on yet — nothing was saved." : res.message); return; }
    setSaved(true);
  }

  if (saved) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-canvas p-5">
        <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-success">
              <path d="m5 13 4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-ink">Saved.</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{picked.label} is on your shot record now.</p>
          <Link
            href="/shots"
            className="mt-5 block w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground transition hover:bg-brand-600"
          >
            See your shot record →
          </Link>
          <button onClick={onCancel} className="mt-2.5 w-full rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink hover:bg-canvas">
            Add another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-canvas">
      <div className="mx-auto w-full max-w-lg flex-1 p-5">
        <button onClick={onCancel} className="mb-4 text-sm font-medium text-muted hover:text-ink">← Back</button>
        <h2 className="text-lg font-bold text-ink">{picked.label}</h2>

        <div className="mt-5">
          <label className="mb-1 block text-xs font-medium text-muted">When?</label>
          {unsure ? (
            <div className="rounded-lg border border-line bg-white px-3 py-2.5 text-center text-sm text-faint opacity-50">Not sure</div>
          ) : (
            <MonthYearWheel month={month} year={year} day={day} onMonthChange={setMonth} onYearChange={setYear} onDayChange={setDay} minYear={1940} />
          )}
          <label className="mt-2 flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" checked={unsure} onChange={(e) => { setUnsure(e.target.checked); if (e.target.checked) { setMonth(0); setDay(0); } }} />
            I&apos;m not sure of the year
          </label>
        </div>

        <div className="mt-5">
          <label className="mb-1 block text-xs font-medium text-muted">How do you know?</label>
          <div className="flex flex-wrap gap-2">
            {PROVENANCE_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setProvenance(o.value)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                  provenance === o.value ? "border-brand bg-brand text-brand-foreground" : "border-line bg-white text-ink hover:bg-canvas"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-faint">
            Remembered isn&apos;t worse than documented — it&apos;s just different, and whoever reads this later needs to know which is which.
          </p>
        </div>

        <div className="mt-5">
          <label className="mb-1 block text-xs font-medium text-muted">Were you told what it was, beforehand?</label>
          <div className="flex flex-wrap gap-2">
            {INFORMED_CONSENT_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setInformedConsent(o.value)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                  informedConsent === o.value ? "border-brand bg-brand text-brand-foreground" : "border-line bg-white text-ink hover:bg-canvas"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-faint">
            This is about what you were told, not what was actually in it — the label for that is on this shot&apos;s library page. Most of the military is mandatory either way; what varies is whether anyone explained it.
          </p>
        </div>

        <div className="mt-5">
          <label className="mb-1 block text-xs font-medium text-muted">Anything you want to note about that time</label>
          <textarea
            value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={500}
            className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
        </div>

        {err && <p className="mt-3 text-xs text-scarlet">{err}</p>}

        <button
          onClick={save}
          disabled={!canSave || busy}
          className="mt-6 w-full rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-brand-foreground transition hover:bg-brand-600 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
