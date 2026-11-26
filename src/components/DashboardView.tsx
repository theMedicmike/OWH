"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import VerifyCard from "./VerifyCard";
import { EXPOSURE_LABEL, connectedConditionLabels } from "@/lib/education";
import { recordProgress } from "@/lib/nextaction";
import PresumptivePathwaysCard from "./PresumptivePathwaysCard";
import { listServiceEvents } from "@/lib/serviceEvents";
import { listMemberIncidents } from "@/lib/incidents";
import { listMedications } from "@/lib/medications";
import { listVessels } from "@/lib/vessels";
import { Card, SectionTitle, LinkRow, SpineRow, Chevron, type SpineState } from "./ui";
import FirstPageHome from "./FirstPageHome";
import { buildSheet, listRecordings, sheetDate, type SheetData } from "@/lib/firstPage";

type CheckRow = { id: string; place_name: string | null; date_start: string | null; exposures: { exposure_class: string }[] | null };
type Conn = { id: string; direction: "sent" | "received"; status: string; other_name: string | null; place: string | null; ev_year: number | null };

function IconPath({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

// Everything that is not one of the six steps, so nothing shipped is
// invisible from Home. These are menus, not scorecards: nothing here implies
// anything is owed.
const MORE = [
  { href: "/mike", title: "Talk to Medic Mike", detail: "Ask anything, in your own words.", d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { href: "/intake/ai", title: "Voice guided intake", detail: "Talk through your service instead of typing it.", d: "M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" },
  { href: "/learn", title: "Exposure library", detail: "What the government documents, by place and substance.", d: "M9 2h6M10 2v5.5L5.2 16A2 2 0 0 0 7 19h10a2 2 0 0 0 1.8-3L14 7.5V2" },
  { href: "/solutions", title: "Whole health", detail: "Ways to live well with what you carry.", d: "M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" },
];

export default function DashboardView() {
  const { user, supabase } = useAuth();
  const [branch, setBranch] = useState<string | null>(null);
  const [years, setYears] = useState<string | null>(null);
  const [rows, setRows] = useState<CheckRow[]>([]);
  const [counts, setCounts] = useState({ exposures: 0, conditions: 0, corroborations: 0 });
  const [buddies, setBuddies] = useState<Conn[]>([]);
  const [pendingReqs, setPendingReqs] = useState<Conn[]>([]);
  const [filedCount, setFiledCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [classes, setClasses] = useState<string[]>([]);
  const [condLabels, setCondLabels] = useState<string[]>([]);
  const [hasDD214, setHasDD214] = useState(false);
  const [deniedCount, setDeniedCount] = useState(0);
  const [stillServing, setStillServing] = useState(false);
  // Shots, injuries and medications are tracked as STATE, never as a running
  // tally. A number here would tell a veteran by arithmetic that his memory is
  // deficient, the same reasoning that bans a count on the shots list itself.
  const [hasShots, setHasShots] = useState(false);
  const [hasInjuries, setHasInjuries] = useState(false);
  const [incidentClasses, setIncidentClasses] = useState<string[]>([]);
  const [hasMeds, setHasMeds] = useState(false);
  const [hasVessels, setHasVessels] = useState(false);
  const [sheet, setSheet] = useState<SheetData | null>(null);
  const [hasStory, setHasStory] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // still_serving is 0017; fall back so the header still renders before it is run.
      let m = await supabase.from("members").select("display_name, branch, service_start, service_end, still_serving").eq("auth_id", user.id).maybeSingle();
      if (m.error) m = await supabase.from("members").select("display_name, branch, service_start, service_end").eq("auth_id", user.id).maybeSingle();
      if (!m.data) await supabase.from("members").insert({ auth_id: user.id });
      setBranch((m.data?.branch as string) ?? null);
      const ss = m.data?.service_start ? new Date(m.data.service_start as string).getUTCFullYear() : null;
      const se = m.data?.service_end ? new Date(m.data.service_end as string).getUTCFullYear() : null;
      // A still-serving member reads "2018 to present", never "2018 to ?".
      const serving = m.data?.still_serving === true;
      setYears(ss || se ? (serving ? `${ss ?? "?"} to present` : `${ss ?? "?"} to ${se ?? "?"}`) : null);
      setStillServing(serving);

      const [ci, exprows, cond, conns, files] = await Promise.all([
        supabase.from("check_ins").select("id, place_name, date_start, exposures(exposure_class)").order("date_start", { ascending: false }),
        supabase.from("exposures").select("id, exposure_class"),
        supabase.from("conditions").select("label, claim_status").order("created_at"),
        supabase.rpc("list_buddy_connections"),
        supabase.storage.from("records").list(user.id),
      ]);
      setRows((ci.data ?? []) as CheckRow[]);
      const exRows = (exprows.data ?? []) as { id: string; exposure_class: string }[];
      setClasses(Array.from(new Set(exRows.map((e) => e.exposure_class))));
      const condRows = (cond.data ?? []) as { label: string; claim_status?: string }[];
      setCondLabels(condRows.map((c) => c.label));
      setFiledCount(condRows.filter((c) => c.claim_status && c.claim_status !== "none").length);
      setDeniedCount(condRows.filter((c) => c.claim_status === "denied").length);
      let corr = 0;
      const ids = exRows.map((e) => e.id);
      if (ids.length) {
        const c = await supabase.from("corroborations").select("id", { count: "exact", head: true }).in("exposure_id", ids);
        corr = c.count ?? 0;
      }
      setCounts({ exposures: exRows.length, conditions: condRows.length, corroborations: corr });
      const allConns = (conns.data ?? []) as Conn[];
      setBuddies(allConns.filter((x) => x.status === "accepted"));
      // A human is waiting. That must never be invisible on the home screen.
      setPendingReqs(allConns.filter((x) => x.direction === "received" && x.status === "pending"));
      setHasDD214(((files.data ?? []).filter((f) => f.name !== ".emptyFolderPlaceholder")).length > 0);

      // The four newer sections. Each goes through its own data module: the
      // shots, medications and vessels tables are query-isolated to those files
      // by the COI firewall, and routing through them is what keeps that true.
      // All four return an { error } shape rather than throwing, so an unrun
      // migration leaves the row reading "Not yet" instead of breaking Home.
      const [ev, inc, meds, ves] = await Promise.all([
        listServiceEvents(supabase),
        listMemberIncidents(supabase),
        listMedications(supabase),
        listVessels(supabase),
      ]);
      setHasShots("events" in ev && ev.events.length > 0);
      setHasVessels("vessels" in ves && ves.vessels.length > 0);
      setHasInjuries("incidents" in inc && inc.incidents.length > 0);
      setIncidentClasses("incidents" in inc ? Array.from(new Set(inc.incidents.map((i) => i.incidentClass))) : []);
      setHasMeds("medications" in meds && meds.medications.length > 0);

      // The First Page, assembled the same way the print assembles it. If the
      // First Page tables are not there yet, Home still shows the empty page.
      const [sh, rec] = await Promise.all([buildSheet(supabase), listRecordings(supabase)]);
      setSheet(
        sh.ok
          ? sh.data
          : { who: (m.data?.display_name as string) ?? "", updated: sheetDate(), ownWords: [], served: [], changed: [], chain: [], example: false },
      );
      setHasStory(rec.ok ? rec.data.length > 0 : false);

      setLoaded(true);
    })();
  }, [user, supabase]);

  const checkins = rows.length;

  async function removeCheckin(id: string) {
    await supabase.from("check_ins").delete().eq("id", id);
    setRows((prev) => prev.filter((r) => r.id !== id));
    setConfirmDel(null);
  }

  // Shared with JourneyView via lib/education so the two completeness views
  // can never disagree, and so an event-linked condition counts.
  const connectedCount = connectedConditionLabels(condLabels, classes, incidentClasses).length;
  const prog = recordProgress({
    hasService: !!(branch || years),
    locations: checkins,
    exposures: classes.length,
    incidents: incidentClasses.length,
    conditions: counts.conditions,
    connectedConditions: connectedCount,
    corroborations: counts.corroborations,
    hasDD214,
    filedConditions: filedCount,
  });

  // The six steps, as the sidebar lists them, each with its state in plain
  // words. The first one not done is the lit one.
  const steps: { href: string; label: string; detail: string; done: boolean; word?: string }[] = [
    { href: "/intake", label: "Your service", detail: "Branch, years, and your job.", done: !!(branch || years) },
    { href: "/health", label: "Your conditions", detail: "What you live with, and when it started.", done: counts.conditions > 0 },
    { href: "/map", label: "Where you served", detail: "Every base and deployment, on the map.", done: checkins > 0 },
    { href: "/journey", label: "Connect the dots", detail: "What in your service links to what in your health.", done: connectedCount > 0 },
    { href: "/buddies", label: "Battle buddies", detail: "The people who were there.", done: buddies.length > 0 || counts.corroborations > 0 },
    { href: "/report", label: "Claim packet", detail: "A cited packet for your clinician and VSO.", done: prog.claimReady, word: prog.claimReady ? "Ready" : "Not yet" },
  ];
  const nextIndex = steps.findIndex((s) => !s.done);
  const stateFor = (i: number): SpineState => (steps[i].done ? "done" : i === nextIndex ? "next" : "todo");

  // The ships row is the ONE conditional row. Every other section applies to
  // every veteran, so a "Not yet" on it is a real to-do. A ship is not: an
  // infantryman will never have one. It appears for the sea-going branches,
  // and for anyone who has already added a ship regardless of branch.
  const seaGoing = /navy|marine|coast guard/i.test(branch ?? "");

  const [reqErr, setReqErr] = useState<string | null>(null);
  async function respondReq(id: string, accept: boolean) {
    setReqErr(null);
    // The RPC never throws. It RETURNS 'accepted'/'declined' or a failure
    // code. Only a confirmed outcome may dismiss the card.
    const { data, error } = await supabase.rpc("respond_buddy_connection", { p_connection_id: id, p_accept: accept });
    if (error || (data !== "accepted" && data !== "declined")) {
      setReqErr("That did not go through. Try again in a moment.");
      return;
    }
    const req = pendingReqs.find((r) => r.id === id);
    setPendingReqs((prev) => prev.filter((r) => r.id !== id));
    if (data === "accepted" && req) setBuddies((prev) => [...prev, { ...req, status: "accepted" }]);
  }

  return (
    <div className="space-y-8">
      {/* Home is the veteran's First Page. The six steps below feed it. */}
      <FirstPageHome
        sheet={sheet}
        feeds={{
          story: hasStory,
          places: loaded ? checkins : null,
          changed: loaded ? counts.conditions > 0 : null,
          buddies: loaded ? buddies.length : null,
        }}
      />

      {/* Everything below reads at the normal measure; only the page is wide. */}
      <div className="mx-auto max-w-3xl space-y-8">

      {/* A veteran reached out: the human moment outranks everything below it */}
      {pendingReqs.length > 0 && (
        <Card className="border-accent/40 bg-accent/5 p-5">
          <h3 className="text-lg font-semibold tracking-tight text-ink">A battle buddy asked to connect</h3>
          {reqErr && <p role="status" className="mt-1 text-sm font-medium text-scarlet">{reqErr}</p>}
          {pendingReqs.map((r) => (
            <div key={r.id} className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[0.9375rem] text-ink">
                <strong>{r.other_name || "A veteran"}</strong> who served{r.place ? ` near ${r.place}` : " where you did"}
                {r.ev_year ? ` around ${r.ev_year}` : ""} asked to connect.
              </p>
              <div className="flex gap-2">
                <button onClick={() => respondReq(r.id, true)} className="btn btn-primary">Accept</button>
                <button onClick={() => respondReq(r.id, false)} className="btn btn-secondary">Decline</button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* A denial just happened: surface the path forward without waiting to be asked */}
      {deniedCount > 0 && (
        <Link href="/denied" className="card row rounded-2xl">
          <span className="min-w-0 flex-1">
            <span className="block text-[0.9375rem] font-semibold">A denial is not the end</span>
            <span className="mt-0.5 block text-sm text-muted">
              {deniedCount} condition{deniedCount === 1 ? "" : "s"} denied. See your next steps.
            </span>
          </span>
          <Chevron className="text-faint" />
        </Link>
      )}

      {/* Still serving: BDD is the fastest path to benefits with no gap in coverage */}
      {stillServing && (
        <Link href="/bdd" className="card row rounded-2xl">
          <span className="min-w-0 flex-1">
            <span className="block text-[0.9375rem] font-semibold">File before you separate</span>
            <span className="mt-0.5 block text-sm text-muted">You are still serving. See the BDD timeline.</span>
          </span>
          <Chevron className="text-faint" />
        </Link>
      )}

      {/* Self-decides whether to render: only once a logged tour falls inside
          a presumptive program's dates and locations */}
      <PresumptivePathwaysCard compact />

      <VerifyCard />

      {/* The spine: six steps, in order, each with its state in plain words */}
      <section>
        <SectionTitle title="The six steps that feed your page" lede="In order. Tap any one to open it." />
        <Card className="mt-3 overflow-hidden">
          <ol className="spine p-2">
            {steps.map((s, i) => (
              <SpineRow
                key={s.href}
                href={s.href}
                step={i + 1}
                label={s.label}
                detail={s.detail}
                state={loaded ? stateFor(i) : "todo"}
                statusWord={loaded ? s.word : " "}
              />
            ))}
          </ol>
        </Card>
      </section>

      {/* Everything else on file. Counts only where a number is a neutral
          fact (places, exposures); everything health-adjacent reads as state. */}
      <section>
        <SectionTitle title="Also in your record" />
        <Card className="mt-3 overflow-hidden">
          <LinkRow href="/locations" label="Your locations" status={loaded ? String(checkins) : " "} tone="ink" />
          <LinkRow href="/exposures" label="Your exposures" status={loaded ? String(counts.exposures) : " "} tone="ink" />
          <LinkRow href="/shots" label="Your shot record" status={loaded ? (hasShots ? "On file" : "Not yet") : " "} tone={hasShots ? "success" : "faint"} />
          <LinkRow href="/injuries" label="Injuries & events" status={loaded ? (hasInjuries ? "On file" : "Not yet") : " "} tone={hasInjuries ? "success" : "faint"} />
          <LinkRow href="/medications" label="Your medications" status={loaded ? (hasMeds ? "On file" : "Not yet") : " "} tone={hasMeds ? "success" : "faint"} />
          {(seaGoing || hasVessels) && (
            <LinkRow href="/vessels" label="Ships you served aboard" status={loaded ? (hasVessels ? "On file" : "Not yet") : " "} tone={hasVessels ? "success" : "faint"} />
          )}
        </Card>
      </section>

      {/* Timeline + buddies */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold tracking-tight text-ink">Your timeline</h3>
            <Link href="/map" className="btn btn-ghost btn-sm">Open map</Link>
          </div>
          {checkins === 0 ? (
            <div className="mt-2">
              <p className="text-[0.9375rem] leading-relaxed text-muted">No locations yet. Start by marking one place you served.</p>
              <Link href="/map" className="btn btn-secondary mt-4">Drop your first pin</Link>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {rows.slice(0, 6).map((r) => (
                <li key={r.id} className="py-2.5 text-[0.9375rem] first:pt-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold text-ink">{r.place_name || "A logged location"}</span>
                    <span className="tnum flex-none text-sm text-muted">{r.date_start ? new Date(r.date_start).getUTCFullYear() : "No year"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-muted">
                      {(r.exposures ?? []).map((e) => EXPOSURE_LABEL[e.exposure_class] ?? e.exposure_class).join(", ") || "No exposures ticked"}
                    </div>
                    {confirmDel === r.id ? (
                      // The confirm action is deliberately NOT also called
                      // "Remove", and the safe option stays rightmost, where the
                      // finger already is. This deletes claim evidence.
                      <span className="flex flex-none items-center gap-3 text-sm">
                        <button onClick={() => removeCheckin(r.id)} className="font-semibold text-scarlet hover:underline">Delete</button>
                        <button onClick={() => setConfirmDel(null)} className="font-semibold text-ink hover:underline">Keep it</button>
                      </span>
                    ) : (
                      <button onClick={() => setConfirmDel(r.id)} className="flex-none rounded-lg px-2 py-1 text-sm text-faint transition hover:text-scarlet" aria-label={`Remove ${r.place_name || "location"}`}>
                        Remove
                      </button>
                    )}
                  </div>
                  {confirmDel === r.id && (
                    <p className="mt-2 rounded-xl border border-scarlet/30 bg-scarlet/5 px-3 py-2 text-[0.8125rem] leading-relaxed text-ink">
                      Deletes this check-in
                      {(r.exposures ?? []).length > 0
                        ? ` and the ${(r.exposures ?? []).length} exposure${(r.exposures ?? []).length === 1 ? "" : "s"} you ticked here`
                        : ""}
                      . This cannot be undone, and it changes what your claim packet says.
                    </p>
                  )}
                </li>
              ))}
              {checkins > 6 && (
                <li className="pt-2.5">
                  <Link href="/locations" className="btn btn-ghost btn-sm">Manage all {checkins} locations</Link>
                </li>
              )}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold tracking-tight text-ink">Your battle buddies</h3>
            <Link href="/buddies" className="btn btn-ghost btn-sm">Find buddies</Link>
          </div>
          {buddies.length === 0 ? (
            <div className="mt-2">
              <p className="text-[0.9375rem] leading-relaxed text-muted">No connections yet. Reconnect with the veterans who served where you did, privately, and only if you both agree.</p>
              <Link href="/buddies" className="btn btn-secondary mt-4">Find battle buddies</Link>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {buddies.map((b, i) => (
                <li key={i} className="py-2.5 text-[0.9375rem] first:pt-0">
                  <div className="font-semibold text-ink">{b.other_name || "A fellow veteran"}</div>
                  <div className="text-sm text-muted">Served near {b.place || "the same place"}{b.ev_year ? ` in ${b.ev_year}` : ""}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* More */}
      <section>
        <SectionTitle title="More" />
        <Card className="mt-3 overflow-hidden">
          {MORE.map((q) => (
            <LinkRow key={q.href} href={q.href} label={q.title} detail={q.detail} icon={<IconPath d={q.d} />} />
          ))}
        </Card>
      </section>
      </div>
    </div>
  );
}
