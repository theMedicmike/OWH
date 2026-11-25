"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../AuthProvider";
import { defaultShowFor, listRowMeta, listSources, upsertRowMeta, TIER_LABEL, type FpRowMeta, type FpSource, type RowTableKey, type Tier } from "@/lib/firstPage";
import { listMedications } from "@/lib/medications";
import { listServiceEvents } from "@/lib/serviceEvents";
import { EXPOSURE_LABEL, INCIDENT_LABEL } from "@/lib/education";
import { BackToHub, Input, Notice, PrimaryButton, SourceSelect, Stance, TextField, TierSelect, Toggle } from "./Controls";

// The rows that already live in the record: problems, medicines, postings,
// exposures and events, shots. Here the veteran decides what prints, attaches
// a source to each row, and adds the few fields the page needs that the record
// does not hold: a plain status for a problem, the medication directions copied
// word for word, the unit for a posting. Nothing here changes the record itself.

type Item = { key: RowTableKey; id: string; title: string; sub: string; defaultShow: boolean; defaultTier: Tier };

function RowCard({ item, meta, sources, onSave }: { item: Item; meta: FpRowMeta | undefined; sources: FpSource[]; onSave: (patch: Partial<FpRowMeta>) => Promise<void> }) {
  const [show, setShow] = useState<boolean>(meta?.show ?? item.defaultShow);
  const [sourceId, setSourceId] = useState<string | null>(meta?.source_id ?? null);
  const [tier, setTier] = useState<Tier | null>(meta?.tier ?? (meta?.source_id ? "record" : item.defaultTier));
  const [status, setStatus] = useState(meta?.status ?? "");
  const [directions, setDirections] = useState(meta?.directions ?? "");
  const [since, setSince] = useState(meta?.since_year ? String(meta.since_year) : "");
  const [unit, setUnit] = useState(meta?.unit ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const withheld = status === "withheld";

  async function save() {
    setBusy(true);
    await onSave({
      show, source_id: sourceId, tier,
      status: item.key === "check_ins" ? (withheld ? "withheld" : null) : status.trim() || null,
      directions: item.key === "medications" ? directions.trim() || null : null,
      since_year: item.key === "medications" && /^\d{4}$/.test(since) ? parseInt(since, 10) : null,
      unit: item.key === "check_ins" ? unit.trim() || null : null,
    });
    setBusy(false);
    setSaved(true);
  }
  const touch = () => setSaved(false);

  return (
    <li className="space-y-2 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-sm font-medium text-ink">{item.title}</div>
          {item.sub && <div className="text-[13px] text-muted">{item.sub}</div>}
          {!item.defaultShow && <div className="mt-0.5 text-[13px] text-warn">Starts off the page. It prints only if you turn it on.</div>}
        </div>
        <Toggle checked={show} onChange={(v) => { setShow(v); touch(); }} label="Print this row" />
      </div>
      {show && (
        <div className="grid gap-3 sm:grid-cols-2">
          <SourceSelect sources={sources} value={sourceId} onChange={(id) => { setSourceId(id); if (id) setTier("record"); touch(); }} />
          <TierSelect value={tier} onChange={(t) => { setTier(t); touch(); }} />
          {item.key === "conditions" && (
            <div className="sm:col-span-2"><Input label="Status, in plain words" value={status} onChange={(v) => { setStatus(v); touch(); }} placeholder="e.g. Active, more often since spring. Treated. Chronic. Stable, not today's visit." /></div>
          )}
          {item.key === "medications" && (
            <>
              <div className="sm:col-span-2"><TextField label="Directions, copied word for word from the pharmacy printout" voice={false} value={directions} onChange={(v) => { setDirections(v); touch(); }} rows={2} placeholder="e.g. 50 mg tablet. Take 1 tablet by mouth twice daily." /></div>
              <Input label="Since (year, as printed)" value={since} onChange={(v) => { setSince(v); touch(); }} placeholder="e.g. 2023" />
            </>
          )}
          {item.key === "check_ins" && (
            <>
              <Input label="Unit for this posting" value={unit} onChange={(v) => { setUnit(v); touch(); }} placeholder="e.g. 2nd Battalion, 14th Infantry" />
              <div className="self-end"><Toggle checked={withheld} onChange={(v) => { setStatus(v ? "withheld" : ""); touch(); }} label="Print 'Location withheld' instead of the place" /></div>
            </>
          )}
        </div>
      )}
      <div className="flex items-center gap-3">
        <PrimaryButton onClick={save} disabled={busy}>{busy ? "Saving…" : "Save this row"}</PrimaryButton>
        {saved && <span className="text-[13px] text-success">Saved.</span>}
        {meta?.tier && <span className="text-[13px] text-faint">Now: {TIER_LABEL[meta.tier]}{meta.source_id ? ", source attached" : ""}</span>}
      </div>
    </li>
  );
}

export default function RowControls() {
  const { supabase, user } = useAuth();
  const [groups, setGroups] = useState<{ title: string; note: string; items: Item[] }[]>([]);
  const [metas, setMetas] = useState<FpRowMeta[]>([]);
  const [sources, setSources] = useState<FpSource[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [metaRes, srcRes, medsRes, shotsRes] = await Promise.all([listRowMeta(supabase), listSources(supabase), listMedications(supabase), listServiceEvents(supabase)]);
    if (!metaRes.ok) { setError(metaRes.error); setLoading(false); return; }
    setMetas(metaRes.data);
    if (srcRes.ok) setSources(srcRes.data);
    const conditions = ((await supabase.from("conditions").select("id, label, onset_year, diagnosed_by").order("created_at")).data ?? []) as { id: string; label: string; onset_year: number | null; diagnosed_by: string | null }[];
    const checkIns = ((await supabase.from("check_ins").select("id, place_name, date_start, date_end, role, exposures(id, exposure_class, detail), incidents(id, incident_class, detail)").order("date_start")).data ?? []) as {
      id: string; place_name: string | null; date_start: string | null; date_end: string | null; role: string | null;
      exposures: { id: string; exposure_class: string; detail: string | null }[] | null;
      incidents: { id: string; incident_class: string; detail: string | null }[] | null;
    }[];
    const yr = (d: string | null) => (d ? String(d).slice(0, 4) : "");
    const g: { title: string; note: string; items: Item[] }[] = [
      {
        title: "Problems",
        note: "From Your conditions. Add a plain status and the source that documents each one.",
        items: conditions.map((c) => ({ key: "conditions", id: c.id, title: c.label, sub: [c.onset_year ? `since ${c.onset_year}` : "", c.diagnosed_by ? `diagnosed by ${c.diagnosed_by}` : ""].filter(Boolean).join(", "), defaultShow: defaultShowFor("conditions", c.label), defaultTier: "recalled" })),
      },
      {
        title: "Medicines",
        note: "From Your medications. The page prints the directions exactly as the pharmacy printout says them, with the printout as the source.",
        items: ("medications" in medsRes ? medsRes.medications : []).map((m) => ({ key: "medications", id: m.id, title: m.name, sub: m.taken_for ? `for ${m.taken_for}` : "", defaultShow: true, defaultTier: "recalled" })),
      },
      {
        title: "Postings",
        note: "From Where you served. One line per posting on the back of the page. Add the unit; withhold a location if you must.",
        items: checkIns.map((ci) => ({ key: "check_ins", id: ci.id, title: ci.place_name || "Unnamed place", sub: [yr(ci.date_start), yr(ci.date_end)].filter(Boolean).join(" to ") + (ci.role ? `, ${ci.role}` : ""), defaultShow: true, defaultTier: "recalled" })),
      },
      {
        title: "Exposures and events",
        note: "From Where you served and Injuries & events. Sexual trauma and assault start off the page.",
        items: checkIns.flatMap((ci) => [
          ...(ci.exposures ?? []).map((e) => ({ key: "exposures" as RowTableKey, id: e.id, title: EXPOSURE_LABEL[e.exposure_class] ?? e.exposure_class, sub: [ci.place_name, yr(ci.date_start)].filter(Boolean).join(", "), defaultShow: true, defaultTier: "recalled" as Tier })),
          ...(ci.incidents ?? []).map((i) => ({ key: "incidents" as RowTableKey, id: i.id, title: INCIDENT_LABEL[i.incident_class] ?? i.incident_class, sub: [ci.place_name, yr(ci.date_start)].filter(Boolean).join(", "), defaultShow: defaultShowFor("incidents", i.incident_class), defaultTier: "recalled" as Tier })),
        ]),
      },
      {
        title: "Shots and medicines given in service",
        note: "From Your shot record.",
        items: ("events" in shotsRes ? shotsRes.events : []).map((s) => ({ key: "shots", id: s.id, title: s.label, sub: s.event_year ? String(s.event_year) : "", defaultShow: true, defaultTier: s.provenance === "recalled" ? "recalled" : "record" })),
      },
    ];
    setGroups(g);
    setLoading(false);
  }, [supabase]);
  useEffect(() => {
    if (!user) return;
    (async () => { await load(); })();
  }, [user, load]);

  if (!user) return <Notice>Sign in to build your First Page.</Notice>;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <BackToHub />
      <Stance />
      <Notice error={error} />
      {loading ? <p className="text-sm text-muted">Loading your record…</p> : groups.map((g) => (
        <section key={g.title} className="card p-5">
          <div className="text-sm font-semibold text-ink">{g.title}</div>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">{g.note}</p>
          {g.items.length === 0 ? <p className="mt-2 text-[13px] text-faint">Nothing in the record yet.</p> : (
            <ul className="mt-2 divide-y divide-line">
              {g.items.map((it) => (
                <RowCard
                  key={it.key + it.id}
                  item={it}
                  sources={sources}
                  meta={metas.find((m) => m.table_key === it.key && m.row_id === it.id)}
                  onSave={async (patch) => { const r = await upsertRowMeta(supabase, it.key, it.id, patch); if (!r.ok) setError(r.error); const m = await listRowMeta(supabase); if (m.ok) setMetas(m.data); }}
                />
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
