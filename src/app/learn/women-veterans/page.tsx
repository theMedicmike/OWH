import AppShell from "@/components/AppShell";
import Link from "next/link";

const card = "rounded-xl border border-line bg-surface p-5";

// Deliberately standalone — not a Toxicant entry, no organ chips, no cross-
// links from the metal pages. Council ruling 2026-08-09 rescoped this page
// after both adversarial verify passes flagged the original proposal
// ("documented reproductive/hormonal research on specific toxicants"): the
// metals-testosterone guardrail exists because hormonal/reproductive claims
// about specific toxicants, hidden in a data array, has re-entered this
// project four times. This page covers deployment-role differences and real
// resources instead — never a hormone-directionality claim about any metal.
export default function WomenVeteransPage() {
  return (
    <AppShell title="Women veterans & service">
      <div className="mx-auto max-w-2xl space-y-5">
        <p className="text-sm leading-relaxed text-muted">
          Women veterans are the fastest-growing population in VA care, with a service and exposure picture
          that doesn&apos;t always match a library built around a male-default narrative. This page covers
          what&apos;s genuinely documented and where the real resources are — not speculation about hormones
          or reproduction tied to any specific exposure.
        </p>

        <section className={card}>
          <h2 className="text-sm font-semibold text-ink">Deployment roles and exposure patterns</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            Where you served and what your role put you near still matters the same way it does for any
            veteran — document your locations, your job, and what you were around using the map, the same as
            anyone else. Your exposure record is built from your own service, not assumed from your sex.
          </p>
          <Link href="/map" className="mt-2 inline-block text-xs font-semibold text-brand hover:underline">Log where you served →</Link>
        </section>

        <section className={card}>
          <h2 className="text-sm font-semibold text-ink">Military sexual trauma (MST)</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            VA provides MST-related care to every eligible veteran, regardless of discharge status in most
            cases, and free of the usual requirement to prove a specific in-service incident for the initial
            care itself. Conditions connected to MST can also be claimed for disability compensation, with
            evidence rules that specifically account for how hard MST often is to document at the time.
          </p>
        </section>

        <section className={card}>
          <h2 className="text-sm font-semibold text-ink">Care built for your body</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            Reproductive health, menopause, and conditions that can present differently in women are part of
            VA Women&apos;s Health care. Ask for the Women Veterans Program contact at your VA facility —
            that role exists specifically to help you navigate care, and the Women Veterans Call Center can
            point you to yours if you&apos;re not sure who that is.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            Women Veterans Call Center: <strong>855-829-6636</strong>.
          </p>
        </section>

        <p className="px-1 text-xs leading-relaxed text-faint">
          This page documents and points to real resources — it isn&apos;t medical advice, and nothing here
          is matched to your personal exposure record. Bring your questions to a VA provider and an
          accredited VSO. Veterans Crisis Line: dial 988, then press 1.
        </p>

        <Link href="/learn" className="block text-center text-xs font-medium text-brand hover:underline">← Exposure library</Link>
      </div>
    </AppShell>
  );
}
