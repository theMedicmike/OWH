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
    <div className="rounded-xl border border-zinc-200 p-5">
      <div className="text-sm font-medium text-zinc-900">Your records</div>
      <div className="mt-1 text-xs text-zinc-500">
        Upload your DD-214, medical records, lab results, or claim letters. Private to you.
        {" "}<span className="font-medium">Tip: your SSN is printed in Box 3 of a DD-214, and image
        scans print with your claim packet — cover the SSN before you photograph the page. The app
        never needs it.</span>
      </div>

      <label className="mt-3 inline-block cursor-pointer rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100">
        {busy ? "Uploading…" : "Upload a file"}
        <input type="file" className="hidden" onChange={onUpload} disabled={busy} />
      </label>

      {err && <p className="mt-2 text-xs text-rose-500">{err}</p>}

      {files.length > 0 && (
        <ul className="mt-3 divide-y divide-zinc-100">
          {files.map((f) => (
            <li key={f.name} className="flex items-center justify-between gap-3 py-2 text-sm">
              <button onClick={() => view(f.name)} className="truncate text-left text-blue-600 hover:underline">
                {f.name.replace(/^\d+-/, "")}
              </button>
              <button onClick={() => remove(f.name)} className="flex-none text-xs text-zinc-400 hover:text-rose-500">
                remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ⚠️ An earlier version of this sentence said "the science board reviews
          documents to verify exposures and conditions." No such board exists and
          nobody here reviews your files — the same false claim was retracted on
          the estimator on 2026-08-06 and this second instance survived that pass
          because it says "science board" rather than "advisory board". Do not
          reinstate any promise that a person or panel checks these documents. */}
      <p className="mt-3 text-xs text-zinc-400">
        Stored privately, visible only to you — nobody here reads them. Uploading records is how you move a
        claim beyond self-reported: the paper is what a VA rater weighs most heavily, and having it in one
        place means you can hand it to your VSO in one go.
      </p>
    </div>
  );
}
