"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { ServiceRibbon, StarRow, Anniversary250 } from "./Patriotic";
import { TextSizeControl } from "./TextSize";
import OpsecGate from "./OpsecGate";

type NavItem = { href: string; label: string; d: string; step?: number };
type NavSection = { title?: string; tag?: string; items: NavItem[] };

// The nav IS the pipeline. A veteran should be able to read the sidebar and
// know exactly what building a record takes, and where they are in it — six
// numbered steps, in order, ending at the packet. Everything that isn't a step
// sits below the line so it can't be mistaken for one.
const SECTIONS: NavSection[] = [
  {
    items: [
      { href: "/dashboard", label: "Dashboard", d: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" },
      { href: "/mike",      label: "Talk to Medic Mike", d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
    ],
  },
  {
    title: "Build your record",
    items: [
      { step: 1, href: "/intake",  label: "Your service",     d: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" },
      { step: 2, href: "/map",     label: "Where you served", d: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" },
      { step: 3, href: "/journey", label: "Connect the dots", d: "M5 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM19 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM19 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM7.5 10.5l9-5M7.5 13l9 5" },
      { step: 4, href: "/health",  label: "Your conditions",  d: "M19 14c1.5-1.6 3-3.3 3-5.5A4.5 4.5 0 0 0 12 6 4.5 4.5 0 0 0 2 8.5C2 10.7 3.5 12.4 5 14l7 7 7-7z" },
      { step: 5, href: "/buddies", label: "Battle buddies",   d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
      { step: 6, href: "/report",  label: "Claim packet",     d: "M14 3v5h5M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-5-5zM9 13h6M9 17h6" },
    ],
  },
  {
    title: "Learn & live well",
    items: [
      { href: "/learn",     label: "Exposure library", d: "M9 2h6M10 2v5.5L5.2 16A2 2 0 0 0 7 19h10a2 2 0 0 0 1.8-3L14 7.5V2" },
      { href: "/solutions", label: "Whole health",     d: "M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" },
      { href: "/book",      label: "Read the book",    d: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 0 3-3h7z" },
    ],
  },
  {
    title: "Just for you",
    tag: "private",
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] flex-none">
      <path d={d} />
    </svg>
  );
}

function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 py-2 pr-3 text-sm transition-all ${
        active
          ? "rounded-r-lg border-l-[3px] border-accent bg-white/15 pl-2.5 font-semibold text-white"
          : "rounded-lg pl-3 text-white/65 hover:bg-white/10 hover:text-white"
      }`}
    >
      {item.step ? (
        <span
          className={`flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full text-[10px] font-bold ${
            active ? "bg-accent text-white" : "bg-white/10 text-white/70"
          }`}
        >
          {item.step}
        </span>
      ) : (
        <Icon d={item.d} />
      )}
      {item.label}
    </Link>
  );
}

export default function AppShell({ title, children }: { title: string; children: React.ReactNode }) {
  const { user, ready, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  const isDashboard = pathname === "/dashboard";
  // history.length > 1 means there is somewhere real to go back TO. A veteran who
  // opened a bookmark or followed a link straight into a deep page has no history,
  // and router.back() would either do nothing or throw him out of the app
  // entirely — so he goes to the Dashboard instead. A back button that sometimes
  // does nothing is worse than none: he taps it twice and decides the app is broken.
  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/dashboard");
  }

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-7 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-ink">Please sign in</h1>
          <p className="mt-1 text-sm text-muted">You need an account to view this page.</p>
          <Link href="/" className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-600">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  // The whole sidebar scrolls — not just <nav>. With ~440px of fixed chrome
  // below the nav, a short viewport (phone landscape) used to clip the crisis
  // line off-screen with no way to reach it, which defeats the entire point of
  // keeping 988 one tap away.
  const sidebar = (
    <div className="flex h-full flex-col overflow-y-auto bg-brand">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/owh-round.png" alt="OWH" className="h-11 w-11 flex-none object-contain" />
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-tight text-white">Connecting the Dots</div>
          <div className="text-[11px] text-white/45">of Service</div>
        </div>
      </div>

      {/* Service-ribbon accent */}
      <ServiceRibbon className="opacity-90" />

      {/* Nav */}
      <nav className="flex-1 space-y-4 px-3 py-2">
        {SECTIONS.map((section, si) => (
          <div key={si} className="space-y-0.5">
            {section.title && (
              <div className="flex items-center gap-1.5 px-3 pb-1 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/35">
                  {section.title}
                </span>
                {section.tag && (
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/40">
                    {section.tag}
                  </span>
                )}
              </div>
            )}
            {section.items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={pathname === item.href || pathname.startsWith(item.href + "/")}
                onClick={() => setOpen(false)}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* The mission */}
      <div className="border-t border-white/10 px-3 py-2 space-y-0.5">
        <div className="px-3 pb-1 pt-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/35">The mission</span>
        </div>
        {BOTTOM_LINKS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={pathname === item.href}
            onClick={() => setOpen(false)}
          />
        ))}
      </div>

      {/* 250th anniversary */}
      <div className="px-3 pt-3">
        <StarRow count={7} className="mb-2.5" />
        <Anniversary250 />
      </div>

      {/* User / sign out */}
      <div className="border-t border-white/10 p-3">
        <div className="truncate px-2 text-xs text-white/35">{user.email}</div>
        <button
          onClick={signOut}
          className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-white/55 transition hover:bg-white/10 hover:text-white"
        >
          Sign out
        </button>
        {/* The floor: the crisis line is always one tap away, on every page.
            The book closes every chapter with it; an app that asks veterans to
            relive their exposures owes them the same. */}
        <a
          href="tel:988"
          className="mt-2 flex items-center gap-2 rounded-lg bg-scarlet/90 px-3 py-2 text-xs font-bold text-white transition hover:brightness-110"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 flex-none" aria-hidden="true">
            <path d="M12 21s-6.7-4.35-9.33-8.07C1.1 10.7 1.64 7.6 4 6.1a5 5 0 0 1 8 1.4 5 5 0 0 1 8-1.4c2.36 1.5 2.9 4.6 1.33 6.83C18.7 16.65 12 21 12 21z" />
          </svg>
          <span className="leading-tight">Veterans Crisis Line<br /><span className="font-medium text-white/80">988, then press 1</span></span>
        </a>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 px-2 text-[10px] text-white/30">
          <a href="mailto:michael@operationwholehealth.org?subject=Connecting%20the%20Dots%20feedback" className="hover:text-white/60">Send feedback</a>
          <Link href="/privacy" className="hover:text-white/60">Privacy</Link>
          <Link href="/terms" className="hover:text-white/60">Terms</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[256px_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:block print:hidden">
        <div className="sticky top-0 h-screen overflow-hidden">{sidebar}</div>
      </aside>

      {/* Drawer (mobile) */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 shadow-2xl">{sidebar}</div>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-white/95 px-5 py-3 backdrop-blur print:hidden">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg border border-line p-1.5 text-muted hover:bg-canvas lg:hidden"
            aria-label="Open menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="h-5 w-5">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {/* Back. Every screen gets one, from the shell, because ad-hoc "←" links
              on some pages and not others is how a veteran gets stranded — and on
              a phone the whole menu is hidden behind the button to the left, so
              without this the only way out of a deep page is to know it is there.
              Uses real history when there is any, and falls back to the Dashboard
              when he arrived cold from a link or a bookmark, so it can never be a
              dead button. Hidden on the Dashboard itself, which is the floor. */}
          {!isDashboard && (
            <button
              onClick={goBack}
              className="rounded-lg border border-line p-1.5 text-muted transition hover:bg-canvas hover:text-ink"
              aria-label="Go back"
              title="Back"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}
          <h1 className="text-base font-bold tracking-tight text-ink">{title}</h1>

          <Link
            href="/support"
            className="ml-auto flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-canvas"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 text-red-500" aria-hidden="true">
              <path d="M12 21s-6.7-4.35-9.33-8.07C1.1 10.7 1.64 7.6 4 6.1a5 5 0 0 1 8 1.4 5 5 0 0 1 8-1.4c2.36 1.5 2.9 4.6 1.33 6.83C18.7 16.65 12 21 12 21z" />
            </svg>
            Need support?
          </Link>

          {/* Account menu (always visible) */}
          <div className="relative">
            <button
              onClick={() => setMenu((m) => !m)}
              className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3 text-sm text-ink transition hover:bg-canvas"
              aria-label="Account menu"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                {(user.email?.[0] ?? "U").toUpperCase()}
              </span>
              <span className="hidden max-w-[140px] truncate font-medium sm:block">{user.email}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 text-muted transition-transform ${menu ? "rotate-180" : ""}`}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {menu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                <div className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-white shadow-lg">
                  <div className="border-b border-line px-4 py-3">
                    <div className="text-xs text-faint">Signed in as</div>
                    <div className="truncate text-sm font-semibold text-ink">{user.email}</div>
                  </div>
                  <TextSizeControl />
                  <Link
                    href="/account"
                    onClick={() => setMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink transition hover:bg-canvas"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] text-muted">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" />
                    </svg>
                    Account settings
                  </Link>
                  <button
                    onClick={() => { setMenu(false); signOut(); }}
                    className="flex w-full items-center gap-2.5 border-t border-line px-4 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                    </svg>
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 px-5 py-6 sm:px-7 lg:px-9">
          <div className="mx-auto w-full max-w-4xl"><OpsecGate>{children}</OpsecGate></div>
        </main>
      </div>
    </div>
  );
}
