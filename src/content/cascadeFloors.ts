import { BOOK_CHAPTERS } from "./book";

// ─────────────────────────────────────────────────────────────────────────────
// THE CASCADE, AS THE BOOK TELLS IT — four floors, one chain reaction.
//
//   "That cascade does not stop at the edge of the body. The same chain
//    reaction crosses into a veteran's conscience... into his family... and
//    into the very system built to catch him, where being disbelieved, and
//    made to prove his own wounds, drives everything underneath it deeper.
//    One cascade, four floors."
//
// The app documented only the FIRST floor. This maps all four onto the
// veteran's own record — never asserting what someone feels, only naming the
// floors and showing which ones their record already touches.
//
// SERVER-ONLY: this imports the 1.6 MB manuscript to resolve chapter slugs, so
// it must never be imported by a client component. The journey PAGE resolves
// these and passes the results down as plain props.
// ─────────────────────────────────────────────────────────────────────────────

export type CascadeFloor = {
  key: "body" | "conscience" | "family" | "institution";
  name: string;
  line: string;
  chapterTitle: string | null;
  chapterSlug: string | null;
};

// Match on the number-independent slug — chapter numbers drift every time a
// chapter is inserted (they already did once), titles don't.
const base = (slug: string) => slug.replace(/^\d+-/, "");

function find(baseSlug: string): { title: string; slug: string } | null {
  const c = BOOK_CHAPTERS.find((ch) => base(ch.slug) === baseSlug);
  return c ? { title: c.title, slug: c.slug } : null;
}

const FLOORS: { key: CascadeFloor["key"]; name: string; line: string; chapter: string }[] = [
  {
    key: "body",
    name: "The body",
    line: "Exposure sets off a chain reaction across systems — brain, gut, hormones, immune, the mitochondria that power every cell — each failing part dragging the next down with it.",
    chapter: "the-veteran-biological-cascade",
  },
  {
    key: "conscience",
    name: "The conscience",
    line: "A depleted brain cannot carry the weight of what you saw or did. This floor is not weakness — it is the same cascade, arriving somewhere a lab test doesn't look.",
    chapter: "moral-injury-the-wound-that-isn-t-in-the-body",
  },
  {
    key: "family",
    name: "The family",
    line: "The people who love you tune themselves to your storms and absorb what you can never quite name. They served too, and it reaches them.",
    chapter: "the-family-cascade",
  },
  {
    key: "institution",
    name: "The institution",
    line: "Being disbelieved — being made to prove your own wounds — drives everything underneath it deeper. This is the floor this app was built to take off your back.",
    chapter: "guilty-until-proven-injured",
  },
];

export function cascadeFloors(): CascadeFloor[] {
  return FLOORS.map((f) => {
    const ch = find(f.chapter);
    return {
      key: f.key,
      name: f.name,
      line: f.line,
      chapterTitle: ch?.title ?? null,
      chapterSlug: ch?.slug ?? null,
    };
  });
}
