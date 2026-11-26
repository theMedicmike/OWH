import { notFound } from "next/navigation";
import PreviewClient from "./PreviewClient";

// DEV ONLY. Renders Home and the print with the invented example page, so the
// design can be checked and screenshotted without signing in and without
// reading or writing a single production row. A production build answers 404.
export const metadata = { title: "Preview (dev only)", robots: { index: false, follow: false } };

export default async function FirstPagePreview({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { view } = await searchParams;
  return <PreviewClient view={view === "empty" || view === "print" ? view : "example"} />;
}
