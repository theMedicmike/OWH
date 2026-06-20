import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client. Reads the public URL and anon key from the
// environment. Row-Level Security on the database protects member data, so the
// anon key is safe to ship to the browser.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
