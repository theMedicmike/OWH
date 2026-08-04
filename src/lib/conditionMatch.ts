import { EXPOSURE_LABEL, RECOGNIZED_CLASSES } from "@/lib/education";
import { defFor, PROGRAM_LABEL, type LinkType } from "@/lib/conditions";

// ─────────────────────────────────────────────────────────────────────────────
// CONNECTING THE DOTS — the sentence, not the badge.
//
// The whole point of the app: line a condition up against WHERE the veteran
// actually served, and say it in plain English. Time-aware, because the gap
// between an exposure and the first symptom is the most persuasive honest thing
// a self-prepared record can carry — and because "you were there in 2004, this
// started in 2011" is a story a rater can follow, where a green checkmark is
// just a claim.
//
// Hard rules baked in here so no caller can get them wrong:
//   • Never asserts causation. "Studied alongside", "documented at", never
//     "caused by" and never "you qualify".
//   • Never a verdict. Presumptive programs produce a QUESTION for a VSO.
//   • Event-linked conditions (tinnitus, PTSD, TBI, bad backs) never show a
//     dead end — they get an honest sentence about why the map can't speak to
//     them, because that failure hits a huge share of veterans.
// ─────────────────────────────────────────────────────────────────────────────

export type TourLite = {
  place: string;
  year: number | null;
  note: string | null;
  classes: string[];
};

export type MatchResult = {
  kind: "place" | "event" | "none" | "no-locations";
  /** the main plain-English sentence */
  sentence: string;
  /** the veteran's own words from that check-in, quoted back */
  quote?: string;
  /** years between the exposure and onset, when both are known */
  gapYears?: number | null;
  /** "Ask an accredited VSO whether this falls under …" */
  ask?: string;
  /** exposure classes that drove the match, for chips */
  classes?: string[];
};

function list(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function matchCondition(
  label: string,
  onsetYear: number | null,
  tours: TourLite[],
): MatchResult {
  const def = defFor(label);
  const link: LinkType = def?.link ?? "both";
  const assoc = def?.exposures ?? [];

  // A condition that attaches to what HAPPENED, not where the air was bad.
  // This is the honest answer, not a rejection — and it's a large share of the
  // most-claimed disabilities.
  const eventSentence =
    "This one usually connects to what happened to you — a blast, noise, an injury, or what you carried home — not to where the air or water was bad. A map pin can't speak to it. An accredited VSO will ask you about it directly, and your own account is the evidence that matters most.";

  if (link === "event" || assoc.length === 0) {
    return { kind: "event", sentence: eventSentence };
  }

  if (tours.length === 0) {
    return {
      kind: "no-locations",
      sentence:
        "Your service isn't on the record yet. Add where you served and this will line up against what's documented at those places.",
    };
  }

  // Find the tours whose documented exposures overlap this condition's.
  const hits = tours
    .map((t) => ({ tour: t, shared: t.classes.filter((c) => assoc.includes(c)) }))
    .filter((h) => h.shared.length > 0);

  if (hits.length === 0) {
    return {
      kind: "none",
      sentence:
        "Nothing you've logged so far lines up with this one in our data. That doesn't mean nothing does — our list of documented sites is not the whole world, and it isn't the government's list either. Add more of where you served, and bring this up with an accredited VSO regardless.",
    };
  }

  // Earliest hit carries the story — the longest, most persuasive gap.
  hits.sort((a, b) => (a.tour.year ?? 9999) - (b.tour.year ?? 9999));
  const first = hits[0];
  const classes = Array.from(new Set(hits.flatMap((h) => h.shared)));
  const classNames = list(classes.map((c) => EXPOSURE_LABEL[c] ?? c));
  const place = first.tour.place;
  const year = first.tour.year;

  const gap = year && onsetYear && onsetYear >= year ? onsetYear - year : null;

  let sentence = year
    ? `You were at ${place} in ${year}, where ${classNames.toLowerCase()} ${classes.length === 1 ? "is" : "are"} documented.`
    : `${classNames} ${classes.length === 1 ? "is" : "are"} documented at ${place}, where you served.`;

  if (gap !== null) {
    sentence +=
      gap === 0
        ? ` Your ${label.toLowerCase()} began that same year.`
        : ` Your ${label.toLowerCase()} began about ${onsetYear} — a ${gap}-year gap.`;
  }

  sentence += ` ${classNames} and ${label.toLowerCase()} are studied together. That's a question worth asking, not an answer.`;

  const otherPlaces = Array.from(new Set(hits.slice(1).map((h) => h.tour.place)));
  if (otherPlaces.length > 0) {
    sentence += ` The same is documented at ${list(otherPlaces)}.`;
  }

  // Presumptive programs → a question for a VSO, never a verdict.
  const programs = def?.programs ?? [];
  const relevant = programs.filter((p) =>
    p === "gulf_war" ? true : classes.some((c) => RECOGNIZED_CLASSES.has(c)) || true,
  );
  const ask =
    relevant.length > 0
      ? `Ask an accredited VSO whether this falls under ${list(relevant.map((p) => PROGRAM_LABEL[p] ?? p))}. Dates, locations, and your service details decide it — and only VA decides it.`
      : undefined;

  return {
    kind: "place",
    sentence,
    quote: first.tour.note?.trim() || undefined,
    gapYears: gap,
    ask,
    classes,
  };
}
