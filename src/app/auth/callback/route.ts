import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// WHERE `next` GETS VALIDATED, AND WHY IT HAS TO BE.
//
// `next` arrives in the query string, so it is attacker-controlled. It used to
// be concatenated straight onto `origin`, which made this an open redirect.
// Found in the pre-launch audit, 2026-10-05:
//
//   next = "@evil.com"  ->  https://www.tracethecascade.com@evil.com
//
// That is a valid URL whose HOST is evil.com — the "@" turns the real domain
// into a username and everything after it becomes the destination. So a link
// wearing this domain's name could sign a veteran in and then hand him to a
// hostile site. The "//evil.com" and "\evil.com" forms happen to be safe (a
// browser reads those as paths), but "@" is not, and relying on which of the
// three a parser forgives is not a security control.
//
// Enforcing a single leading slash defeats all of them at once: once `next`
// starts with exactly one "/", "origin + next" cannot change the host, because
// "@" and ":" after a path separator are just path characters. The backslash
// exclusion is belt-and-braces for browsers that normalise "\" to "/".
//
// Do not loosen this to allow absolute URLs. If an off-site redirect is ever
// genuinely needed, add an explicit allowlist of hosts — never a pattern.
function safeNext(raw: string | null): string {
  if (!raw) return "/dashboard";
  return /^\/(?!\/)[^\\]*$/.test(raw) ? raw : "/dashboard";
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong — send them to sign in
  return NextResponse.redirect(`${origin}/?error=confirmation_failed`);
}
