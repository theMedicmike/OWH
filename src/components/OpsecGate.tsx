"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";

// A one-time OPSEC / NDA acknowledgment a veteran must accept before building their
// record. Protects the veteran (their oath + any non-disclosure agreements) and the
// nonprofit. Stored in members.consent.opsec_acknowledged; cached in localStorage so
// returning users never see it again (no per-page flash).

const LS = "owh-opsec-ack";

export default function OpsecGate({ children }: { children: React.ReactNode }) {
  const { user, supabase } = useAuth();
  const [status, setStatus] = useState<"loading" | "ok" | "gate">("loading");
  const [consent, setConsent] = useState<Record<string, unknown>>({});
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) {
      setStatus("ok");
      return;
    }
    try {
      if (localStorage.getItem(LS) === "1") {
        setStatus("ok");
        return;
      }
    } catch {
      /* ignore */
    }
    supabase
      .from("members")
      .select("consent")
      .eq("auth_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const c = (data?.consent as Record<string, unknown>) ?? {};
        setConsent(c);
        if (c.opsec_acknowledged) {
          try { localStorage.setItem(LS, "1"); } catch { /* ignore */ }
          setStatus("ok");
        } else {
          setStatus("gate");
        }
      });
  }, [user, supabase]);

  async function agree() {
    if (!user || !checked) return;
    setBusy(true);
    const next = { ...consent, opsec_acknowledged: true, opsec_acknowledged_at: new Date().toISOString() };
    const { data: ex } = await supabase.from("members").select("id").eq("auth_id", user.id).maybeSingle();
    if (ex) await supabase.from("members").update({ consent: next }).eq("auth_id", user.id);
    else await supabase.from("members").insert({ auth_id: user.id, consent: next });
    try { localStorage.setItem(LS, "1"); } catch { /* ignore */ }
    setBusy(false);
    setStatus("ok");
  }

  if (status === "loading") return <div className="py-12 text-center text-[0.9375rem] text-muted">Loading…</div>;
  if (status === "ok") return <>{children}</>;

  return (
    <div className="mx-auto max-w-xl">
      <section className="card">
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-canvas text-brand">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-ink">Before you begin: keep it unclassified</h2>
              <p className="text-sm text-muted">A one-time agreement. It protects you as much as us.</p>
            </div>
          </div>

          <div className="mt-4 space-y-3 text-[0.9375rem] leading-relaxed text-ink">
            <p>
              Your record only needs the <strong>broad strokes</strong>: the general place you served, the
              rough year, and the exposure types. That&apos;s all the VA&apos;s presumptive links are built
              on — and it&apos;s all this app ever needs.
            </p>
            <div className="rounded-xl border border-line bg-canvas px-4 py-3">
              <p>
                Please do <strong>not</strong> enter anything classified, secret, or otherwise controlled —
                no unit movements or operations, no mission details, no capabilities, and nothing covered by
                a <strong>non-disclosure agreement (NDA)</strong>. <strong>If you&apos;re unsure whether
                something is sensitive, leave it out.</strong> A general location and year is enough.
              </p>
            </div>
            <p className="text-muted">
              This keeps you on the right side of your oath and your agreements, keeps this record clean, and
              keeps the mission protected. See the full <Link href="/terms" className="font-medium text-brand hover:underline">Terms</Link>.
            </p>
          </div>

          <label className="mt-5 flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-line bg-white px-3.5 py-3 hover:bg-canvas">
            <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-0.5 h-6 w-6 flex-none accent-brand" />
            <span className="text-[0.9375rem] font-medium leading-relaxed text-ink">
              I understand. I will not enter classified, secret, or NDA-protected information, and I take
              responsibility for what I share.
            </span>
          </label>

          <button
            onClick={agree}
            disabled={!checked || busy}
            className="mt-4 w-full btn btn-primary btn-lg"
          >
            {busy ? "One moment…" : "I agree. Start my record"}
          </button>
        </div>
      </section>
    </div>
  );
}
