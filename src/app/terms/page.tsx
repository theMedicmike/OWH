import InfoPage, { H, P } from "@/components/InfoPage";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <InfoPage
      title="Terms of Service"
      updated="June 26, 2026"
      intro="Plain-English terms for using Connecting the Dots of Service, a free nonprofit tool from Operation Whole Health."
    >
      <H>1. Accepting these terms</H>
      <P>By creating an account or using this app, you agree to these terms. If you don't agree, please don't use the app.</P>

      <H>2. Who this is for</H>
      <P>
        The app is built for U.S. veterans and military first responders, and for the families and
        supporters who help them. You must be 18 or older. When you affirm your service, you agree to do
        so truthfully.
      </P>

      <H>3. What this service is — and is not</H>
      <P>
        Connecting the Dots of Service helps you build a personal record and an <em>estimate</em> of your
        service-related exposures, and assemble a claim-support packet. It is <strong>not</strong> the VA,
        <strong> not</strong> legal advice or representation, <strong>not</strong> medical advice or a
        diagnosis, and <strong>not</strong> a guarantee of any claim outcome. The packet is meant to be
        brought to an accredited Veterans Service Officer and a licensed clinician, who remain responsible
        for representing and advising you.
      </P>

      <H>4. Accurate information</H>
      <P>
        You agree to provide truthful information and not to impersonate anyone, claim service you did not
        perform, or submit false service or exposure data. Misuse undermines real veterans and may be
        removed.
      </P>

      <H>5. Acceptable use</H>
      <P>
        Don't use the app to commit fraud, harass others, upload someone else's records without their
        permission, attempt to break or overload the service, or scrape its data. Battle-buddy
        connections are shared only with mutual consent.
      </P>

      <H>6. Keep it unclassified</H>
      <P>
        Never enter classified, secret, or otherwise controlled information — no unit movements or
        operations, no mission details, no capabilities, and nothing covered by a non-disclosure agreement
        (NDA). Share only the general location, timeframe, and exposure type; that is all this app needs.
        You are solely responsible for what you submit, and if you&apos;re unsure whether something is
        sensitive, leave it out. This protects you and your fellow service members as much as it protects us.
      </P>

      <H>7. Your content</H>
      <P>
        Your record is yours. By using the app you give us permission to store and process your
        information solely to provide the service to you, as described in our{" "}
        <a href="/privacy" className="text-brand hover:underline">Privacy Policy</a>. We do not sell it.
      </P>

      <H>8. Our content</H>
      <P>
        The book, written materials, and educational content in the app are the copyrighted property of
        Operation Whole Health and its founder, shared for your personal use — please don't redistribute
        them.
      </P>

      <H>9. Accuracy and "as is"</H>
      <P>
        Citations and exposure information are general and depend on your specific dates, locations, and
        diagnosis — always confirm with an accredited representative. Some features use AI, which can be
        imperfect. The service is provided "as is," without warranties, and to the fullest extent allowed
        by law Operation Whole Health is not liable for decisions made based on it.
      </P>

      <H>10. Changes and contact</H>
      <P>
        We may update these terms; we'll post changes here with a new date. Questions? Email{" "}
        <a href="mailto:michael@operationwholehealth.org" className="text-brand hover:underline">michael@operationwholehealth.org</a>.
      </P>
    </InfoPage>
  );
}
