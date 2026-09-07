import Landing from "@/components/Landing";

// The root canonical lives HERE, not on the layout, so it applies to this page
// only. See the note in src/app/layout.tsx.
export const metadata = {
  // The layout template appends the product name, so this stays a phrase.
  title: "Document what your service cost you",
  description:
    "A free, private record of where you served, what you were exposed to, and the conditions that followed — assembled into a cited packet you hand to an accredited Veterans Service Officer. Not the VA. Nothing sold.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return <Landing />;
}
