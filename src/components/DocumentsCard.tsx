"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type FileObj = { name: string };

export default function DocumentsCard() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [files, setFiles] = useState<FileObj[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  // Removing a file is permanent, so it takes a second tap to confirm.
  const [confirming, setConfirming] = useState<string | null>(null);

  async function refresh(uid: string) {
    const { data } = await supabase.storage.from("records").list(uid, {
      sortBy: { column: "created_at", order: "desc" },
    });
    setFiles((data ?? []).filter((f) => f.name !== ".emptyFolderPlaceholder") as FileObj[]);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      if (data.user) refresh(data.user.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setBusy(true);
    setErr("");
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("records").upload(path, file);
    setBusy(false);
    e.target.value = "";
    if (error) {
      setErr(error.message);
      return;
    }
    refresh(user.id);
  }

  async function view(name: string) {
    if (!user) return;
    const { data } = await supabase.storage.from("records").createSignedUrl(`${user.id}/${name}`, 120);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  async function remove(name: string) {
    if (!user) return;
    await supabase.storage.from("records").remove([`${user.id}/${name}`]);
    refresh(user.id);
  }

  if (!user) return null;

  return (
    <section className="card p-5 sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight text-ink">Your records</h2>
      <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted">
        Upload your DD-214, medical records, lab results, or claim letters. Private to you.
      </p>
      <p className="mt-3 rounded-xl border border-warn/40 bg-warn-soft px-4 py-3 text-[0.9375rem] leading-relaxed text-ink">
        <span className="font-semibold">Cover your Social Security number first.</span> Your SSN is printed in Box 3
        of a DD-214, and image scans print with your claim packet. Cover the SSN before you photograph the page.
        The app never needs it.
      </p>

      <label
        aria-disabled={busy}
        className={`btn btn-primary btn-lg mt-4 cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-600 ${busy ? "cursor-not-allowed opacity-60" : ""}`}
      >
        {busy ? "Uploading…" : "Upload a file"}
        <input type="file" className="sr-only" onChange={onUpload} disabled={busy} />
      </label>

      {err && <p role="status" className="mt-2 text-[0.9375rem] font-medium text-scarlet">{err}</p>}

      {files.length > 0 && (
        <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
          {files.map((f) => {
            const shown = f.name.replace(/^\d+-/, "");
            return (
              <li key={f.name} className="px-3 py-2">
                {confirming === f.name ? (
                  <div className="flex min-h-12 flex-wrap items-center gap-2">
                    <span className="min-w-0 flex-1 text-[0.9375rem] text-ink">
                      Remove <span className="font-semibold">{shown}</span>? This cannot be undone.
                    </span>
                    <button type="button" onClick={() => setConfirming(null)} className="btn btn-secondary min-h-11">
                      Keep it
                    </button>
                    <button type="button" onClick={() => { setConfirming(null); remove(f.name); }} className="btn btn-danger min-h-11">
                      Yes, remove
                    </button>
                  </div>
                ) : (
                  <div className="flex min-h-12 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => view(f.name)}
                      className="min-h-11 min-w-0 flex-1 truncate text-left text-[0.9375rem] font-semibold text-brand hover:underline"
                    >
                      {shown}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming(f.name)}
                      aria-label={`Remove ${shown}`}
                      className="btn btn-secondary min-h-11 flex-none"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* ⚠️ An earlier version of this sentence said "the science board reviews
          documents to verify exposures and conditions." No such board exists and
          nobody here reviews your files — the same false claim was retracted on
          the estimator on 2026-08-06 and this second instance survived that pass
          because it says "science board" rather than "advisory board". Do not
          reinstate any promise that a person or panel checks these documents. */}
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Stored privately, visible only to you. Nobody here reads them. Uploading records is how you move a
        claim beyond self-reported: the paper is what a VA rater weighs most heavily, and having it in one
        place means you can hand it to your VSO in one go.
      </p>
    </section>
  );
}
