"use client";

import Link from "next/link";
import { SheetFrame } from "./firstpage/FirstPageSheet";
import { Card, LinkRow } from "./ui";
import type { SheetData } from "@/lib/firstPage";

// Home, after sign-in: the veteran's own First Page, then the one thing to do
// with it (print it for the next visit), then the parts of the app that feed
// it. The six steps still exist; they sit lower on Home and feed this page.
//
// Presentational on purpose. DashboardView passes the real page; the dev-only
// preview route passes the example, so both render the same component.

export type Feeds = {
  story: boolean | null;
  places: number | null;
  changed: boolean | null;
  buddies: number | null;
};

export default function FirstPageHome({ sheet, feeds }: { sheet: SheetData | null; feeds: Feeds }) {
  const known = (v: unknown) => v !== null;
  return (
    <section aria-labelledby="fp-home-title">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="fp-home-title" className="display text-[1.85rem] text-ink sm:text-[2.125rem]">
          Your First Page
        </h2>
        {sheet && <span className="text-sm text-muted">Updated {sheet.updated}</span>}
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_22rem]">
        {/* The page. One big target: it opens the full-size page. */}
        <Link
          href="/first-page/print"
          aria-label="Open your First Page full size"
          className="press block overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-[#eef0f3] to-[#f3f4f7] px-4 pt-4 sm:px-8 sm:pt-7 lg:pb-7"
        >
          {sheet ? (
            <>
              <SheetFrame sheet={sheet} maxScale={1.3} className="hidden sm:block" />
              <div className="relative sm:hidden">
                <SheetFrame sheet={sheet} maxScale={0.62} clip={250} />
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-[#f3f4f7]" />
              </div>
            </>
          ) : (
            <div className="h-[15.5rem] sm:h-[28rem]" />
          )}
        </Link>

        <div>
          <div className="space-y-2.5">
            <Link href="/first-page/print" className="btn btn-flag btn-lg w-full">
              Print for your next visit
            </Link>
            <Link href="/first-page" className="btn btn-outline btn-lg w-full">
              Add to your page
            </Link>
          </div>

          <h3 className="mt-7 text-sm font-semibold text-muted">What feeds your page</h3>
          <Card className="mt-2 overflow-hidden">
            <LinkRow
              href="/first-page/record"
              label="Your story, in your words"
              status={known(feeds.story) ? (feeds.story ? "Recorded" : "Not yet") : " "}
              tone={feeds.story ? "success" : "faint"}
            />
            <LinkRow
              href="/map"
              label="Where you served"
              status={feeds.places === null ? " " : feeds.places > 0 ? `${feeds.places} place${feeds.places === 1 ? "" : "s"}` : "Not yet"}
              tone={feeds.places ? "success" : "faint"}
            />
            {/* State, not a tally: a count of conditions is not a score. */}
            <LinkRow
              href="/health"
              label="What changed"
              status={known(feeds.changed) ? (feeds.changed ? "Added" : "Not yet") : " "}
              tone={feeds.changed ? "success" : "faint"}
            />
            <LinkRow
              href="/buddies"
              label="Battle buddies"
              status={feeds.buddies === null ? " " : feeds.buddies > 0 ? `${feeds.buddies} connected` : "Invite"}
              tone={feeds.buddies ? "success" : "ink"}
            />
            <LinkRow href="/first-page/chain" label="The line between them" status={sheet && sheet.chain.length > 0 ? "Set" : "Not yet"} tone={sheet && sheet.chain.length > 0 ? "success" : "faint"} />
            <LinkRow href="/mike" label="Talk to Medic Mike" />
          </Card>
        </div>
      </div>
    </section>
  );
}
