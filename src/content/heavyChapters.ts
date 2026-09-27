// Dignity map for the book's read-aloud + sharing. HAND-CURATED, not guessed —
// a keyword scan is unusable (the book has 100+ "suicide" mentions and would
// flag nearly everything, diluting the crisis line into wallpaper).
//
// KEYED BY THE NUMBER-INDEPENDENT SLUG (the kebab title, with any leading
// "NN-" ordinal stripped) so the map SURVIVES book.ts renumbering. Chapter
// numbers drift every time a chapter is inserted; titles do not. Matching on
// the title portion removes the silent-miss failure mode where a renumber left
// a crisis chapter unprotected. Only a RETITLE (rare, and loud) can now break a
// key.
//
// ⚠️ Michael must sign off on which chapters belong in these three sets — it is
// an author/dignity decision — and re-check whenever a chapter is ADDED or
// RETITLED.

// Strip the leading "NN-" ordinal so keys are stable across renumbering.
const base = (slug: string) => slug.replace(/^\d+-/, "");

// Heavy chapters: the crisis line (988) is baked into the card image, added to
// the caption, and shown in the Listen bar and share sheet.
export const HEAVY_CHAPTERS = new Set<string>([
  "the-smoke-and-the-fire",          // pillar; lifeline + 988 sit at chapter END
  "the-veteran-biological-cascade",  // map chapter; closing lifeline section at END
  "sworn-to-silence",
  "the-family-cascade",
  "the-biology-of-suicide",
  "the-addiction-cascade",
  "moral-injury-the-wound-that-isn-t-in-the-body",
  "the-family-that-served-too",
  "the-caregiver-who-served-too",
  "the-pain-they-made-you-prove",
  // Added 2026-09-23, carrying over Michael's sign-off on the five gap chapters
  // (the same four are in HEAVY_BY_IDENTITY in the book site's build-book-site.cjs).
  // Each closes ON the crisis line rather than opening near it.
  "the-work-that-went-first",         // ends on the insurance-money passage + 988
  "the-long-arc",                     // dementia, caregiver collapse, dying
  "the-room-where-someone-asks",      // incarceration + the violent-offence finding
  "the-ones-without-the-word",        // exclusion; the chapter ends on not being here at all
  // NOT flagged, deliberately: "the-medicine-you-can-t-swallow" is hopeful throughout.
  // Also NOT here, and that is not an oversight: the book site additionally flags
  // "the-weight-of-the-trigger" and "when-the-cascade-reaches-the-street" as
  // site-only, where it chose to be more protective than this app. Don't "sync"
  // those two in without asking Michael — the divergence is intentional.
]);

// The most acute — the celebratory 250th seal and the "READ FREE" promo are
// suppressed so a keepsake under a line about loss never sits next to a CTA.
export const MEMORIAM_ONLY = new Set<string>([
  "the-biology-of-suicide",
]);

// Real named people / private first-person testimony — do NOT allow minting
// into public cards. In-app reading consent is not consent for social
// redistribution of a private person's name and words.
export const NO_SHARE = new Set<string>([
  "dedication",
  "in-their-own-words",
]);

export const isHeavy = (slug: string) => HEAVY_CHAPTERS.has(base(slug)) || MEMORIAM_ONLY.has(base(slug));
export const isMemoriamOnly = (slug: string) => MEMORIAM_ONLY.has(base(slug));
export const canShareChapter = (slug: string) => !NO_SHARE.has(base(slug));
