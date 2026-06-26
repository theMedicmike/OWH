"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";

type MemberVerify = { verification_status: string; consent: Record<string, unknown> };

export default function VerifyCard() {
  const { user, supabase } = useAuth();
  const [status, setStatus] = useState<string>("self_attested");
  const [attested, setAttested] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      let { data } = await supabase
        .from("members")
        .select("verification_status, consent")
        .eq("auth_id", user.id)
        .maybeSingle();
      if (!data) {
        const created = await supabase.from("members").insert({ auth_id: user.id }).select("verification_status, consent").single();
        data = created.data;
      }
      const m = (data ?? { verification_status: "self_attested", consent: {} }) as MemberVerify;
      setStatus(m.verification_status);
      setAttested(Boolean((m.consent ?? {})["attested"]));
      setLoaded(true);
    })();
  }, [user, supabase]);

  const verified = status === "document_verified" || status === "id_verified";

  async function affirm() {
    if (!user) return;
    setAttested(true);
    const { data } = await supabase.from("members").select("consent").eq("auth_id", user.id).maybeSingle();
    const consent = { ...((data?.consent as Record<string, unknown>) ?? {}), attested: true, attested_at: new Date().toISOString() };
    await supabase.from("members").update({ consent }).eq("auth_id", user.id);
  }

  if (!loaded) return null;

  if (verified) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success-soft px-4 py-3 text-sm">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-success">
          <path d="m9 12 2 2 4-4M12 3l7 4v5c0 4.4-3 8.3-7 9-4-0.7-7-4.6-7-9V7z" />
        </svg>
        <span className="font-medium text-success">Service verified</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-ink">Verify your service</div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${attested ? "bg-warn-soft text-warn" : "bg-canvas text-faint"}`}>
          {attested ? "Self-attested" : "Unverified"}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">
        Confirming your service is what makes your record credible to the VA and to researchers.
      </p>

      <div className="mt-4 space-y-2.5">
        {!attested && (
          <button
            onClick={affirm}
            className="w-full rounded-lg border border-brand bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand-600"
          >
            I affirm I am a U.S. veteran or service member
          </button>
        )}
        <Link
          href="/account"
          className="flex w-full items-center justify-between rounded-lg border border-line px-4 py-2 text-sm text-ink hover:bg-canvas"
        >
          <span>Upload your DD-214 for verified status</span>
          <span className="text-faint">→</span>
        </Link>
        <button
          disabled
          className="flex w-full cursor-not-allowed items-center justify-between rounded-lg border border-line px-4 py-2 text-sm text-faint"
          title="Coming soon"
        >
          <span>Verify with ID.me</span>
          <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px]">Coming soon</span>
        </button>
      </div>
    </div>
  );
}
