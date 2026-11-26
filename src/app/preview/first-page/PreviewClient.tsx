"use client";

import AppShell from "@/components/AppShell";
import FirstPageHome from "@/components/FirstPageHome";
import { PRINT_CSS, Side1, Side2 } from "@/components/firstpage/FirstPagePrint";
import { EXAMPLE_SHEET, sheetDate, type FpSource, type PageData, type PageRow, type Tier } from "@/lib/firstPage";

// DEV ONLY (see page.tsx). Invented data, labeled as an example everywhere.

const src = (number: number, label: string, source_date: string, status: FpSource["status"] = "received"): FpSource => ({
  id: `s${number}`, number, label, source_date, author: null, status, document_path: null, note: null, created_at: "",
});
let n = 0;
const row = (kind: PageRow["kind"], cells: string[], sourceNumber: number | null, yearIn: number, tier: Tier = "record", parentId?: string): PageRow => ({
  id: `r${++n}`, kind, show: true, defaultOff: false, tier, sourceNumber, cells, yearIn, parentId,
});

const EXAMPLE_PAGE: PageData = {
  name: "Example page. Not a real veteran.",
  born: "1984",
  line1: "Born 1984. Army, 2003 to 2019, 11B then 18C.",
  line2: "Retired after 16 years.",
  profile: null,
  sources: [
    src(1, "DD-214", "2019-08-30"),
    src(2, "Service treatment record", "2019", "pending"),
    src(3, "VA problem list printout", "2026-10-02"),
    src(4, "Pharmacy printout", "2026-11-01"),
    src(5, "Community lab report", "2016-04-12"),
  ],
  allergies: [row("allergy", ["No known drug allergies."], null, -2, "recalled")],
  carePartner: { line: "Example spouse, wife. Comes to every visit.", contact: "Phone on file" },
  readFirst: EXAMPLE_SHEET.ownWords,
  returnNoteTo: "VA community care, by the fax on the referral.",
  problems: [
    row("conditions", ["Tinnitus, both ears", "2010", "VA", "Active"], 3, 1),
    row("conditions", ["TBI", "2011", "Army", "Active"], 2, 1),
    row("conditions", ["Left below-knee amputation", "2012", "Army", "Active"], 1, 1),
    row("conditions", ["Headaches", "2014", "VA", "Active"], 3, 1),
  ],
  medications: [
    row("medications", ["Sumatriptan 50 mg. Take 1 tablet at onset of headache. May repeat once in 2 hours.", "2015"], 4, 1),
    row("medications", ["Gabapentin 300 mg. Take 1 capsule by mouth three times a day.", "2013"], 4, 1),
  ],
  medicationsAsOf: "2026-11-01",
  studies: [row("study", ["MRI brain without contrast. Report in folder.", "2011-06-03"], 2, 1)],
  tried: [row("tried", ["Amitriptyline 2015 to 2016, stopped for morning grogginess."], 3, -1)],
  triedTitle: "What has been tried",
  openToday: "Headaches most days and sleep of two to three hours.",
  questions: ["Has my pituitary ever been checked?", "Should the 2016 testosterone lab be repeated?"],
  service: [
    row("check_ins", ["2003", "Fort Benning", "Infantry"], 1, 0, "record", "c1"),
    row("check_ins", ["2005", "Ramadi, Iraq", "12 months"], 1, 0, "record", "c2"),
    row("check_ins", ["2008", "Fort Bragg", "Special Forces"], 1, 0),
    row("check_ins", ["2010 to 2012", "Kandahar, Afghanistan", "Breacher"], 1, 0),
    row("check_ins", ["2017", "Syria", "7 months"], 1, 0),
  ],
  exposures: [
    row("exposures", ["Burn pit: 300 m from housing", "Ramadi, Iraq, 2005", ""], null, 1, "recalled"),
    row("incidents", ["Blast: repeated close blasts", "Kandahar, Afghanistan, 2010 to 2012", ""], 2, 1),
  ],
  results: [row("result", ["Testosterone, total", "Not on file", "248 ng/dL, 2016-04-12", ""], 5, -1)],
  shots: [row("shots", ["Anthrax series", "2003"], 2, 1, "recalled")],
  specimens: "",
  noRecordFoundFor: "",
  helpMe: "Speak to my right side. Hearing is worse on the left.",
  sinceLastVisit: "",
  visit: null,
  versionDate: "2026-11-20",
  assembledBy: "",
  correctionsTo: "",
  chain: EXAMPLE_SHEET.chain,
};

const EMPTY = { who: "", updated: sheetDate(), ownWords: [], served: [], changed: [], chain: [], example: false };

export default function PreviewClient({ view }: { view: "example" | "empty" | "print" }) {
  if (view === "print") {
    return (
      <div className="min-h-screen bg-canvas">
        <style>{PRINT_CSS}</style>
        <p className="no-print mx-auto max-w-4xl px-5 py-3 text-sm text-muted">Dev preview of the print, with the invented example page.</p>
        <div className="shs-wrap">
          <Side1 p={EXAMPLE_PAGE} />
          <Side2 p={EXAMPLE_PAGE} />
        </div>
      </div>
    );
  }
  return (
    <AppShell title="Home" publicPage wide>
      <FirstPageHome
        sheet={view === "empty" ? EMPTY : { ...EXAMPLE_SHEET, updated: sheetDate() }}
        feeds={view === "empty" ? { story: false, places: 0, changed: false, buddies: 0 } : { story: true, places: 6, changed: true, buddies: 0 }}
      />
    </AppShell>
  );
}
