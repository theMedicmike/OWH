import InfoPage, { H, P } from "@/components/InfoPage";

export const metadata = {
  title: "What this is — and what it isn't",
  description:
    "Who builds Connecting the Dots of Service, where the science comes from, and the honest limits: it is not the VA, not legal representation, and not a diagnosis. What happens to your record on a breach, or if the nonprofit closes.",
};

export default function TrustPage() {
  return (
    <InfoPage
      title="What this is — and what it isn't"
      intro="Before you type in a single thing, here's who we are, where the science comes from, and the honest limits of what this app can do."
    >
      <H>Who we are</H>
      <P>
        Connecting the Dots of Service is built by Operation Whole Health, a Patriot-founded 501(c)(3)
        nonprofit. Our founder, Michael Jones, is not a veteran — he built this alongside veterans and
        their families who lived the struggle of trying to connect their health to their service. It is
        free, and it always will be for veterans.
      </P>

      <H>Where the science comes from</H>
      <P>
        The exposures and conditions in this app are grounded in documented, public sources: the PACT Act
        of 2022, 38 CFR Part 3 (§§3.307, 3.309, 3.311, 3.317, 3.320), VA presumptive lists, and ATSDR
        toxicological profiles. Every known site is labeled honestly — <strong>recognized</strong> (the
        government concedes the link), <strong>documented</strong> (a federal agency finding or
        peer-reviewed study), or <strong>emerging</strong> (a real but not-yet-recognized link). We will
        not overclaim, because a weak claim hurts your credibility.
      </P>

      <H>What this app does</H>
      <P>
        It helps you map where you served, understand what you were likely exposed to, connect those
        exposures to your health, and assemble a claim-support packet you can bring to an accredited
        representative and a clinician.
      </P>

      <H>What this app is not</H>
      <P>
        <strong>It is not the VA</strong>, and it cannot grant, deny, or guarantee any claim outcome.
      </P>
      <P>
        <strong>It is not legal advice or representation.</strong> We are not your accredited
        representative. The packet is a tool to bring <em>to</em> an accredited Veterans Service Officer
        (DAV, VFW, American Legion, or a VA-accredited agent or attorney) — and we strongly encourage you
        to work with one. They represent you; we help you walk in prepared.
      </P>
      <P>
        <strong>It is not medical advice or a diagnosis.</strong> The health and root-cause education here
        is general information to explore with your own clinician — never a treatment plan, a
        prescription, or a substitute for professional care.
      </P>

      <H>Your data is yours</H>
      <P>
        Everything you enter is private to you, protected so that only you can read your own record, and
        never sold. You can download your whole record, print an archive copy, or permanently delete it —
        any time, without asking anyone, from your <a href="/account" className="text-brand hover:underline">Account</a> page.
        See our <a href="/privacy" className="text-brand hover:underline">Privacy Policy</a> for the full details.
      </P>

      <H>If something goes wrong</H>
      <P>
        <strong>If we ever have a security incident that exposes your personal information</strong>, we
        will tell you directly — by email, without unreasonable delay — what happened, what was involved,
        and what to do next. We won&apos;t wait for you to find out some other way.
      </P>
      <P>
        <strong>If Operation Whole Health ever closes</strong>, your record is deleted, not handed to
        anyone else. We will not transfer your data — including anything you&apos;ve written about MST,
        mental health, or anything else sensitive — to another organization, sell it as an asset, or keep
        it running under new ownership. If we ever have advance notice this is happening, we will email
        you first with a real window to export or delete your own record before that happens. Nothing
        about this nonprofit&apos;s mission or funding changes that.
      </P>
      <P>
        We are a small nonprofit, not a bank or a hospital system — we don&apos;t have a large compliance
        department, and we won&apos;t pretend otherwise. What we do have is a small, well-understood set of
        vendors (see <a href="/privacy" className="text-brand hover:underline">Privacy Policy</a>), your
        data locked to your account alone, and a straightforward promise: it&apos;s your record, we&apos;re
        holding it for you, and we&apos;ll act like it.
      </P>
    </InfoPage>
  );
}
