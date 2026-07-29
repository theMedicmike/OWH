import InfoPage, { H, P } from "@/components/InfoPage";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy Policy"
      updated="June 26, 2026"
      intro="Your record is yours. Here's exactly what we collect, how it's protected, and the control you have over it."
    >
      <H>What we collect</H>
      <P>
        Only what you give us: your email (for your account); your profile (name, branch, service dates,
        job code — all optional); the locations you log and the years; the exposures and health
        conditions you record; files you upload (such as a DD-214); the answers you type or speak into the
        intake; and basic, privacy-respecting usage information to keep the app working.
      </P>

      <H>How your data is protected</H>
      <P>
        Your records live in a database with row-level security, which means each person can read and
        write only their own data — no other user can see your record. Data is encrypted in transit and at
        rest, and uploaded files are kept in private storage.
      </P>

      <H>How we use it</H>
      <P>
        Strictly to provide the service to you: to build your timeline, your education pages, and your
        claim-support packet. <strong>We never sell or rent your data, and we never use it for
        advertising.</strong>
      </P>

      <H>AI processing</H>
      <P>
        Some text — the voice-guided intake and the base-history summaries — is processed by Anthropic's
        Claude API to generate responses. That content is used only to answer you in the moment; it is not
        used to train AI models, and we send only what's needed.
      </P>

      <H>Service providers</H>
      <P>
        We rely on a small set of vendors to run the app: Supabase (database, authentication, file
        storage), Anthropic (the AI features above), OpenFreeMap (background map tiles only), and Vercel
        (hosting). We do not sell data to data brokers.
      </P>
      <P>
        <strong>Where you served never leaves this app.</strong> Base names and pin locations are matched
        against a list of military installations bundled inside the app itself — we removed the outside
        look-up services that used to receive them. The one thing your browser still requests from an
        outside service is the plain background map imagery, which, like loading any web image, tells
        that provider your IP address and the area of the world you are looking at. It never carries your
        pins, your exposures, your conditions, or anything identifying you.
      </P>

      <H>Contributing to the collective record (opt-in)</H>
      <P>
        Exposure patterns across many veterans can help get new conditions recognized and support research
        and legislation like the Breaking the Cascade Act. You can choose to contribute your record to that
        collective picture in <strong>Account → &quot;Help prove what happened to all of us.&quot;</strong> This is{" "}
        <strong>off by default</strong> — nothing is ever included unless you turn it on, and you can turn it
        back off at any time, which removes you from future updates.
      </P>
      <P>
        When you do opt in, only <strong>coarse patterns</strong> are used — exposure type, a general place, a
        year, a condition, and whether it was corroborated. Your name, email, exact coordinates, exact dates,
        free-text notes, and uploaded documents are <strong>never</strong> included. Counts are only shown or
        shared once enough people are included that no individual can be identified. This data is{" "}
        <strong>never sold</strong>; any research use is under a signed data-use agreement.
      </P>

      <H>Your rights and control</H>
      <P>
        You can view your full record anytime, remove any location you've logged, and request a copy of
        your data or full deletion of your account by emailing{" "}
        <a href="mailto:michael@operationwholehealth.org" className="text-brand hover:underline">michael@operationwholehealth.org</a>.
      </P>

      <H>A few important notes</H>
      <P>
        Operation Whole Health is not a healthcare provider, and this app is not medical care — so it is
        not a HIPAA-covered entity. The app is for adults (18+). If we make material changes to this
        policy, we'll update this page and the date above.
      </P>
    </InfoPage>
  );
}
