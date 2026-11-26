"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { connectedConditionLabels } from "@/lib/education";
import { recordProgress } from "@/lib/nextaction";
import { listServiceEvents } from "@/lib/serviceEvents";
import { listMemberIncidents } from "@/lib/incidents";
import { listMedications } from "@/lib/medications";
import { listVessels } from "@/lib/vessels";
import { Card, Chevron, type SpineState } from "./ui";
import HomeDoors, { type DoorStep, type HomeDoorsProps, type RecordState } from "./HomeDoors";
import { buildPage, lintPage, listVisits, PAGE_PARTS, sheetDate, sheetFromPage, type PageData, type SheetData } from "@/lib/firstPage";
import SavePdfButton from "./firstpage/SavePdfButton";

type Conn = { id: string; direction: "sent" | "received"; status: string; other_name: string | null; place: string | null; ev_year: number | null };

// Home. Two doors over one record: the First Page (for the doctor) and the
// claim (for VA). This file loads the record; HomeDoors draws it.
//
// The First Page door reads only the page's own data (buildPage, the same
// assembly the print uses) and the hub's ten parts (PAGE_PARTS). The claim
// door reads the six steps exactly as the sidebar lists them. Neither door
// feeds the other: nothing from the claim prints on the page.

export default function DashboardView() {
  const { user, supabase } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [hasService, setHasService] = useState(false);
  const [checkins, setCheckins] = useState(0);
  const [counts, setCounts] = useState({ conditions: 0, corroborations: 0 });
  const [classes, setClasses] = useState<string[]>([]);
  const [condLabels, setCondLabels] = useState<string[]>([]);
  const [incidentClasses, setIncidentClasses] = useState<string[]>([]);
  const [buddies, setBuddies] = useState(0);
  const [pendingReqs, setPendingReqs] = useState<Conn[]>([]);
  const [filedCount, setFiledCount] = useState(0);
  const [hasDD214, setHasDD214] = useState(false);
  const [deniedCount, setDeniedCount] = useState(0);
  const [stillServing, setStillServing] = useState(false);
  const [seaGoing, setSeaGoing] = useState(false);
  // Shots, injuries and medications are tracked as STATE, never as a running
  // tally. A number here would tell a veteran by arithmetic that his memory is
  // deficient, the same reasoning that bans a count on the shots list itself.
  const [has, setHas] = useState({ shots: false, injuries: false, meds: false, vessels: false });
  const [page, setPage] = useState<HomeDoorsProps["page"]>({ sheet: null, ready: false, fresh: true, missing: [], lintOnly: false });
  const [reqErr, setReqErr] = useState<string | null>(null);
  // The assembled page, kept only when it passes the print check, for the
  // phone view, the PDF and the email.
  const [shareable, setShareable] = useState<PageData | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // still_serving is 0017; fall back so Home still renders before it is run.
      let m = await supabase.from("members").select("display_name, branch, service_start, service_end, still_serving").eq("auth_id", user.id).maybeSingle();
      if (m.error) m = await supabase.from("members").select("display_name, branch, service_start, service_end").eq("auth_id", user.id).maybeSingle();
      if (!m.data) await supabase.from("members").insert({ auth_id: user.id });
      const branch = (m.data?.branch as string) ?? null;
      setHasService(!!(branch || m.data?.service_start || m.data?.service_end));
      setStillServing(m.data?.still_serving === true);
      // The ships tile is the ONE that can be not applicable: an infantryman
      // will never have a ship, so for him it never reads "Not yet".
      setSeaGoing(/navy|marine|coast guard/i.test(branch ?? ""));

      const [ci, exprows, cond, conns, files] = await Promise.all([
        supabase.from("check_ins").select("id", { count: "exact", head: true }),
        supabase.from("exposures").select("id, exposure_class"),
        supabase.from("conditions").select("label, claim_status").order("created_at"),
        supabase.rpc("list_buddy_connections"),
        supabase.storage.from("records").list(user.id),
      ]);
      setCheckins(ci.count ?? 0);
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
      setCounts({ conditions: condRows.length, corroborations: corr });
      const allConns = (conns.data ?? []) as Conn[];
      setBuddies(allConns.filter((x) => x.status === "accepted").length);
      // A human is waiting. That must never be invisible on the home screen.
      setPendingReqs(allConns.filter((x) => x.direction === "received" && x.status === "pending"));
      setHasDD214((files.data ?? []).filter((f) => f.name !== ".emptyFolderPlaceholder").length > 0);

      // The shared records. Each goes through its own data module: the shots,
      // medications and vessels tables are query-isolated to those files by
      // the COI firewall. All four return an { error } shape rather than
      // throwing, so an unrun migration reads "Not yet" instead of breaking Home.
      const [ev, inc, meds, ves] = await Promise.all([
        listServiceEvents(supabase),
        listMemberIncidents(supabase),
        listMedications(supabase),
        listVessels(supabase),
      ]);
      setHas({
        shots: "events" in ev && ev.events.length > 0,
        injuries: "incidents" in inc && inc.incidents.length > 0,
        meds: "medications" in meds && meds.medications.length > 0,
        vessels: "vessels" in ves && ves.vessels.length > 0,
      });
      setIncidentClasses("incidents" in inc ? Array.from(new Set(inc.incidents.map((i) => i.incidentClass))) : []);

      // The First Page, assembled the same way the print assembles it. If the
      // First Page tables are not there yet, the door shows the empty page.
      const [p, v] = await Promise.all([buildPage(supabase, null), listVisits(supabase)]);
      if (p.ok) {
        const flags = PAGE_PARTS.map((part) => part.done(p.data));
        const hasVisit = v.ok && v.data.length > 0;
        // "Your story" reads as done for everyone (it is optional), so a
        // brand-new page is one where nothing else has been touched yet.
        const touched = PAGE_PARTS.some((part, i) => flags[i] && part.href !== "/first-page/record");
        const missing = PAGE_PARTS.filter((part, i) => !flags[i] && !(part.href === "/first-page/visit" && hasVisit)).map((part) => part.short);
        const lintClean = lintPage(p.data).length === 0;
        setShareable(touched && lintClean ? p.data : null);
        setPage({
          sheet: sheetFromPage(p.data),
          fresh: !touched && !hasVisit,
          ready: touched && hasVisit && lintClean,
          missing,
          lintOnly: missing.length === 0 && !lintClean,
        });
      } else {
        const empty: SheetData = { who: "", updated: sheetDate(), ownWords: [], served: [], changed: [], chain: [], example: false };
        setPage({ sheet: empty, fresh: true, ready: false, missing: PAGE_PARTS.filter((x) => x.href !== "/first-page/record").map((x) => x.short), lintOnly: false });
      }

      setLoaded(true);
    })();
  }, [user, supabase]);

  // Shared with JourneyView via lib/education so the two completeness views
  // can never disagree, and so an event-linked condition counts.
  const connectedCount = connectedConditionLabels(condLabels, classes, incidentClasses).length;
  const prog = recordProgress({
    hasService,
    locations: checkins,
    exposures: classes.length,
    incidents: incidentClasses.length,
    conditions: counts.conditions,
    connectedConditions: connectedCount,
    corroborations: counts.corroborations,
    hasDD214,
    filedConditions: filedCount,
  });

  // The six steps, as the sidebar lists them. The first one not done is Next.
  const raw: { href: string; label: string; done: boolean }[] = [
    { href: "/intake", label: "Your service", done: hasService },
    { href: "/health", label: "Your conditions", done: counts.conditions > 0 },
    { href: "/map", label: "Where you served", done: checkins > 0 },
    { href: "/journey", label: "Connect the dots", done: connectedCount > 0 },
    { href: "/buddies", label: "Battle buddies", done: buddies > 0 || counts.corroborations > 0 },
    { href: "/report", label: "Claim packet", done: prog.claimReady },
  ];
  const nextIndex = raw.findIndex((s) => !s.done);
  const steps: DoorStep[] = raw.map((s, i) => ({
    href: s.href,
    label: s.label,
    state: (s.done ? "done" : i === nextIndex ? "next" : "todo") as SpineState,
  }));

  const rec = (v: boolean): RecordState => (v ? "added" : "none");
  const records: HomeDoorsProps["records"] = {
    shots: rec(has.shots),
    injuries: rec(has.injuries),
    meds: rec(has.meds),
    ships: has.vessels ? "added" : seaGoing ? "none" : "not-applicable",
  };

  // Claim-side notes sit inside the claim door, so the coaching pages are
  // reached only from the claim side.
  const notes =
    deniedCount > 0 || stillServing ? (
      <div className="mt-3 space-y-1">
        {deniedCount > 0 && (
          <Link href="/denied" className="press flex min-h-11 items-center justify-between gap-3 rounded-xl bg-canvas px-3.5 text-[0.9375rem] text-ink">
            <span>A denial is not the end. See your next steps.</span>
            <Chevron className="text-faint" />
          </Link>
        )}
        {stillServing && (
          <Link href="/bdd" className="press flex min-h-11 items-center justify-between gap-3 rounded-xl bg-canvas px-3.5 text-[0.9375rem] text-ink">
            <span>Still serving? You can file before you separate.</span>
            <Chevron className="text-faint" />
          </Link>
        )}
      </div>
    ) : null;

  async function respondReq(id: string, accept: boolean) {
    setReqErr(null);
    // The RPC never throws. It RETURNS 'accepted'/'declined' or a failure
    // code. Only a confirmed outcome may dismiss the card.
    const { data, error } = await supabase.rpc("respond_buddy_connection", { p_connection_id: id, p_accept: accept });
    if (error || (data !== "accepted" && data !== "declined")) {
      setReqErr("That did not go through. Try again in a moment.");
      return;
    }
    setPendingReqs((prev) => prev.filter((r) => r.id !== id));
    if (data === "accepted") setBuddies((n) => n + 1);
  }

  return (
    <div className="space-y-6">
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

      <HomeDoors
        loaded={loaded}
        page={{
          ...page,
          extras: shareable ? (
            <>
              <Link href="/first-page/phone" className="btn btn-outline min-h-11">Show on my phone</Link>
              <SavePdfButton page={shareable} className="btn btn-outline min-h-11" />
            </>
          ) : undefined,
        }}
        claim={{ steps, notes }}
        records={records}
      />
    </div>
  );
}
