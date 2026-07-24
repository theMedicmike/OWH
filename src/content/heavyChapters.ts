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
