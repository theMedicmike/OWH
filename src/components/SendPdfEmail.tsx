"use client";

import { useEffect, useState } from "react";
import type { PageData } from "@/lib/firstPage";
import { useAuth } from "./AuthProvider";

// "Send me the PDF": to the email on the veteran's own account, shown but never
// editable. A typed address would mail health information to a third party,
// and would let any account send any file to anyone from this sender. To send
// it to someone else he uses "Save the PDF" and his phone's share sheet.
//
// Lives outside the First Page files on purpose: the First Page itself never
// calls a server route (firewall rule 16b), so this button sits on Home,
// beside "Save the PDF", not inside the page. See src/app/api/page-email.

const OFF = "Email is not set up yet. Use Save the PDF instead.";

type Props = { page: PageData | null; className?: string };

export default function SendPdfEmail(props: Props) {
  const { user } = useAuth();
  return <SendPdfEmailView {...props} email={user?.email ?? ""} />;
}

// The address is passed in, never typed: it is the signed-in account's own.
export function SendPdfEmailView({ page, email, className = "btn btn-outline min-h-11" }: Props & { email: string }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");
  const [note, setNote] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/page-email")
      .then((r) => (r.ok ? r.json() : { enabled: false }))
      .then((j: { enabled?: boolean }) => { if (alive) setEnabled(!!j.enabled); })
      .catch(() => { if (alive) setEnabled(false); });
    return () => { alive = false; };
  }, []);

  if (!page || !email) return null;

  async function send() {
    if (!page) return;
    if (enabled === false) { setState("error"); setNote(OFF); return; }
    setState("busy");
    setNote("");
    try {
      const { buildFirstPagePdf, firstPagePdfName } = await import("@/lib/firstPagePdf");
      const blob = await buildFirstPagePdf(page);
      const buf = new Uint8Array(await blob.arrayBuffer());
      let bin = "";
      for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      const r = await fetch("/api/page-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdf: btoa(bin), filename: firstPagePdfName(page) }),
      });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (r.ok && j.ok) { setState("sent"); setNote(`Sent to ${email}.`); }
      else { setState("error"); setNote(j.message || "That did not send. Use Save the PDF instead."); }
    } catch {
      setState("error");
      setNote("That did not send. Use Save the PDF instead.");
    }
  }

  return (
    <>
      <button type="button" onClick={send} disabled={state === "busy"} className={className}>
        {state === "busy" ? "Sending…" : "Send me the PDF"}
      </button>
      <div className="basis-full text-[0.875rem] leading-snug text-muted">
        <p>
          Send me the PDF goes to <span className="break-all font-medium text-ink">{email}</span>, the email you sign in with.
          To send it to someone else, use Save the PDF.
        </p>
        {note && (
          <p role="status" className={`mt-1.5 font-medium ${state === "sent" ? "text-success" : "text-warn"}`}>{note}</p>
        )}
      </div>
    </>
  );
}
