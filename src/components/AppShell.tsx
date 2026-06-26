"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "./AuthProvider";

type NavItem = { href: string; label: string; d: string };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", d: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" },
  { href: "/map", label: "Map", d: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" },
  { href: "/intake", label: "Guided intake", d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { href: "/estimator", label: "Exposure summary", d: "M3 12h4l3 8 4-16 3 8h4" },
  { href: "/health", label: "Health", d: "M19 14c1.5-1.6 3-3.3 3-5.5A4.5 4.5 0 0 0 12 6 4.5 4.5 0 0 0 2 8.5C2 10.7 3.5 12.4 5 14l7 7 7-7z" },
  { href: "/report", label: "Report", d: "M14 3v5h5M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-5-5zM9 13h6M9 17h6" },
  { href: "/buddies", label: "Battle buddies", d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
  { href: "/account", label: "Account", d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" },
];

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <path d={d} />
    </svg>
  );
}

export default function AppShell({ title, children }: { title: string; children: React.ReactNode }) {
  const { user, ready, signOut } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

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

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
        </span>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight text-ink">Connecting the Dots</div>
          <div className="text-[11px] text-faint">of Service</div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                active ? "bg-brand/10 font-semibold text-brand" : "text-muted hover:bg-canvas hover:text-ink"
              }`}
            >
              <Icon d={item.d} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line p-3">
        <div className="truncate px-2 text-xs text-faint">{user.email}</div>
        <button
          onClick={signOut}
          className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-muted transition hover:bg-canvas hover:text-ink"
        >
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[256px_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="hidden border-r border-line bg-surface lg:block print:hidden">
        <div className="sticky top-0 h-screen">{sidebar}</div>
      </aside>

      {/* Drawer (mobile) */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 border-r border-line bg-surface shadow-xl">{sidebar}</div>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-surface/90 px-5 py-3 backdrop-blur print:hidden">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg border border-line p-1.5 text-muted hover:bg-canvas lg:hidden"
            aria-label="Open menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="h-5 w-5">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-base font-semibold tracking-tight text-ink">{title}</h1>
        </header>

        <main className="flex-1 px-5 py-6 sm:px-7 lg:px-9">
          <div className="mx-auto w-full max-w-4xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
