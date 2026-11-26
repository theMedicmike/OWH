"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "../AuthProvider";
import { getProfile, listSources, upsertProfile, type FpProfile, type FpSource } from "@/lib/firstPage";
import { KeptNotice, SavedMark, useAutosave, useDraft } from "../Keep";
import { BackToHub, CardTitle, ChoiceTiles, Input, Notice, QuickPicks, SourceSelect, TextField, Toggle } from "./Controls";
import { StepNav, useStep } from "./Steps";

// The parts of the page that are not rows: the header lines, the care partner,
// how to help in the room, the return address, VA sharing status, the toxic
// exposure screening answers, stored specimens, what could not be found, and
// who takes corrections.
//
// One task per screen (the cognitive pass): each step asks one thing, and
// every change saves itself. A copy is also kept on this device, so a refresh
// or a dropped connection never loses what was typed.

type Draft = Omit<FpProfile, "member_id" | "vhie_status" | "location_withheld"> & { vhie_status: "on" | "off" | "unknown"; location_withheld: boolean };

const EMPTY: Draft = {
  born_year: null, service_line1: "", service_line2: "",
  care_partner_name: "", care_partner_relation: "", care_partner_line: "", care_partner_phone: "",
  help_me: "", return_note_to: "", vhie_status: "unknown", vhie_checked_on: "",
  tes_date: "", tes_answer: "", tes_exposures: "", tes_followup: "", tes_source_id: null,
  specimens: "", no_record_found_for: "", corrections_to: "", assembled_by: "", tried_title: "",
  location_withheld: false,
};

const RELATIONS = ["wife", "husband", "partner", "daughter", "son", "mother", "father", "friend"];

const TES_ANSWERS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "don't know", label: "Don't know" },
  { value: "declined", label: "Declined" },
];

const VHIE_OPTIONS: { value: Draft["vhie_status"]; label: string; detail: string }[] = [
  { value: "unknown", label: "Not checked yet", detail: "Leave it here until you look." },
  { value: "on", label: "On", detail: "VA shares my records with participating providers." },
  { value: "off", label: "Off", detail: "I opted out." },
];

const STEPS = [
  "Your header",
  "Care partner in the room",
  "How to help me in the room",
  "Return your note to",
  "VA sharing with outside doctors",
  "VA toxic exposure screening",
  "What the record is missing",
  "Who made the page",
];

export default function ProfileEditor() {
  const { supabase, user } = useAuth();
  const [d, setD] = useState<Draft>(EMPTY);
  const [sources, setSources] = useState<FpSource[]>([]);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [kept, setKept] = useState(false);
  const [step, setStep] = useStep(STEPS.length);
  const draft = useDraft<Draft>("fp-profile");
  const restored = useRef(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [p, s] = await Promise.all([getProfile(supabase), listSources(supabase)]);
      if (!p.ok) { setError(p.error); return; }
      if (p.data) {
        const { member_id: _m, ...rest } = p.data;
        void _m;
        setD({ ...EMPTY, ...Object.fromEntries(Object.entries(rest).filter(([k]) => k !== "updated_at").map(([k, v]) => [k, v ?? (k === "born_year" || k === "tes_source_id" ? null : k === "location_withheld" ? false : k === "vhie_status" ? "unknown" : "")])) } as Draft);
      }
      if (s.ok) setSources(s.data);
      setLoaded(true);
    })();
  }, [supabase, user]);

  // After the saved profile is in place, give back anything typed on this
  // device that never reached the server. Autosave then sends it.
  useEffect(() => {
    if (!loaded || restored.current || !draft.ready) return;
    restored.current = true;
    const local = draft.read();
    if (local && JSON.stringify(local) !== JSON.stringify(d)) queueMicrotask(() => { setD({ ...EMPTY, ...local }); setKept(true); });
  }, [loaded, draft, d]);

  const { status } = useAutosave(
    d,
    async (v) => {
      const nul = (x: string | null) => (x && x.trim() ? x.trim() : null);
      const r = await upsertProfile(supabase, {
        born_year: v.born_year, service_line1: nul(v.service_line1), service_line2: nul(v.service_line2),
        care_partner_name: nul(v.care_partner_name), care_partner_relation: nul(v.care_partner_relation), care_partner_line: nul(v.care_partner_line), care_partner_phone: nul(v.care_partner_phone),
        help_me: nul(v.help_me), return_note_to: nul(v.return_note_to), vhie_status: v.vhie_status, vhie_checked_on: nul(v.vhie_checked_on),
        tes_date: nul(v.tes_date), tes_answer: nul(v.tes_answer), tes_exposures: nul(v.tes_exposures), tes_followup: nul(v.tes_followup), tes_source_id: v.tes_source_id,
        specimens: nul(v.specimens), no_record_found_for: nul(v.no_record_found_for), corrections_to: nul(v.corrections_to), assembled_by: nul(v.assembled_by), tried_title: nul(v.tried_title),
        location_withheld: v.location_withheld,
      });
      if (!r.ok) { setError(r.error); return false; }
      setError("");
      draft.clear();
      return true;
    },
    { enabled: loaded },
  );

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setD((x) => { const next = { ...x, [k]: v }; draft.write(next); return next; });
  };
  const str = (v: string | null) => v ?? "";

  if (!user) return <Notice>Sign in to build your First Page.</Notice>;

  const tesAnswer = str(d.tes_answer).trim();
  const tesOptions = tesAnswer && !TES_ANSWERS.some((a) => a.value === tesAnswer) ? [...TES_ANSWERS, { value: tesAnswer, label: tesAnswer }] : TES_ANSWERS;

  const body = [
    <>
      <CardTitle lede="The name comes from your account. These two lines sit under it. Keep each to one line.">The header, in two lines</CardTitle>
      <Input label="Year of birth" inputMode="numeric" value={d.born_year ? String(d.born_year) : ""} onChange={(v) => set("born_year", /^\d{4}$/.test(v) ? parseInt(v, 10) : null)} placeholder="e.g. 1981" />
      <Input label="Line one: branch, years, job, rank" value={str(d.service_line1)} onChange={(v) => set("service_line1", v)} placeholder="e.g. U.S. Army, 2000 to 2020, infantry (11B). Retired sergeant first class." />
      <Input label="Line two: deployments and the key injury or exposure" value={str(d.service_line2)} onChange={(v) => set("service_line2", v)} placeholder="e.g. Iraq 2004 to 2005. Afghanistan 2010 to 2011. Blast injury 2010." />
      <Toggle checked={d.location_withheld} onChange={(v) => set("location_withheld", v)} label="I may withhold specific locations on the page" detail="You can also do it one posting at a time on the Rows screen." />
    </>,
    <>
      <CardTitle lede="The person who comes with you and knows the dates. The doctor is told to ask them if you pause.">Care partner in the room</CardTitle>
      <Input label="Name" value={str(d.care_partner_name)} onChange={(v) => set("care_partner_name", v)} />
      <div className="space-y-3">
        <QuickPicks label="Who they are to you" picks={RELATIONS} onPick={(p) => set("care_partner_relation", p)} />
        <Input label="Relation" value={str(d.care_partner_relation)} onChange={(v) => set("care_partner_relation", v)} placeholder="e.g. wife, daughter, friend" />
      </div>
      <TextField label="What the doctor should know about them" value={str(d.care_partner_line)} onChange={(v) => set("care_partner_line", v)} rows={2} placeholder="e.g. Ask her if I pause. She keeps the folder and the dates." />
      <Input label="Phone" type="tel" inputMode="tel" help="Printed in full on your page." value={str(d.care_partner_phone)} onChange={(v) => set("care_partner_phone", v)} />
    </>,
    <>
      <CardTitle lede="One or two lines the doctor reads before starting.">How to help me in the room</CardTitle>
      <TextField label="Your words" value={str(d.help_me)} onChange={(v) => set("help_me", v)} rows={3} placeholder="e.g. One question at a time. If I pause, ask Renee. Write the plan down; I will not remember it." />
    </>,
    <>
      <CardTitle lede="The line that gets the doctor's note back to VA: your VA community care office, its fax number and portal. Call the office that scheduled the referral; they can read it to you.">Return your note to</CardTitle>
      <TextField label="Office, fax and portal" voice={false} value={str(d.return_note_to)} onChange={(v) => set("return_note_to", v)} rows={3} placeholder="e.g. VA Southern Nevada community care, fax 702-000-0000, portal: HealthShare Referral Manager" />
    </>,
    <>
      <CardTitle lede="Check it on VA.gov: My HealtheVet, Medical records, manage your electronic share settings. It is on unless you opted out.">VA sharing with outside doctors</CardTitle>
      <ChoiceTiles label="VA electronic sharing with outside providers" options={VHIE_OPTIONS} value={d.vhie_status} onChange={(v) => set("vhie_status", v)} cols={3} />
      <Input label="Date you checked" value={str(d.vhie_checked_on)} onChange={(v) => set("vhie_checked_on", v)} placeholder="e.g. 2026-10-14" />
    </>,
    <>
      <CardTitle lede="VA asks three questions at least every five years. What you answered, when, and what follow-up you asked for.">VA toxic exposure screening</CardTitle>
      <ChoiceTiles label="Your answer" options={tesOptions} value={tesAnswer || null} onChange={(v) => set("tes_answer", v)} cols={4} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Date answered" value={str(d.tes_date)} onChange={(v) => set("tes_date", v)} placeholder="e.g. 2026-09-15" />
        <Input label="Which exposures you named" value={str(d.tes_exposures)} onChange={(v) => set("tes_exposures", v)} placeholder="e.g. burn pits, blast" />
      </div>
      <Input label="Follow-up you asked for" value={str(d.tes_followup)} onChange={(v) => set("tes_followup", v)} placeholder="e.g. health and benefits" />
      <SourceSelect sources={sources} value={d.tes_source_id} onChange={(id) => set("tes_source_id", id)} label="Source (usually your VA record download)" />
    </>,
    <>
      <CardTitle lede="Gaps are facts too. Saying what could not be found saves the doctor a search.">What the record is missing</CardTitle>
      <TextField label="Stored blood specimens" voice={false} value={str(d.specimens)} onChange={(v) => set("specimens", v)} rows={2} placeholder="e.g. Draw dates unknown. A treating clinician can ask for the stored serum. Not yet requested. Source 8." />
      <TextField label="No record found for" voice={false} value={str(d.no_record_found_for)} onChange={(v) => set("no_record_found_for", v)} rows={3} placeholder="e.g. Field care after the 2010 blast; the field card was not located. Audiology before 2016." />
    </>,
    <>
      <CardTitle lede="A wrong row on a signed page is a safety problem. The page names a person; a corrected page is re-issued, never hand-edited.">Who made the page</CardTitle>
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Assembled by" value={str(d.assembled_by)} onChange={(v) => set("assembled_by", v)} placeholder="e.g. R. Alvarez, helper, or your own name" />
        <Input label="Corrections to (name and phone)" value={str(d.corrections_to)} onChange={(v) => set("corrections_to", v)} placeholder="e.g. R. Alvarez, 702-000-0000" />
      </div>
      <Input label="Optional: a heading for 'What has been tried'" value={str(d.tried_title)} onChange={(v) => set("tried_title", v)} placeholder="e.g. What has been tried for the headaches" />
    </>,
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <BackToHub />
      <Notice error={error} />
      <KeptNotice show={kept} />
      {!loaded && !error ? (
        <p className="text-[0.9375rem] text-muted">Loading…</p>
      ) : (
        <section className="card space-y-5 p-5 sm:p-6">
          <StepNav steps={STEPS} step={step} status={<SavedMark status={status} />} />
          {body[step]}
          <StepNav.Buttons
            step={step}
            total={STEPS.length}
            onBack={() => setStep(step - 1)}
            onNext={() => setStep(step + 1)}
            done={<Link href="/first-page" className="btn btn-primary btn-lg max-sm:w-full">Done, back to your page</Link>}
          />
        </section>
      )}
    </div>
  );
}
