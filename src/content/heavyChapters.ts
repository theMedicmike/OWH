// Dignity map for the book's read-aloud + sharing. HAND-CURATED, not guessed —
// a keyword scan is unusable (the book has 100+ "suicide" mentions and would
// flag nearly everything, diluting the crisis line into wallpaper).
//
// ⚠️ LAUNCH BLOCKER — Michael must review and sign off on these three sets
// before wide sharing, and re-check them whenever book.ts is regenerated
// (slugs can drift). This is an author/dignity decision, not an engineering one.

// Heavy chapters: the crisis line (988) is baked into the card image, added to
// the caption, and shown in the Listen bar and share sheet.
export const HEAVY_CHAPTERS = new Set<string>([
  "20-sworn-to-silence",
  "33-the-family-cascade",
  "34-the-biology-of-suicide",
  "35-the-addiction-cascade",
  "36-moral-injury-the-wound-that-isn-t-in-the-body",
  "58-the-family-that-served-too",
  "59-the-caregiver-who-served-too",
]);

// The most acute — the celebratory 250th seal and the "READ FREE" promo are
// suppressed so a keepsake under a line about loss never sits next to a CTA.
export const MEMORIAM_ONLY = new Set<string>([
  "34-the-biology-of-suicide",
]);

// Real named people / private first-person testimony — do NOT allow minting
// into public cards. In-app reading consent is not consent for social
// redistribution of a private person's name and words.
export const NO_SHARE = new Set<string>([
  "01-dedication",
  "63-in-their-own-words",
]);

export const isHeavy = (slug: string) => HEAVY_CHAPTERS.has(slug) || MEMORIAM_ONLY.has(slug);
export const isMemoriamOnly = (slug: string) => MEMORIAM_ONLY.has(slug);
export const canShareChapter = (slug: string) => !NO_SHARE.has(slug);
