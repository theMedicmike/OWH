"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import WheelPicker from "./WheelPicker";
import {
  officeFor, LOCATOR_SOURCE_STAMP, LOCATOR_MILCONNECT_LINE, LOCATOR_EXPECTATION_LINE,
  LOCATOR_NO_FEE_LINE, LOCATOR_MHS_GENESIS_NOTE, LOCATOR_STATE_REGISTRY_NOTE, LOCATOR_VA_FORM_NOTE,
  NA_13055_ELIGIBLE, NA_13055_NOTE,
} from "@/lib/shotsCopy";

const BRANCHES = ["Army", "Navy", "Marine Corps", "Air Force", "Space Force", "Coast Guard"];
const card = "card p-5";
const SEPARATION_YEARS = Array.from({ length: new Date().getUTCFullYear() - 1945 + 1 }, (_, i) => String(1945 + i));

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
        <h2 className="text-lg font-semibold tracking-tight text-ink">Two questions, one answer</h2>
        <fieldset className="mt-4">
          <legend className="field-label">Which branch?</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {BRANCHES.map((b) => (
              <button
                key={b}
                type="button"
                aria-pressed={branch === b}
                onClick={() => setBranch(b)}
                className={`btn min-h-12 ${branch === b ? "btn-primary" : "btn-secondary"}`}
              >
                {b}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="mt-5">
          <span className="field-label" id="sep-year-label">{stillServing ? "Still serving" : "Year you separated"}</span>
          {stillServing ? (
            <div className="field flex items-center justify-center text-muted">Still serving</div>
          ) : (
            <WheelPicker
              options={SEPARATION_YEARS}
              index={year ? parseInt(year, 10) - 1945 : SEPARATION_YEARS.length - 1}
              onChange={(i) => setYear(SEPARATION_YEARS[i])}
              ariaLabel="Year you separated"
            />
          )}
        </div>
        <label className="mt-3 flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-1 hover:bg-canvas">
          <input type="checkbox" checked={stillServing} onChange={(e) => setStillServing(e.target.checked)} className="h-6 w-6 flex-none accent-brand" />
          <span className="text-[0.9375rem] text-ink">I&apos;m still serving</span>
        </label>

        {office && (
          <div className="mt-4 rounded-xl border border-brand/30 bg-brand/5 p-4" aria-live="polite">
            <div className="text-[0.9375rem] text-muted">Your {branch} shot record ({stillServing ? "current" : year}) is most likely held by:</div>
            <div className="mt-1 text-lg font-semibold tracking-tight text-ink">{office.office}</div>
            <div className="mt-3 text-sm leading-relaxed text-muted">{LOCATOR_SOURCE_STAMP}</div>
          </div>
        )}
        {branch && effectiveYear && !office && (
          <p className="mt-4 text-[0.9375rem] text-muted">
            We don&apos;t have a published routing rule for that combination yet. Your VSO or your branch&apos;s
            records office can point you the right way.
          </p>
        )}
      </div>

      <div className={card}>
        <p className="text-[0.9375rem] font-medium text-ink">{LOCATOR_MILCONNECT_LINE}</p>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">{LOCATOR_EXPECTATION_LINE}</p>
        <p className="mt-2 text-sm text-muted">{LOCATOR_NO_FEE_LINE}</p>
      </div>

      <div className={card}>
        <h2 className="text-lg font-semibold tracking-tight text-ink">Other doors, depending on your situation</h2>
        <ul className="mt-3 space-y-2 text-[0.9375rem] leading-relaxed text-muted">
          {effectiveYear >= 2014 && <li>{LOCATOR_MHS_GENESIS_NOTE}</li>}
          <li>{LOCATOR_STATE_REGISTRY_NOTE}</li>
          <li>{LOCATOR_VA_FORM_NOTE}</li>
          {showNA13055 && <li className="font-medium text-ink">{NA_13055_NOTE}</li>}
        </ul>
      </div>

      <div className="text-center">
        <Link href="/shots" className="btn btn-ghost">Back to your shot record</Link>
      </div>
    </div>
  );
}
