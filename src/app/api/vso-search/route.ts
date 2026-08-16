import { NextResponse } from "next/server";
import { searchVso } from "@/lib/vsoDirectory";

// Server-side on purpose. The directory is ~1.4 MB of accredited-rep data;
// it stays in the function and only the handful of matching rows crosses the
// wire. Nothing about the veteran is sent, stored, or logged here — the whole
// request is a ZIP code, and the response is public federal data.

// NOT force-static: this reads a ?zip= query param, and a statically
// rendered route has no search params to read — it 404s. Caching happens at
// the edge via the Cache-Control header below instead, which is the right
// layer for it anyway since the response varies only by ZIP.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const zip = new URL(request.url).searchParams.get("zip") ?? "";
  const result = searchVso(zip);
  return NextResponse.json(result, {
    // Public data keyed only by ZIP — cacheable at the edge for a day, which
    // also means a veteran typing their ZIP twice pays for it once.
    headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
  });
}
