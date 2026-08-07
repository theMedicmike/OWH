// ─────────────────────────────────────────────────────────────────────────────
// SERVICE DATES — ONE BRAIN.
//
// Two screens write members.service_start / service_end: the signup wizard and
// Account. They already drifted once — the wizard had an "I am currently serving"
// checkbox and Account had nothing, so a man who was still in could say so at
// signup and then never see it again. All the parsing, building and formatting
// lives here so that cannot happen twice.
//
// THE HONESTY RULE THIS FILE EXISTS TO ENFORCE:
// service_start and service_end are DATE columns, so something must go in the
// month and day slots. Both screens used to stamp `${year}-01-01`, inventing a
// precision the veteran never gave. Nothing downstream reads past the year, so no
// rater ever saw it — but this app's entire argument is that a record should never
// contain a date nobody supplied. We now record HOW PRECISE his answer was, and
// never render more precision than he actually gave us.
// ─────────────────────────────────────────────────────────────────────────────

export type DatePrecision = "year" | "month" | "day";

export type ServiceDateParts = {
  year: string;
  month: string; // "" when not given
  day: string;   // "" when not given
};

export const EMPTY_PARTS: ServiceDateParts = { year: "", month: "", day: "" };

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Years a veteran could plausibly have served, newest first. */
export function serviceYears(): number[] {
  const now = new Date().getUTCFullYear();
  const out: number[] = [];
  for (let y = now; y >= 1940; y--) out.push(y);
  return out;
}

/** Days 1-31. The picker does not try to know February — see clampDay. */
export function daysInMonth(year: string, month: string): number {
  const y = parseInt(year), m = parseInt(month);
  if (!y || !m) return 31;
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Drop a day that cannot exist in the chosen month (31 Feb → blank). */
export function clampDay(parts: ServiceDateParts): ServiceDateParts {
  if (!parts.day) return parts;
  const max = daysInMonth(parts.year, parts.month);
  return parseInt(parts.day) > max ? { ...parts, day: "" } : parts;
}

/**
 * Read a stored date back into pickers, at the precision he actually gave.
 * Rows written before 2026-08 carry no precision; they are year-only by
 * definition, and showing "1 January" for them would be reading back an answer
 * he never gave.
 */
export function toParts(stored: string | null | undefined, precision?: string | null): ServiceDateParts {
  if (!stored) return { ...EMPTY_PARTS };
  const d = new Date(stored);
  if (Number.isNaN(d.getTime())) return { ...EMPTY_PARTS };
  const year = String(d.getUTCFullYear());
  if (!precision || precision === "year") return { year, month: "", day: "" };
  const month = String(d.getUTCMonth() + 1);
  if (precision === "month") return { year, month, day: "" };
  return { year, month, day: String(d.getUTCDate()) };
}

/**
 * Build the value to store, plus how precise it is.
 *
 * `edge` decides what a partial answer means. A START is the earliest it could
 * have been; an END is the latest — which also preserves the existing
 * year-only convention of `${year}-12-31`, so no stored row shifts underneath a
 * veteran who never touched this screen.
 */
export function fromParts(
  parts: ServiceDateParts,
  edge: "start" | "end",
): { date: string; precision: DatePrecision } | null {
  const { year, month, day } = clampDay(parts);
  if (!year) return null;
  const y = parseInt(year);
  const thisYear = new Date().getUTCFullYear();
  if (!y || y < 1940 || y > thisYear) return null; // never store an impossible year

  if (!month) {
    return { date: edge === "start" ? `${year}-01-01` : `${year}-12-31`, precision: "year" };
  }
  const mm = String(parseInt(month)).padStart(2, "0");
  if (!day) {
    const last = daysInMonth(year, month);
    const dd = edge === "start" ? "01" : String(last).padStart(2, "0");
    return { date: `${year}-${mm}-${dd}`, precision: "month" };
  }
  return { date: `${year}-${mm}-${String(parseInt(day)).padStart(2, "0")}`, precision: "day" };
}

/** Human form of a single date, never more precise than he told us. */
export function formatDate(stored: string | null | undefined, precision?: string | null): string {
  const p = toParts(stored, precision);
  if (!p.year) return "";
  if (!p.month) return p.year;
  const name = MONTHS[parseInt(p.month) - 1] ?? "";
  return p.day ? `${p.day} ${name} ${p.year}` : `${name} ${p.year}`;
}

/**
 * The service span as it should appear anywhere a human reads it.
 *
 * 🔴 A still-serving veteran must never render as "2018–?". That reads as a
 * missing date — an incomplete record — when in fact he answered the question and
 * the answer is that he has not left yet. Four screens got this wrong at once
 * (dashboard, journey, packet, and the exported archive), which is why the rule
 * lives here rather than being retyped in each of them.
 *
 * The four call sites currently render YEARS only, because that is all any of
 * them has ever shown and all a VA rater needs. Pass `precision` when a screen
 * wants the fuller form.
 */
export function formatServiceSpan(opts: {
  start: string | null | undefined;
  end: string | null | undefined;
  stillServing?: boolean | null;
  startPrecision?: string | null;
  endPrecision?: string | null;
}): string {
  const { start, end, stillServing, startPrecision, endPrecision } = opts;
  const s = formatDate(start, startPrecision);
  if (stillServing) return s ? `${s}–present` : "Currently serving";
  const e = formatDate(end, endPrecision);
  if (s && e) return `${s}–${e}`;
  if (s) return `${s}–end date not recorded`;
  if (e) return `start date not recorded–${e}`;
  return "";
}
