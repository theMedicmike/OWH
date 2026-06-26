import InfoPage, { H, P } from "@/components/InfoPage";

export const metadata = { title: "What this is — and what it isn't" };

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
        of 2022, 38 CFR Part 3, the Camp Lejeune Justice Act, VA presumptive lists, and ATSDR
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
        never sold. See our <a href="/privacy" className="text-brand hover:underline">Privacy Policy</a>{" "}
        for the details.
      </P>
    </InfoPage>
  );
}
