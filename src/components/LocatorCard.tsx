"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import {
  officeFor, LOCATOR_SOURCE_STAMP, LOCATOR_MILCONNECT_LINE, LOCATOR_EXPECTATION_LINE,
  LOCATOR_NO_FEE_LINE, LOCATOR_MHS_GENESIS_NOTE, LOCATOR_STATE_REGISTRY_NOTE, LOCATOR_VA_FORM_NOTE,
  NA_13055_ELIGIBLE, NA_13055_NOTE,
} from "@/lib/shotsCopy";

const BRANCHES = ["Army", "Navy", "Marine Corps", "Air Force", "Space Force", "Coast Guard"];
const card = "rounded-xl border border-line bg-surface p-5";

export default function LocatorCard() {
  const { user, supabase } = useAuth();
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [stillServing, setStillServing] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("members").select("branch, service_end, still_serving").maybeSingle();
      const m = data as { branch: string | null; service_end: string | null; still_serving?: boolean | null } | null;
      if (m?.branch && BRANCHES.includes(m.branch)) setBranch(m.branch);
      if (m?.still_serving) setStillServing(true);
      else if (m?.service_end) setYear(String(new Date(m.service_end).getUTCFullYear()));
    })();
  }, [user, supabase]);

  const effectiveYear = stillServing ? new Date().getUTCFullYear() : parseInt(year, 10);
  const office = branch && effectiveYear ? officeFor(branch, effectiveYear) : null;
  const showNA13055 = branch && !stillServing && year ? NA_13055_ELIGIBLE(branch, new Date(Date.UTC(parseInt(year, 10), 11, 31))) : false;

  return (
    <div className="space-y-4">
      <div className={card}>
        <div className="text-sm font-semibold text-ink">Two questions, one answer</div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Branch</label>
            <select value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15">
              <option value="">Choose…</option>
              {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">{stillServing ? "Still serving" : "Year you separated"}</label>
            <input
              type="number"
              inputMode="numeric"
              value={stillServing ? "" : year}
              onChange={(e) => setYear(e.target.value)}
              disabled={stillServing}
              placeholder="YYYY"
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-faint focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:opacity-50"
            />
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2 text-xs text-muted">
          <input type="checkbox" checked={stillServing} onChange={(e) => setStillServing(e.target.checked)} />
          I&apos;m still serving
        </label>

        {office && (
          <div className="mt-4 rounded-lg border border-brand/30 bg-brand/5 p-4">
            <div className="text-xs font-medium text-muted">Your {branch} shot record ({stillServing ? "current" : year}) is most likely held by:</div>
            <div className="mt-1 text-base font-semibold text-ink">{office.office}</div>
            <div className="mt-3 text-[11px] leading-relaxed text-faint">{LOCATOR_SOURCE_STAMP}</div>
          </div>
        )}
        {branch && effectiveYear && !office && (
          <p className="mt-4 text-sm text-muted">
            We don&apos;t have a published routing rule for that combination yet. Your VSO or your branch&apos;s
            records office can point you the right way.
          </p>
        )}
      </div>

      <div className={card}>
        <p className="text-sm font-medium text-ink">{LOCATOR_MILCONNECT_LINE}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted">{LOCATOR_EXPECTATION_LINE}</p>
        <p className="mt-2 text-xs text-faint">{LOCATOR_NO_FEE_LINE}</p>
      </div>

      <div className={card}>
        <div className="text-sm font-semibold text-ink">Other doors, depending on your situation</div>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          {effectiveYear >= 2014 && <li>{LOCATOR_MHS_GENESIS_NOTE}</li>}
          <li>{LOCATOR_STATE_REGISTRY_NOTE}</li>
          <li>{LOCATOR_VA_FORM_NOTE}</li>
          {showNA13055 && <li className="font-medium text-ink">{NA_13055_NOTE}</li>}
        </ul>
      </div>

      <Link href="/shots" className="block text-center text-xs font-medium text-brand hover:underline">← Back to your shot record</Link>
    </div>
  );
}
