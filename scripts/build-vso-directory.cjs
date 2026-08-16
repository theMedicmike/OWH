#!/usr/bin/env node
/**
 * build-vso-directory — regenerate the accredited-representative directory
 * from VA's own published bulk lists.
 *
 * WHY THIS EXISTS. /vso used to be a page that explained what a VSO is and
 * then pushed the veteran out to VA's website to actually find one. The
 * council's reasoning for that was sound at the time — "a stale copy of
 * 3,000+ office listings would be worse than no directory at all" — and this
 * script is the answer to it: the copy stops being stale because it is
 * regenerated from source, and the page prints the date it was generated so a
 * veteran can see for himself how fresh it is.
 *
 * THE SOURCE. VA's Office of General Counsel publishes the complete
 * accreditation lists as bulk downloads at
 * https://www.va.gov/ogc/apps/accreditation/ — these four .asp URLs are the
 * literal form.action targets behind VA's own "Download Complete Lists in
 * Excel" buttons, not a scraped internal endpoint, and va.gov/robots.txt does
 * not disallow /ogc/. VA states the data "refreshes every Monday, Wednesday,
 * and Friday evening."
 *
 * THREE THINGS THAT WILL BREAK A NAIVE REWRITE, all found the hard way:
 *   1. A POST with no body returns 411 Length Required. You must send an
 *      explicit zero-length body (Content-Length: 0).
 *   2. The response Content-Type is application/vnd.ms-excel but the body is
 *      a plain HTML <TABLE>. It is not XLS. Parse it as HTML.
 *   3. ZIP codes are apostrophe-prefixed ('23185) to stop Excel eating the
 *      leading zero. Strip it or every lookup silently misses.
 *
 * Run:  node scripts/build-vso-directory.cjs
 * Then commit the regenerated JSON. Re-run it every few months, or whenever
 * a veteran reports a dead listing.
 */
const fs = require("fs");
const path = require("path");

const BASE = "https://www.va.gov/ogc/apps/accreditation";
const OUT = path.join(__dirname, "..", "src", "data", "vso-directory.json");

/** Zero-length POST body — a bodyless POST 411s. See note 1 above. */
async function fetchList(file) {
  const res = await fetch(`${BASE}/${file}`, {
    method: "POST",
    headers: { "Content-Length": "0" },
    body: "",
  });
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  return res.text();
}

const clean = (s) =>
  s
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();

/** ZIPs arrive as '02903 — strip the Excel guard apostrophe. See note 3. */
const zip5 = (s) => clean(s).replace(/^'/, "").slice(0, 5);

function parseRows(html) {
  const rows = [];
  const trRe = /<TR>([\s\S]*?)<\/TR>/gi;
  let m;
  while ((m = trRe.exec(html))) {
    const cells = [...m[1].matchAll(/<TD>([\s\S]*?)<\/TD>/gi)].map((c) => clean(c[1]));
    if (cells.length) rows.push(cells);
  }
  return rows;
}

(async () => {
  console.log("Fetching VA OGC accreditation lists…");
  const [orgsHtml, attHtml, agentHtml] = await Promise.all([
    fetchList("orgsexcellist.asp"),
    fetchList("attorneyexcellist.asp"),
    fetchList("caexcellist.asp"),
  ]);

  // Organization Name | POA | Org Phone | Org City | Org State |
  // Representative | Rep City | Rep State | Rep Zip | Registration Num
  const orgRows = parseRows(orgsHtml);

  // An organization is the thing a veteran actually contacts — DAV, VFW, the
  // county veterans office. Individual representatives are rolled up into a
  // per-ZIP count rather than listed by name: a veteran does not phone a
  // named rep out of a list of 18,000, he phones the office. Rolling up also
  // takes the payload from ~2 MB to something a serverless function can hold
  // without complaint.
  const byOrgZip = new Map();
  for (const r of orgRows) {
    if (r.length < 10) continue;
    const [orgName, , orgPhone, orgCity, orgState, , repCity, repState, repZipRaw] = r;
    const zip = zip5(repZipRaw);
    if (!zip || !/^\d{5}$/.test(zip)) continue;
    const key = `${orgName}|${zip}`;
    const existing = byOrgZip.get(key);
    if (existing) { existing.n += 1; continue; }
    byOrgZip.set(key, {
      o: orgName,
      p: orgPhone || "",
      c: repCity || orgCity || "",
      s: repState || orgState || "",
      z: zip,
      n: 1,
      t: "vso",
    });
  }

  // Attorneys and claims agents: Last | First | Date | Reg | POA | City |
  // State | Zip | Phone. Kept because a veteran whose claim is already at
  // the Board may genuinely need one — but tagged so the UI can rank the
  // free VSO options first and label these honestly as paid.
  const people = [];
  for (const [html, type] of [[attHtml, "attorney"], [agentHtml, "agent"]]) {
    for (const r of parseRows(html)) {
      if (r.length < 9) continue;
      const [last, first, , , , city, state, zipRaw, phone] = r;
      const zip = zip5(zipRaw);
      if (!zip || !/^\d{5}$/.test(zip)) continue;
      people.push({ o: `${last}, ${first}`.trim(), p: phone || "", c: city, s: state, z: zip, n: 1, t: type });
    }
  }

  const entries = [...byOrgZip.values(), ...people];

  // Bucket by ZIP3 so a lookup is one map hit instead of a scan of ~20,000
  // rows on every request.
  const byZip3 = {};
  for (const e of entries) {
    const k = e.z.slice(0, 3);
    (byZip3[k] ??= []).push(e);
  }

  const payload = {
    generated: new Date().toISOString().slice(0, 10),
    source: `${BASE}/`,
    counts: {
      organizations: byOrgZip.size,
      attorneys: people.filter((p) => p.t === "attorney").length,
      agents: people.filter((p) => p.t === "agent").length,
    },
    byZip3,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload));
  const kb = Math.round(fs.statSync(OUT).size / 1024);
  console.log(
    `Wrote ${OUT}\n  ${payload.counts.organizations} org/ZIP pairings, ` +
      `${payload.counts.attorneys} attorneys, ${payload.counts.agents} claims agents\n  ` +
      `${Object.keys(byZip3).length} ZIP3 buckets, ${kb} KB`,
  );
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
