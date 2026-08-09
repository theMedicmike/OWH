// PostgREST error discrimination — get this wrong and "defensive" fallbacks
// become dead code. An UPDATE/INSERT with an unknown column fails with code
// PGRST204 ("Could not find the 'x' column ... in the schema cache"); only
// SELECTs produce Postgres 42703 ("column ... does not exist"). Both mean the
// same thing for us: a migration hasn't been applied yet.
export function isMissingColumnError(e: { code?: string; message?: string } | null | undefined): boolean {
  if (!e) return false;
  if (e.code === "PGRST204" || e.code === "42703") return true;
  const m = e.message ?? "";
  return /column .* does not exist/i.test(m) || /could not find the '.*' column/i.test(m);
}

// The whole-TABLE version of the same problem — PostgREST returns PGRST205
// ("Could not find the table ... in the schema cache") and Postgres itself
// returns 42P01 ("relation ... does not exist"). 0018/0019 are the first new
// tables since 0009, so this path had never been exercised before them.
export function isMissingTableError(e: { code?: string; message?: string } | null | undefined): boolean {
  if (!e) return false;
  if (e.code === "PGRST205" || e.code === "42P01") return true;
  const m = e.message ?? "";
  return /relation .* does not exist/i.test(m) || /could not find the table/i.test(m);
}

export const FEATURE_NOT_MIGRATED_MESSAGE =
  "This section isn't switched on yet. Nothing is wrong with your record — the database update for it hasn't been applied.";
