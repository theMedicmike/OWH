"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../AuthProvider";
import { getProfile, listSources, upsertProfile, type FpProfile, type FpSource } from "@/lib/firstPage";
import { BackToHub, Input, Notice, PrimaryButton, SourceSelect, Stance, TextField, Toggle } from "./Controls";

// The parts of the page that are not rows: the header lines, the care partner,
// how to help in the room, the return address, VA sharing status, the toxic
// exposure screening answers, stored specimens, what could not be found, and
// who takes corrections.

type Draft = Omit<FpProfile, "member_id" | "vhie_status" | "location_withheld"> & { vhie_status: "on" | "off" | "unknown"; location_withheld: boolean };

const EMPTY: Draft = {
  born_year: null, service_line1: "", service_line2: "",
  care_partner_name: "", care_partner_relation: "", care_partner_line: "", care_partner_phone: "",
  help_me: "", return_note_to: "", vhie_status: "unknown", vhie_checked_on: "",
  tes_date: "", tes_answer: "", tes_exposures: "", tes_followup: "", tes_source_id: null,
  specimens: "", no_record_found_for: "", corrections_to: "", assembled_by: "", tried_title: "",
  location_withheld: false,
};

export default function ProfileEditor() {
  const { supabase, user } = useAuth();
  const [d, setD] = useState<Draft>(EMPTY);
  const [sources, setSources] = useState<FpSource[]>([]);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [p, s] = await Promise.all([getProfile(supabase), listSources(supabase)]);
      if (!p.ok) { setError(p.error); return; }
      if (p.data) {
        const { member_id: _m, ...rest } = p.data;
        void _m;
        setD({ ...EMPTY, ...Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, v ?? (k === "born_year" || k === "tes_source_id" ? null : k === "location_withheld" ? false : k === "vhie_status" ? "unknown" : "")])) } as Draft);
      }
      if (s.ok) setSources(s.data);
    })();
  }, [supabase, user]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => { setD((x) => ({ ...x, [k]: v })); setSaved(""); };
  const str = (v: string | null) => v ?? "";

  async function save() {
    setBusy(true); setError(""); setSaved("");
    const nul = (v: string | null) => (v && v.trim() ? v.trim() : null);
    const r = await upsertProfile(supabase, {
      born_year: d.born_year, service_line1: nul(d.service_line1), service_line2: nul(d.service_line2),
      care_partner_name: nul(d.care_partner_name), care_partner_relation: nul(d.care_partner_relation), care_partner_line: nul(d.care_partner_line), care_partner_phone: nul(d.care_partner_phone),
      help_me: nul(d.help_me), return_note_to: nul(d.return_note_to), vhie_status: d.vhie_status, vhie_checked_on: nul(d.vhie_checked_on),
      tes_date: nul(d.tes_date), tes_answer: nul(d.tes_answer), tes_exposures: nul(d.tes_exposures), tes_followup: nul(d.tes_followup), tes_source_id: d.tes_source_id,
      specimens: nul(d.specimens), no_record_found_for: nul(d.no_record_found_for), corrections_to: nul(d.corrections_to), assembled_by: nul(d.assembled_by), tried_title: nul(d.tried_title),
      location_withheld: d.location_withheld,
    });
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    setSaved("Saved.");
  }

  if (!user) return <Notice>Sign in to build your First Page.</Notice>;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <BackToHub />
      <Stance />
      <Notice error={error} />

      <section className="space-y-3 card p-5">
        <div className="text-sm font-semibold text-ink">The header, in two lines</div>
        <p className="text-[0.8125rem] leading-relaxed text-muted">The name comes from your account. These two lines sit under it. Keep each to one line.</p>
        <Input label="Year of birth" value={d.born_year ? String(d.born_year) : ""} onChange={(v) => set("born_year", /^\d{4}$/.test(v) ? parseInt(v, 10) : null)} placeholder="e.g. 1981" />
        <Input label="Line one: branch, years, job, rank" value={str(d.service_line1)} onChange={(v) => set("service_line1", v)} placeholder="e.g. U.S. Army, 2000 to 2020, infantry (11B). Retired sergeant first class." />
        <Input label="Line two: deployments and the key injury or exposure" value={str(d.service_line2)} onChange={(v) => set("service_line2", v)} placeholder="e.g. Iraq 2004 to 2005. Afghanistan 2010 to 2011. Blast injury 2010." />
        <Toggle checked={d.location_withheld} onChange={(v) => set("location_withheld", v)} label="I may withhold specific locations on the page (you can also do it per posting on the Rows screen)" />
      </section>

      <section className="space-y-3 card p-5">
        <div className="text-sm font-semibold text-ink">Care partner in the room</div>
        <p className="text-[0.8125rem] leading-relaxed text-muted">The person who comes with you and knows the dates. The doctor is told to ask them if you pause.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Name" value={str(d.care_partner_name)} onChange={(v) => set("care_partner_name", v)} />
          <Input label="Relation" value={str(d.care_partner_relation)} onChange={(v) => set("care_partner_relation", v)} placeholder="e.g. wife, daughter, friend" />
        </div>
        <TextField label="What the doctor should know about them" value={str(d.care_partner_line)} onChange={(v) => set("care_partner_line", v)} rows={2} placeholder="e.g. Ask her if I pause. She keeps the folder and the dates." />
        <Input label="Phone (printed as 'on the original' on samples; printed in full on your page)" value={str(d.care_partner_phone)} onChange={(v) => set("care_partner_phone", v)} />
      </section>

      <section className="space-y-3 card p-5">
        <div className="text-sm font-semibold text-ink">How to help me in the room</div>
        <TextField label="Your words" value={str(d.help_me)} onChange={(v) => set("help_me", v)} rows={2} placeholder="e.g. One question at a time. If I pause, ask Renee. Write the plan down; I will not remember it." />
      </section>

      <section className="space-y-3 card p-5">
        <div className="text-sm font-semibold text-ink">Return your note to</div>
        <p className="text-[0.8125rem] leading-relaxed text-muted">
          The line that gets the doctor&apos;s note back to VA. Your VA community care office, its fax number and portal.
          Call the office that scheduled the referral; they can read it to you.
        </p>
        <TextField label="Office, fax and portal" voice={false} value={str(d.return_note_to)} onChange={(v) => set("return_note_to", v)} rows={2} placeholder="e.g. VA Southern Nevada community care, fax 702-000-0000, portal: HealthShare Referral Manager" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[0.8125rem] font-semibold text-muted">VA electronic sharing with outside providers</label>
            <select value={d.vhie_status} onChange={(e) => set("vhie_status", e.target.value as Draft["vhie_status"])} className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink">
              <option value="unknown">Not checked yet</option>
              <option value="on">On (VA shares my records with participating providers)</option>
              <option value="off">Off (I opted out)</option>
            </select>
            <p className="mt-1 text-[0.8125rem] text-faint">Check it on VA.gov: My HealtheVet, Medical records, manage your electronic share settings. It is on unless you opted out.</p>
          </div>
          <Input label="Date you checked" value={str(d.vhie_checked_on)} onChange={(v) => set("vhie_checked_on", v)} placeholder="e.g. 2026-10-14" />
        </div>
      </section>

      <section className="space-y-3 card p-5">
        <div className="text-sm font-semibold text-ink">VA toxic exposure screening</div>
        <p className="text-[0.8125rem] leading-relaxed text-muted">VA asks three questions at least every five years. What you answered, when, and what follow-up you asked for. The page adds the where, when and unit that VA does not record.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Date answered" value={str(d.tes_date)} onChange={(v) => set("tes_date", v)} placeholder="e.g. 2026-09-15" />
          <Input label="Your answer" value={str(d.tes_answer)} onChange={(v) => set("tes_answer", v)} placeholder="yes, no, don't know, declined" />
          <Input label="Which exposures you named" value={str(d.tes_exposures)} onChange={(v) => set("tes_exposures", v)} placeholder="e.g. burn pits, blast" />
          <Input label="Follow-up you asked for" value={str(d.tes_followup)} onChange={(v) => set("tes_followup", v)} placeholder="e.g. health and benefits" />
        </div>
        <SourceSelect sources={sources} value={d.tes_source_id} onChange={(id) => set("tes_source_id", id)} label="Source (usually your VA record download)" />
      </section>

      <section className="space-y-3 card p-5">
        <div className="text-sm font-semibold text-ink">Stored blood specimens, and what could not be found</div>
        <TextField label="Stored blood specimens" voice={false} value={str(d.specimens)} onChange={(v) => set("specimens", v)} rows={2} placeholder="e.g. Draw dates unknown. A treating clinician can ask for the stored serum. Not yet requested. Source 8." />
        <TextField label="No record found for" voice={false} value={str(d.no_record_found_for)} onChange={(v) => set("no_record_found_for", v)} rows={3} placeholder="e.g. Field care after the 2010 blast; the field card was not located. Audiology before 2016. The 2020 separation exam, pending the service record." />
        <Input label="Heading for the 'tried' section" value={str(d.tried_title)} onChange={(v) => set("tried_title", v)} placeholder="e.g. What has been tried for the headaches" />
      </section>

      <section className="space-y-3 card p-5">
        <div className="text-sm font-semibold text-ink">Who assembled it, and who takes corrections</div>
        <p className="text-[0.8125rem] leading-relaxed text-muted">A wrong row on a signed page is a safety problem. The page names a person; a corrected page is re-issued, never hand-edited.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Assembled by" value={str(d.assembled_by)} onChange={(v) => set("assembled_by", v)} placeholder="e.g. R. Alvarez, helper, or your own name" />
          <Input label="Corrections to (name and phone)" value={str(d.corrections_to)} onChange={(v) => set("corrections_to", v)} placeholder="e.g. R. Alvarez, 702-000-0000" />
        </div>
      </section>

      <div className="flex items-center gap-3">
        <PrimaryButton onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</PrimaryButton>
        {saved && <span className="text-[0.8125rem] text-success">{saved}</span>}
      </div>
    </div>
  );
}
