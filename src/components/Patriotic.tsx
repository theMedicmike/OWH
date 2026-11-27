// Shared patriotic brand elements — the campaign-ribbon stripe, a faint star
// field, and the America 250 (Semiquincentennial) mark. Used across the app to
// give a dignified, military-honorable feel without ever getting loud.

function Star({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2l2.9 6.26 6.85.62-5.18 4.55 1.53 6.71L12 17.9l-6.1 2.84 1.53-6.71L2.25 9.48l6.85-.62z" />
    </svg>
  );
}

// A campaign-ribbon stripe: scarlet / cream / blue / gold, mirrored. The
// reference only a service member fully reads — subtle, but it speaks to them.
export function ServiceRibbon({ className = "" }: { className?: string }) {
  return (
    <div className={`flex h-1.5 w-full overflow-hidden ${className}`} aria-hidden="true">
      <span className="flex-1 bg-scarlet" />
      <span className="flex-1 bg-cream" />
      <span className="flex-1 bg-flagblue" />
      <span className="flex-1 bg-accent" />
      <span className="flex-1 bg-flagblue" />
      <span className="flex-1 bg-cream" />
      <span className="flex-1 bg-scarlet" />
    </div>
  );
}

// A ribbon stripe split by a centered label — used as a section divider.
export function RibbonDivider({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      
      <span className="flex-none text-[0.8125rem] font-medium text-muted">{label}</span>
      
    </div>
  );
}

// A faint row of stars, nodding to the flag's union. For use on dark surfaces.
export function StarRow({ count = 7, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`flex justify-center gap-2 ${className}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-2.5 w-2.5 text-white/20" />
      ))}
    </div>
  );
}

// The America 250 chip for the navy sidebar / dark surfaces.
export function Anniversary250({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-lg border border-accent/50 px-3 py-2 text-center ${className}`}>
      <div className="flex items-center justify-center gap-1.5 text-[0.8125rem] font-semibold tracking-wider text-accent">
        <span>1776</span>
        <Star className="h-2 w-2" />
        <span>2026</span>
      </div>
      <div className="mt-0.5 text-[0.8125rem] uppercase tracking-[0.08em] text-white/60">250 years of service</div>
    </div>
  );
}

// The round 250 seal for the dashboard welcome card (sits on navy).
export function Seal250({ className = "" }: { className?: string }) {
  return (
    <div className={`flex h-16 w-16 flex-none flex-col items-center justify-center rounded-full border-2 border-accent text-center ${className}`}>
      <div className="text-lg font-bold leading-none text-accent">250</div>
      {/* "1776–2026" cannot fit this circle at a readable 13px, so the seal
          says "years" and the dates live on the Anniversary250 chip. */}
      <div className="mt-0.5 text-[0.8125rem] leading-none text-white/70">years</div>
    </div>
  );
}
