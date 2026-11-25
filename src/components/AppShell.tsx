"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { TextSizeControl } from "./TextSize";
import OpsecGate from "./OpsecGate";
import { BOOK_PUBLIC } from "@/lib/bookVisibility";

type NavItem = { href: string; label: string; d: string; step?: number };
type NavSection = { title?: string; tag?: string; items: NavItem[] };

// The nav IS the pipeline. A veteran should be able to read the sidebar and
// know exactly what building a record takes, and where they are in it: six
// steps, in order, ending at the packet, drawn as dots on one line. Everything
// that isn't a step sits below so it can't be mistaken for one.
const SECTIONS: NavSection[] = [
  {
    items: [
      { href: "/dashboard", label: "Dashboard", d: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" },
      { href: "/mike",      label: "Talk to Medic Mike", d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
    ],
  },
  {
    title: "Build your record",
    items: [
      // ORDER = THE SOP. Service, then health, then the map. If these move
      // again, the landing page's POINTS list, the Dashboard's start-here
      // card, Medic Mike's WHERE SOMEONE STARTS block, and the step numbers
      // written into /help's prose all have to move with them.
      { step: 1, href: "/intake",  label: "Your service",     d: "" },
      { step: 2, href: "/health",  label: "Your conditions",  d: "" },
      { step: 3, href: "/map",     label: "Where you served", d: "" },
      { step: 4, href: "/journey", label: "Connect the dots", d: "" },
      { step: 5, href: "/buddies", label: "Battle buddies",   d: "" },
      { step: 6, href: "/report",  label: "Claim packet",     d: "" },
    ],
  },
  {
    // Its own section, deliberately NOT nested inside "Learn & live well":
    // council ruling 2026-08-07/2026-08-09. Discoverable ALONGSIDE the Exposure
    // Library and Whole Health, never visually equated as a sibling under the
    // same heading. No step numbers: renumbering breaks the help page, which
    // hardcodes step numbers in prose in six places.
    title: "Also in your record",
    items: [
      { href: "/shots", label: "Your shot record", d: "M9 2h6M12 2v6M7 8h10l1 12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L7 8zM9 13h6M9 17h4" },
      { href: "/injuries", label: "Injuries & events", d: "M12 2 3 7v6c0 5 4 9 9 9s9-4 9-9V7l-9-5zM12 8v5M12 16h.01" },
      { href: "/vessels", label: "Ships you served aboard", d: "M12 2v6M9 5h6M3 13h18l-2.2 6.2a2 2 0 0 1-1.9 1.3H7.1a2 2 0 0 1-1.9-1.3zM5.5 13V9h13v4" },
      { href: "/medications", label: "Your medications", d: "M10.5 20.5a4.95 4.95 0 0 1-7-7l6-6a4.95 4.95 0 0 1 7 7l-6 6zM8.5 8.5l7 7" },
      // The First Page (decided 2026-11-24): the one two-sided sheet a veteran
      // hands a specialist. Not a numbered step, because it faces the clinic,
      // not the claim.
      { href: "/first-page", label: "Your First Page", d: "M14 3v5h5M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-5-5zM8 12h8M8 16h5" },
      // Council ruling 2026-08-14: dropdown-only lookup of the PUBLISHED
      // presumptive lists. Never a question about the veteran's health.
      { href: "/presumptives", label: "What VA presumes", d: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" },
    ],
  },
  {
    // What happens after the packet. Deliberately NOT numbered: step 6 hands
    // you a packet and the record is finished. A seventh number would tell a
    // veteran who stopped at the packet that he is not done. He is.
    title: "When you're ready to file",
    items: [
      { href: "/vso",     label: "Find a VSO",    d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" },
      { href: "/cp-exam", label: "Your C&P exam", d: "M9 11l2 2 4-4M5 4h14a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" },
    ],
  },
  {
    title: "Learn & live well",
    items: [
      { href: "/learn",     label: "Exposure library", d: "M9 2h6M10 2v5.5L5.2 16A2 2 0 0 0 7 19h10a2 2 0 0 0 1.8-3L14 7.5V2" },
      { href: "/solutions", label: "Whole health",     d: "M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" },
      ...(BOOK_PUBLIC ? [{ href: "/book",      label: "Read the book",    d: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 0 3-3h7z" }] : []),
    ],
  },
  {
    title: "Just for you",
    tag: "Private",
    items: [{ href: "/estimator", label: "Exposure insights", d: "M3 12h4l3 8 4-16 3 8h4" }],
  },
  {
    items: [{ href: "/account", label: "Account", d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" }],
  },
];

const BOTTOM_LINKS: NavItem[] = [
  { href: "/help",  label: "How to use this",   d: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01" },
  { href: "/about", label: "Why we built this",  d: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" },
];

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 flex-none" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`press flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-[15px] leading-snug transition-colors ${
        active ? "bg-white/14 font-semibold text-white" : "text-white/72 hover:bg-white/8 hover:text-white"
      }`}
    >
      {item.step ? (
        // A dot on the spine. The line between dots is drawn by the list.
        <span className="relative flex h-5 w-5 flex-none items-center justify-center" aria-hidden="true">
          <span className={`h-3 w-3 rounded-full border-2 ${active ? "border-accent bg-accent" : "border-white/55 bg-brand"}`} />
        </span>
      ) : (
        <Icon d={item.d} />
      )}
      <span>
        {item.step ? <span className="sr-only">Step {item.step}: </span> : null}
        {item.label}
      </span>
    </Link>
  );
}

// Education routes that render for anyone, signed in or not. Every one of
// them is the same page for every visitor, which is the only reason it's
// safe to open them. This is also the entire SEO strategy.
const PUBLIC_SECTIONS: NavSection[] = [
  {
    title: "Learn",
    items: [
      { href: "/learn", label: "Exposure library", d: "M9 2h6M10 2v5.5L5.2 16A2 2 0 0 0 7 19h10a2 2 0 0 0 1.8-3L14 7.5V2" },
      { href: "/presumptives", label: "What VA presumes", d: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" },
      { href: "/solutions", label: "Whole health", d: "M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" },
      { href: "/cp-exam", label: "Your C&P exam", d: "M9 11l2 2 4-4M5 4h14a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" },
      ...(BOOK_PUBLIC ? [{ href: "/book", label: "Read the book", d: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 0 3-3h7z" }] : []),
      { href: "/vso", label: "Find a VSO", d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" },
    ],
  },
];

export default function AppShell({
  title,
  children,
  publicPage = false,
}: {
  title: string;
  children: React.ReactNode;
  /** Renders for signed-out visitors too. Only ever set on pages that read
   *  no personal record. See PUBLIC_SECTIONS above. */
  publicPage?: boolean;
}) {
  const { user, ready, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  const isDashboard = pathname === "/dashboard";
  // history.length > 1 means there is somewhere real to go back TO. A veteran
  // who opened a bookmark straight into a deep page has no history, so he goes
  // Home instead. A back button that sometimes does nothing is worse than none.
  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/dashboard");
  }

  // Auth still resolving. A PUBLIC page must never wait for it: this
  // component is server-rendered and `ready` is false on the server, so a
  // spinner here would ship "Loading…" as the entire crawlable HTML of every
  // public page. A personal page still waits.
  if (!ready && !publicPage) {
    return <div className="flex min-h-screen items-center justify-center text-[15px] text-muted">Loading…</div>;
  }

  if (!user && !publicPage) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="card w-full max-w-sm p-7 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-ink">Please sign in</h1>
          <p className="mt-1 text-[15px] text-muted">You need an account to view this page.</p>
          <Link href="/" className="btn btn-primary mt-5 w-full">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  const signedOut = !user;
  const sections = signedOut ? PUBLIC_SECTIONS : SECTIONS;

  // The whole sidebar scrolls, not just <nav>, so a short viewport (phone
  // landscape) can never clip the crisis line off-screen.
  const sidebar = (
    <div className="on-navy flex h-full flex-col overflow-y-auto bg-brand">
      <div className="flex items-center gap-3 px-4 pb-4 pt-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/owh-round.png" alt="Operation Whole Health" className="h-10 w-10 flex-none object-contain" />
        <div className="min-w-0 leading-tight">
          <div className="text-[15px] font-semibold tracking-tight text-white">Connecting the Dots</div>
          <div className="text-[13px] text-white/55">of Service</div>
        </div>
        {open && (
          <button
            onClick={() => setOpen(false)}
            className="ml-auto flex h-10 w-10 flex-none items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-5 px-3 pb-2" aria-label="Main">
        {sections.map((section, si) => {
          const isSpine = section.items.some((i) => i.step);
          return (
            <div key={si}>
              {section.title && (
                <div className="flex items-center gap-2 px-3 pb-1.5">
                  <span className="text-[13px] font-medium text-white/50">{section.title}</span>
                  {section.tag && (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[12px] font-medium text-white/55">{section.tag}</span>
                  )}
                </div>
              )}
              <div
                className={
                  isSpine
                    ? "relative space-y-0.5 before:absolute before:bottom-5 before:left-[calc(0.75rem+0.625rem-1px)] before:top-5 before:w-0.5 before:bg-white/15 before:content-['']"
                    : "space-y-0.5"
                }
              >
                {section.items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={pathname === item.href || pathname.startsWith(item.href + "/")}
                    onClick={() => setOpen(false)}
                  />
                ))}
              </div>
            </div>
          );
        })}

        <div>
          <div className="px-3 pb-1.5">
            <span className="text-[13px] font-medium text-white/50">The mission</span>
          </div>
          <div className="space-y-0.5">
            {BOTTOM_LINKS.map((item) => (
              <NavLink key={item.href} item={item} active={pathname === item.href} onClick={() => setOpen(false)} />
            ))}
          </div>
        </div>
      </nav>

      {/* User / sign out, or, for a visitor reading the library, the reason to
          start a record of their own. Then the floor: the crisis line is
          always one tap away, on every page. */}
      <div className="border-t border-white/10 p-3">
        {signedOut ? (
          <Link href="/" className="btn btn-light w-full">
            Start your free record
          </Link>
        ) : (
          <div className="flex items-center gap-2 px-1">
            <span className="min-w-0 flex-1 truncate text-[13px] text-white/55">{user?.email}</span>
            <button
              onClick={signOut}
              className="flex-none rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-white/70 hover:bg-white/10 hover:text-white"
            >
              Sign out
            </button>
          </div>
        )}
        <a
          href="tel:988"
          className="btn mt-3 w-full justify-start gap-3 bg-scarlet px-3.5 text-left text-white hover:brightness-110"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 flex-none" aria-hidden="true">
            <path d="M12 21s-6.7-4.35-9.33-8.07C1.1 10.7 1.64 7.6 4 6.1a5 5 0 0 1 8 1.4 5 5 0 0 1 8-1.4c2.36 1.5 2.9 4.6 1.33 6.83C18.7 16.65 12 21 12 21z" />
          </svg>
          <span className="leading-tight">
            <span className="block text-[14px] font-semibold">Veterans Crisis Line</span>
            <span className="block text-[13px] font-medium text-white/85">988, then press 1</span>
          </span>
        </a>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 px-1 text-[13px] text-white/45">
          <a href="mailto:michael@operationwholehealth.org?subject=Connecting%20the%20Dots%20feedback" className="hover:text-white/80">Send feedback</a>
          <Link href="/trust" className="hover:text-white/80">What this is</Link>
          <Link href="/privacy" className="hover:text-white/80">Privacy</Link>
          <Link href="/terms" className="hover:text-white/80">Terms</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[272px_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:block print:hidden">
        <div className="sticky top-0 h-screen overflow-hidden">{sidebar}</div>
      </aside>

      {/* Drawer (mobile) */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[18rem] max-w-[88vw] shadow-2xl">{sidebar}</div>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex min-h-14 items-center gap-2 border-b border-line bg-white/92 px-3 py-2 backdrop-blur sm:px-5 print:hidden">
          <button
            onClick={() => setOpen(true)}
            className="btn btn-secondary h-11 w-11 flex-none px-0 lg:hidden"
            aria-label="Open menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {/* Back, from the shell, on every screen but Home. Labeled, not just
              an arrow, so there is never a question of what it does. */}
          {!isDashboard && (
            <button onClick={goBack} className="btn btn-secondary btn-sm flex-none pl-2.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Back
            </button>
          )}
          <h1 className="min-w-0 truncate px-1 text-[17px] font-semibold tracking-tight text-ink">{title}</h1>

          <Link href="/support" className="btn btn-secondary btn-sm ml-auto flex-none rounded-full">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 text-scarlet" aria-hidden="true">
              <path d="M12 21s-6.7-4.35-9.33-8.07C1.1 10.7 1.64 7.6 4 6.1a5 5 0 0 1 8 1.4 5 5 0 0 1 8-1.4c2.36 1.5 2.9 4.6 1.33 6.83C18.7 16.65 12 21 12 21z" />
            </svg>
            <span className="hidden sm:inline">Need support?</span>
            <span className="sm:hidden">Support</span>
          </Link>

          {signedOut ? (
            <Link href="/" className="btn btn-primary btn-sm flex-none">
              Sign in
            </Link>
          ) : (
            <div className="relative flex-none">
              <button
                onClick={() => setMenu((m) => !m)}
                className="btn btn-secondary btn-sm rounded-full pl-1 pr-2.5"
                aria-label="Account menu"
                aria-expanded={menu}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-[13px] font-bold text-white">
                  {(user?.email?.[0] ?? "U").toUpperCase()}
                </span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 text-muted transition-transform ${menu ? "rotate-180" : ""}`} aria-hidden="true">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {menu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                  <div className="card card-raise absolute right-0 top-full z-20 mt-2 w-64 overflow-hidden">
                    <div className="border-b border-line px-4 py-3">
                      <div className="text-[13px] text-muted">Signed in as</div>
                      <div className="truncate text-[15px] font-semibold text-ink">{user?.email}</div>
                    </div>
                    <TextSizeControl />
                    <Link
                      href="/account"
                      onClick={() => setMenu(false)}
                      className="flex min-h-11 items-center gap-2.5 px-4 text-[15px] text-ink transition hover:bg-canvas"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-muted" aria-hidden="true">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" />
                      </svg>
                      Account settings
                    </Link>
                    <button
                      onClick={() => { setMenu(false); signOut(); }}
                      className="flex min-h-11 w-full items-center gap-2.5 border-t border-line px-4 text-left text-[15px] font-medium text-scarlet transition hover:bg-scarlet/5"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </header>

        <main className="flex-1 px-4 py-6 sm:px-7 sm:py-8 lg:px-10">
          <div className="mx-auto w-full max-w-3xl">
            {/* OpsecGate is the one-time "keep it unclassified" screen a
                veteran confirms before entering anything into their own
                record. A signed-out reader has nothing to enter. */}
            {signedOut ? children : <OpsecGate>{children}</OpsecGate>}
          </div>
        </main>
      </div>
    </div>
  );
}
