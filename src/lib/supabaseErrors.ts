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
