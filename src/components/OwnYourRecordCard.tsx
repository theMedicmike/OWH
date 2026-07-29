"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { EXPOSURE_LABEL } from "@/lib/education";

// ─────────────────────────────────────────────────────────────────────────────
// "VETERAN-OWNED" — made true.
//
// SEC. 309's load-bearing word is OWNED. Until now the record lived only in one
// nonprofit's database behind a login: no way to take it out, no way to delete
// it, nothing if this organization ever went away. An app that demonstrates a
// veteran-owned record has to hand the veteran the actual record.
//
// Three things this card provides:
//   1. Export everything, machine-readable (JSON) — yours to keep or move.
//   2. Export everything, human-readable (printable archive) — yours to file.
//   3. Delete everything — an actual, documented off-ramp.
// Plus the ILER pointer: the government's own exposure record, which a veteran
// should request and reconcile against this one.
// ─────────────────────────────────────────────────────────────────────────────

export const ILER_URL = "https://www.dvidshub.net/news/408852/individual-longitudinal-exposure-record-iler";
export const MILCONNECT_URL = "https://milconnect.dmdc.osd.mil/milconnect/";

type Bundle = Record<string, unknown>;

export default function OwnYourRecordCard() {
  const { user, supabase, signOut } = useAuth();
  const [busy, setBusy] = useState<null | "json" | "print" | "delete">(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirm, setConfirm] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  async function gather(): Promise<Bundle | null> {
    if (!user) return null;
    const [member, checks, expos, conds, corr] = await Promise.all([
      supabase.from("members").select("*").eq("auth_id", user.id).maybeSingle(),
      supabase.from("check_ins").select("*, exposures(*)").order("date_start"),
      supabase.from("exposures").select("*"),
      supabase.from("conditions").select("*").order("created_at"),
      supabase.from("corroborations").select("*"),
    ]);
    return {
      exported_at: new Date().toISOString(),
      exported_from: "Connecting the Dots of Service — Operation Whole Health",
      note:
        "This is your complete record as you entered it. It is yours: keep it, print it, " +
        "hand it to an accredited VSO, or import it anywhere else. Nothing here is a medical " +
        "diagnosis or a legal opinion.",
      account: { email: user.email, user_id: user.id },
      member: member.data ?? null,
      locations: checks.data ?? [],
      exposures: expos.data ?? [],
      conditions: conds.data ?? [],
      corroborations: corr.data ?? [],
    };
  }

  async function exportJson() {
    setBusy("json"); setMsg(null);
    const bundle = await gather();
    setBusy(null);
    if (!bundle) return;
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my-service-record-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setMsg("Downloaded. That file is your complete record — keep a copy somewhere safe.");
  }

  async function exportPrintable() {
    setBusy("print"); setMsg(null);
    const b = await gather();
    setBusy(null);
    if (!b) return;
    const esc = (s: unknown) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
    const m = b.member as Record<string, unknown> | null;
    const locs = b.locations as Record<string, unknown>[];
    const conds = b.conditions as Record<string, unknown>[];
    const yr = (d: unknown) => (d ? new Date(String(d)).getUTCFullYear() : "");
    const html = `<!doctype html><meta charset="utf-8"><title>My service record</title>
<style>body{font:13px/1.5 Georgia,serif;color:#15212e;max-width:760px;margin:32px auto;padding:0 20px}
h1{font-size:22px;margin:0 0 2px}h2{font-size:14px;text-transform:uppercase;letter-spacing:.08em;color:#16314f;border-bottom:1px solid #ccc;padding-bottom:3px;margin:24px 0 8px}
.meta{color:#555;font-size:12px}table{width:100%;border-collapse:collapse;font-size:12px}td,th{text-align:left;padding:4px 6px;border-bottom:1px solid #eee;vertical-align:top}
.note{background:#f6f3ea;border-left:3px solid #c1873d;padding:8px 12px;font-size:12px;margin:14px 0}</style>
<h1>My Service &amp; Exposure Record</h1>
<div class="meta">${esc(m?.display_name ?? (b.account as Record<string, unknown>).email)}${m?.branch ? " · " + esc(m.branch) : ""}${m?.service_start ? " · " + esc(yr(m.service_start)) + "–" + esc(yr(m.service_end)) : ""} · exported ${esc(new Date().toLocaleDateString())}</div>
<div class="note">${esc(b.note)}</div>
<h2>Where I served</h2>
<table><tr><th>Place</th><th>Years</th><th>Documented exposures</th><th>My words</th></tr>
${locs.map((l) => {
  const exps = ((l.exposures as Record<string, unknown>[] | null) ?? []).map((e) => EXPOSURE_LABEL[String(e.exposure_class)] ?? String(e.exposure_class)).join(", ");
  const span = `${yr(l.date_start)}${l.date_end && yr(l.date_end) !== yr(l.date_start) ? "–" + yr(l.date_end) : ""}`;
  return `<tr><td>${esc(l.place_name)}</td><td>${esc(span)}</td><td>${esc(exps)}</td><td>${esc(l.notes)}</td></tr>`;
}).join("")}</table>
<h2>What I live with</h2>
<table><tr><th>Condition</th><th>Began</th><th>Claim status</th></tr>
${conds.map((c) => `<tr><td>${esc(c.label)}</td><td>${esc(c.onset_year ?? "")}</td><td>${esc(c.claim_status)}</td></tr>`).join("")}</table>
<p style="margin-top:28px;font-size:11px;color:#666">A self-prepared record — not a medical diagnosis or a legal opinion. Veterans Crisis Line: 988, then press 1.</p>`;
    const w = window.open("", "_blank");
    if (!w) { setMsg("Your browser blocked the pop-up — allow pop-ups and try again."); return; }
    w.document.write(html); w.document.close(); w.focus(); w.print();
    setMsg("Your printable archive is open — use your browser's Save as PDF.");
  }

  async function deleteEverything() {
    if (!user || confirm !== "DELETE") return;
    setBusy("delete"); setMsg(null);
    const { data: mem } = await supabase.from("members").select("id").eq("auth_id", user.id).maybeSingle();
    if (mem?.id) {
      // check_ins/exposures/conditions cascade from members; remove uploads too.
      const files = await supabase.storage.from("records").list(user.id);
      const names = (files.data ?? []).filter((f) => f.name !== ".emptyFolderPlaceholder").map((f) => `${user.id}/${f.name}`);
      if (names.length) await supabase.storage.from("records").remove(names);
      await supabase.from("members").delete().eq("id", mem.id);
    }
    setBusy(null);
    setMsg("Your record has been deleted. Signing you out.");
    setTimeout(() => signOut(), 1800);
  }

  const btn = "rounded-lg border border-line px-3.5 py-2 text-xs font-semibold text-ink transition hover:border-brand/40 hover:bg-canvas disabled:opacity-50";

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="h-1 bg-accent" />
      <div className="p-5">
        <h3 className="text-base font-bold text-ink">This record is yours</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Not ours. Take it with you, print it, or delete it — any time, without asking anyone.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={exportJson} disabled={!!busy} className={btn}>
            {busy === "json" ? "Gathering…" : "Download everything (file)"}
          </button>
          <button onClick={exportPrintable} disabled={!!busy} className={btn}>
            {busy === "print" ? "Building…" : "Printable archive copy"}
          </button>
        </div>

        {/* ILER — the government's own record */}
        <div className="mt-5 rounded-xl border border-brand/20 bg-brand/5 p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-brand">Also get the government&apos;s copy</div>
          <p className="mt-1 text-sm leading-relaxed text-ink">
            DoD and VA keep an official <strong>Individual Longitudinal Exposure Record (ILER)</strong> on you.
            Request yours and compare it to this one. Where they agree, your claim is stronger. Where ILER is
            missing something you lived, <em>your</em> record is the one that fills the gap.
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold">
            <a href={ILER_URL} target="_blank" rel="noreferrer" className="text-brand hover:underline">What ILER is →</a>
            <a href={MILCONNECT_URL} target="_blank" rel="noreferrer" className="text-brand hover:underline">Request records on milConnect →</a>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-faint">
            An accredited VSO (Veterans Service Officer — free help) can pull your ILER with you.
          </p>
        </div>

        {msg && (
          <div className="mt-4 rounded-lg border border-success/30 bg-success-soft px-3 py-2 text-xs font-medium text-success">{msg}</div>
        )}

        {/* Delete — a real off-ramp */}
        <div className="mt-5 border-t border-line pt-4">
          {!showDelete ? (
            <button onClick={() => setShowDelete(true)} className="text-xs font-semibold text-red-600 hover:underline">
              Delete my record
            </button>
          ) : (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="text-sm font-bold text-red-700">Delete everything?</div>
              <p className="mt-1 text-xs leading-relaxed text-red-700/90">
                This removes your locations, exposures, conditions, corroborations, and uploaded documents.
                It cannot be undone. Download a copy first if you might want it later.
              </p>
              <input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="mt-2 w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-red-500 focus:outline-none"
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={deleteEverything}
                  disabled={confirm !== "DELETE" || !!busy}
                  className="rounded-lg bg-red-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-40"
                >
                  {busy === "delete" ? "Deleting…" : "Permanently delete"}
                </button>
                <button onClick={() => { setShowDelete(false); setConfirm(""); }} className={btn}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
