"use client";

import { useState } from "react";
import type { PageData } from "@/lib/firstPage";
import { buildFirstPagePdf, firstPagePdfName } from "@/lib/firstPagePdf";

// Saves the First Page as a two-page PDF, side 1 then side 2. On a phone that
// can share files it opens the share sheet; everywhere else it downloads.

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Some browsers read the object URL after click() returns; free it shortly after.
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export default function SavePdfButton({ page, className = "btn btn-outline btn-lg", label = "Save the PDF" }: { page: PageData | null; className?: string; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!page) return null;

  async function save() {
    if (!page || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const blob = await buildFirstPagePdf(page);
      const name = firstPagePdfName(page);
      const file = new File([blob], name, { type: "application/pdf" });
      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "The First Page" });
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") return;
          download(blob, name);
        }
      } else {
        download(blob, name);
      }
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" onClick={save} disabled={busy} aria-busy={busy} className={className}>
        {busy ? "Making the PDF…" : label}
      </button>
      {failed && <span role="alert" className="text-xs text-scarlet">The PDF could not be made. Try again.</span>}
    </>
  );
}
