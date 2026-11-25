"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { Chevron } from "./ui";

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
      <div className="flex items-center gap-2.5 rounded-2xl border border-success/30 bg-success-soft px-4 py-3 text-[0.9375rem]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-success" aria-hidden="true">
          <path d="m9 12 2 2 4-4M12 3l7 4v5c0 4.4-3 8.3-7 9-4-0.7-7-4.6-7-9V7z" />
        </svg>
        <span className="font-semibold text-success">Service verified</span>
      </div>
    );
  }

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-ink">Verify your service</h3>
          <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted">
            Confirming your service is what makes your record credible to the VA and to researchers.
          </p>
        </div>
        <span className={`flex-none rounded-full px-2.5 py-1 text-[0.8125rem] font-semibold ${attested ? "bg-warn-soft text-warn" : "bg-canvas text-muted"}`}>
          {attested ? "Self-attested" : "Unverified"}
        </span>
      </div>

      <div className="mt-4 space-y-2.5">
        {!attested && (
          <button onClick={affirm} className="btn btn-primary w-full">
            I affirm I am a U.S. veteran or service member
          </button>
        )}
        <Link href="/account" className="btn btn-secondary w-full justify-between">
          <span>Upload your DD-214 for verified status</span>
          <Chevron className="text-faint" />
        </Link>
        <div className="flex min-h-11 items-center justify-between rounded-xl border border-dashed border-line px-4 text-[0.9375rem] text-faint" aria-disabled="true">
          <span>Verify with ID.me</span>
          <span className="rounded-full bg-canvas px-2.5 py-0.5 text-[0.8125rem] font-medium">Coming soon</span>
        </div>
      </div>
    </div>
  );
}
