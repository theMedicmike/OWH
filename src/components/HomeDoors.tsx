"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { SheetFrame } from "./firstpage/FirstPageSheet";
import type { SheetData } from "@/lib/firstPage";
import type { SpineState } from "./ui";

// Home: one record, two outputs. The First Page goes to the doctor; the claim
// goes to VA. Two doors side by side (stacked on a phone, First Page first),
// the records both doors share underneath, and a quiet footer.
//
// Presentational on purpose: DashboardView loads the real record and passes it
// in. The First Page door shows the veteran's own sheet, never the example.
// Nothing from the claim door is drawn into the sheet.

export type DoorStep = { href: string; label: string; state: SpineState };
export type RecordState = "added" | "none" | "not-applicable";

export type HomeDoorsProps = {
  loaded: boolean;
  page: {
    sheet: SheetData | null;
    /** Passes the hub's print check and has a visit set up. */
    ready: boolean;
    /** Nothing entered on any part of the page yet. */
    fresh: boolean;
    /** Parts not done yet, in plain words, in the hub's order. */
    missing: string[];
    /** All parts done, but a row still needs a source or a year. */
    lintOnly: boolean;
  };
  claim: { steps: DoorStep[]; notes?: ReactNode };
  records: { shots: RecordState; injuries: RecordState; meds: RecordState; ships: RecordState };
};

const COUNT_WORD = ["None", "One", "Two", "Three", "Four", "Five", "All six"];

function joinPlain(xs: string[]): string {
  if (xs.length <= 1) return xs.join("");
  return xs.slice(0, -1).join(", ") + " and " + xs[xs.length - 1];
}

function Dot({ ready }: { ready: boolean }) {
  return <span aria-hidden="true" className={`h-2.5 w-2.5 flex-none rounded-full ${ready ? "bg-success" : "bg-brand"}`} />;
}

function Mark({ state, n }: { state: SpineState; n: number }) {
  if (state === "done") {
    return (
      <span aria-hidden="true" className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-brand text-white">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 text-[0.8125rem] font-semibold ${
        state === "next" ? "border-brand text-brand" : "border-line text-faint"
      }`}
    >
      {n}
    </span>
  );
}

const TILE_ICON: Record<string, string> = {
  shots: "M9 2h6M12 2v6M7 8h10l1 12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L7 8z",
  injuries: "M12 2 3 7v6c0 5 4 9 9 9s9-4 9-9V7l-9-5zM12 8v5M12 16h.01",
  meds: "M10.5 20.5a4.95 4.95 0 0 1-7-7l6-6a4.95 4.95 0 0 1 7 7l-6 6zM8.5 8.5l7 7",
  ships: "M12 2v6M9 5h6M3 13h18l-2.2 6.2a2 2 0 0 1-1.9 1.3H7.1a2 2 0 0 1-1.9-1.3zM5.5 13V9h13v4",
};

function Tile({ href, label, state, icon, loaded }: { href: string; label: string; state: RecordState; icon: string; loaded: boolean }) {
  // State, never a tally: a number on a health row tells a veteran by
  // arithmetic that his memory is short. A ship is the one row that can be
  // not applicable, so an infantryman is never told his record lacks one.
  const word = !loaded ? " " : state === "added" ? "Added" : state === "none" ? "Not yet" : "If you served aboard";
  return (
    <Link href={href} className="press flex min-h-[4.5rem] items-center justify-between gap-3 rounded-[0.875rem] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(21,33,46,0.06)] ring-1 ring-line/60 transition-colors hover:ring-brand/25 sm:px-[1.125rem]">
      <span className="min-w-0">
        <span className="block text-[0.9375rem] font-medium leading-snug text-ink sm:text-base">{label}</span>
        <span className={`mt-0.5 block text-[0.8125rem] ${state === "added" ? "text-success" : "text-muted"}`}>{word}</span>
      </span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 flex-none text-faint" aria-hidden="true">
        <path d={icon} />
      </svg>
    </Link>
  );
}

const DOOR = "flex flex-col rounded-[1.125rem] bg-white p-5 shadow-[0_1px_2px_rgba(21,33,46,0.06),0_24px_48px_-28px_rgba(21,33,46,0.35)] sm:p-7 lg:min-h-[35rem]";
const QUIET = "inline-flex min-h-11 items-center justify-center text-[0.9375rem] font-medium text-brand underline-offset-4 hover:underline max-sm:w-full";

export default function HomeDoors({ loaded, page, claim, records }: HomeDoorsProps) {
  const { sheet, ready, fresh, missing, lintOnly } = page;
  const shown = missing.slice(0, 3);
  const more = missing.length - shown.length;
  const pageStatus = !loaded
    ? " "
    : ready
      ? `Ready to print. Updated ${sheet?.updated ?? ""}.`
      : lintOnly
        ? "Not ready yet: a row still needs a source or a year."
        : `Not ready yet: ${joinPlain(more > 0 ? [...shown, `${more} more`] : shown)}.`;

  const steps = claim.steps;
  const doneCount = steps.filter((s) => s.state === "done").length;
  const next = steps.find((s) => s.state === "next");
  const claimStatus = !loaded
    ? " "
    : next
      ? `${COUNT_WORD[doneCount]} of six steps done. Next: ${next.label}.`
      : "All six steps done. Your packet is ready.";

  return (
    <div>
      <h2 className="display text-[1.875rem] leading-[1.1] text-ink sm:text-[2.625rem]">Your record.</h2>
      <p className="mt-2.5 max-w-[62ch] text-base leading-relaxed text-muted sm:text-[1.0625rem]">
        One record, two outputs. <b className="font-medium text-ink">Your First Page</b> goes to your doctor.{" "}
        <b className="font-medium text-ink">Your claim</b> goes to VA. You add things once; nothing from the claim prints on your page.
      </p>

      <div className="mt-5 grid gap-4 sm:mt-7 lg:grid-cols-2 lg:gap-6">
        {/* Door 1: the First Page */}
        <section aria-labelledby="door-page" className={DOOR}>
          <h3 id="door-page" className="display text-[1.6875rem] leading-[1.1] text-ink sm:text-[1.875rem]">Your First Page</h3>
          <p className="mt-2 text-[0.9375rem] leading-snug text-muted sm:text-[0.96875rem]">For the doctor. One sheet, two sides, the same layout every visit.</p>
          <p className="mt-4 flex min-h-6 items-center gap-2.5 text-[0.90625rem] text-ink" role="status">
            {loaded && <Dot ready={ready} />}
            {pageStatus}
          </p>

          <div className="mt-4 flex-1">
          <Link
            href={fresh ? "/first-page" : "/first-page/print"}
            aria-label={fresh ? "Start your First Page" : "Open your First Page full size"}
            className="relative block overflow-hidden rounded-[0.625rem] bg-[#eef0f3] px-3 pt-3 shadow-[inset_0_0_0_1px_rgba(21,33,46,0.06)] sm:pt-4"
          >
            {sheet ? (
              <>
                <SheetFrame sheet={sheet} maxScale={0.78} clip={284} className="hidden sm:block" />
                <SheetFrame sheet={sheet} maxScale={0.68} clip={198} className="sm:hidden" />
              </>
            ) : (
              <div className="h-[198px] sm:h-[284px]" />
            )}
            <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[4.375rem] bg-gradient-to-b from-[#eef0f3]/0 to-[#eef0f3]" />
          </Link>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 sm:mt-6">
            {fresh ? (
              <Link href="/first-page" className="btn btn-flag btn-lg max-sm:w-full">Start your page</Link>
            ) : (
              <Link href="/first-page/print" className="btn btn-flag btn-lg max-sm:w-full">Print for your next visit</Link>
            )}
            {!fresh && <Link href="/first-page" className={QUIET}>Add to your page</Link>}
          </div>
        </section>

        {/* Door 2: the claim */}
        <section aria-labelledby="door-claim" className={DOOR}>
          <h3 id="door-claim" className="display text-[1.6875rem] leading-[1.1] text-ink sm:text-[1.875rem]">Your claim</h3>
          <p className="mt-2 text-[0.9375rem] leading-snug text-muted sm:text-[0.96875rem]">For VA. Six steps that end in a packet you can file or hand to a VSO.</p>
          <p className="mt-4 flex min-h-6 items-center gap-2.5 text-[0.90625rem] text-ink" role="status">
            {loaded && <Dot ready={!next} />}
            {claimStatus}
          </p>

          <ol className="mt-3 flex-1">
            {steps.map((s, i) => {
              const state = loaded ? s.state : "todo";
              return (
                <li key={s.href} className="border-b border-line last:border-b-0">
                  <Link href={s.href} className="press grid min-h-12 grid-cols-[1.875rem_1fr_auto] items-center gap-3 py-1 text-base">
                    <Mark state={state} n={i + 1} />
                    <span className={state === "next" ? "font-semibold text-ink" : "text-ink"}>
                      <span className="sr-only">Step {i + 1}: </span>
                      {s.label}
                    </span>
                    <span className={`text-sm ${state === "next" ? "font-medium text-brand" : "text-muted"}`}>
                      {!loaded ? " " : state === "done" ? "Done" : state === "next" ? "Next" : "Not yet"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>

          {claim.notes}

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 sm:mt-6">
            <Link href={next?.href ?? "/report"} className="btn btn-outline btn-lg border-brand max-sm:w-full">
              {next ? `Continue: ${next.label}` : "Open your claim packet"}
            </Link>
            <Link href="/presumptives" className={QUIET}>What VA presumes</Link>
          </div>
        </section>
      </div>

      <section aria-labelledby="records-title" className="mt-8 sm:mt-9">
        <h3 id="records-title" className="display text-xl text-ink">Your records</h3>
        <p className="mt-1 text-[0.9375rem] text-muted">Shared by both doors. Add once, use on either side.</p>
        <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:gap-3.5 lg:grid-cols-4">
          <Tile href="/shots" label="Shot record" state={records.shots} icon={TILE_ICON.shots} loaded={loaded} />
          <Tile href="/injuries" label="Injuries and events" state={records.injuries} icon={TILE_ICON.injuries} loaded={loaded} />
          <Tile href="/medications" label="Medications" state={records.meds} icon={TILE_ICON.meds} loaded={loaded} />
          <Tile href="/vessels" label="Ships" state={records.ships} icon={TILE_ICON.ships} loaded={loaded} />
        </div>
      </section>

      <footer className="mt-10 flex flex-col gap-3 border-t border-line pt-4 text-[0.90625rem] text-muted sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <nav aria-label="More" className="flex flex-wrap gap-x-5">
          <Link href="/vso" className="inline-flex min-h-11 items-center font-medium text-brand underline-offset-4 hover:underline">Find a VSO</Link>
          <Link href="/learn" className="inline-flex min-h-11 items-center font-medium text-brand underline-offset-4 hover:underline">Exposure library</Link>
          <Link href="/mike" className="inline-flex min-h-11 items-center font-medium text-brand underline-offset-4 hover:underline">Ask Medic Mike</Link>
        </nav>
        <a href="tel:988" className="inline-flex min-h-11 items-center">
          In crisis?&nbsp;<b className="font-semibold text-ink">Dial 988, then press 1.</b>
        </a>
      </footer>
    </div>
  );
}
