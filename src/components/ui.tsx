import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// The handful of shapes every screen is built from. The styles themselves
// live in globals.css (.card, .btn, .row, .spine) so a page can use them as
// plain classes too; these wrappers only keep the markup consistent.

export function Card({ raise = false, className = "", children, ...rest }: ComponentProps<"div"> & { raise?: boolean }) {
  return (
    <div className={`card ${raise ? "card-raise" : ""} ${className}`} {...rest}>
      {children}
    </div>
  );
}

// A section heading with an optional one-sentence lede. The heading carries
// its own weight: no eyebrow above it, ever.
export function SectionTitle({ title, lede, aside }: { title: string; lede?: string; aside?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
        {lede && <p className="mt-1 text-[15px] leading-relaxed text-muted">{lede}</p>}
      </div>
      {aside && <div className="flex-none">{aside}</div>}
    </div>
  );
}

// The small right-pointing chevron every tappable row ends with: one drawn
// icon, never a "→" glyph.
export function Chevron({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 flex-none ${className}`} aria-hidden="true">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function Check({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className={`h-3 w-3 ${className}`} aria-hidden="true">
      <path d="m5 12 4 4L19 7" />
    </svg>
  );
}

// A tappable list row that links somewhere: label, optional detail line,
// optional status word on the right, and a chevron.
export function LinkRow({
  href,
  label,
  detail,
  status,
  tone = "faint",
  icon,
}: {
  href: string;
  label: string;
  detail?: string;
  status?: string;
  tone?: "faint" | "success" | "accent" | "ink";
  icon?: ReactNode;
}) {
  const toneClass = { faint: "text-faint", success: "text-success", accent: "text-accent", ink: "text-ink" }[tone];
  return (
    <Link href={href} className="row group">
      {icon && <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-canvas text-brand">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold leading-snug">{label}</span>
        {detail && <span className="mt-0.5 block text-sm leading-snug text-muted">{detail}</span>}
      </span>
      {status && <span className={`flex-none text-sm font-semibold ${toneClass}`}>{status}</span>}
      <Chevron className="text-faint transition-colors group-hover:text-ink" />
    </Link>
  );
}

export type SpineState = "done" | "next" | "todo";

// One step on the spine: a dot on the line, a label, a status word.
export function SpineRow({
  href,
  step,
  label,
  detail,
  state,
  statusWord,
}: {
  href: string;
  step: number;
  label: string;
  detail?: string;
  state: SpineState;
  statusWord?: string;
}) {
  const word = statusWord ?? (state === "done" ? "Done" : state === "next" ? "Next" : "Not yet");
  const wordTone = state === "done" ? "text-success" : state === "next" ? "text-accent" : "text-faint";
  return (
    <li className="spine-item">
      <Link href={href} className={`row group rounded-xl ${state === "next" ? "bg-accent/5" : ""}`}>
        <span className="spine-dot" data-state={state} aria-hidden="true">
          {state === "done" && <Check />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold leading-snug">
            <span className="sr-only">Step {step}: </span>
            {label}
          </span>
          {detail && <span className="mt-0.5 block text-sm leading-snug text-muted">{detail}</span>}
        </span>
        <span className={`flex-none text-sm font-semibold ${wordTone}`}>{word}</span>
        <Chevron className="text-faint transition-colors group-hover:text-ink" />
      </Link>
    </li>
  );
}

// A single calm statement at the top of a screen: the serif, the one place
// it is used.
export function Statement({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h2 className={`display text-[1.75rem] text-ink sm:text-[2rem] ${className}`}>{children}</h2>;
}
