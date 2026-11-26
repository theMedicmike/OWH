import Landing from "@/components/Landing";

// The root canonical lives HERE, not on the layout, so it applies to this page
// only. See the note in src/app/layout.tsx.
export const metadata = {
  // The layout template appends the product name, so this stays a phrase.
  title: "What happened to you, on one page",
  description:
    "A free, private First Page for veterans: where you served, what you were around, what changed, and the line between them. Print it and hand it over at every visit. Not the VA. Nothing sold.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return <Landing />;
}
