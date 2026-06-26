import InfoPage, { H, P } from "@/components/InfoPage";

export const metadata = { title: "Support — you are not alone" };

export default function SupportPage() {
  return (
    <InfoPage
      title="You are not alone"
      intro="If things feel heavy right now, please reach out. Help is free, confidential, and available 24/7 — even if you are not enrolled in VA care."
    >
      <div className="rounded-xl border-2 border-brand bg-brand/5 p-5">
        <div className="text-xs font-bold uppercase tracking-wide text-brand">Veterans Crisis Line</div>
        <div className="mt-2 text-lg font-bold text-ink">Dial <a href="tel:988" className="text-brand underline">988</a>, then press 1</div>
        <ul className="mt-2 space-y-1 text-sm text-ink">
          <li>Text <a href="sms:838255" className="text-brand underline">838255</a></li>
          <li>Chat at <a href="https://www.veteranscrisisline.net/get-help-now/chat/" className="text-brand underline">VeteransCrisisLine.net</a></li>
        </ul>
        <p className="mt-3 text-sm text-muted">
          You don&apos;t have to be at the edge to call. &ldquo;Not okay&rdquo; is reason enough. If you or
          someone you love is in immediate danger, call <a href="tel:911" className="text-brand underline">911</a>.
        </p>
      </div>

      <H>If your claim was denied</H>
      <P>
        If the VA denied a claim — please know this is common, even for strong, well-documented claims.
        It is not the end of the road. You can appeal or file a supplemental claim, and the record and
        packet you built here only make that next step stronger. Bring it to an accredited Veterans
        Service Officer (DAV, VFW, American Legion) — their help is free.
      </P>

      <H>What this app is, and isn't</H>
      <P>
        This app is a tool to help you build and document your record. It is not a counselor, a clinician,
        or a VA representative. For your mental health, please lean on the Crisis Line above and the
        people trained to walk with you.
      </P>

      <H>Helpful places to start</H>
      <P>
        Find an accredited representative or VSO through the VA at{" "}
        <a href="https://www.va.gov/get-help-from-accredited-representative/" className="text-brand hover:underline">va.gov</a>,
        and learn about benefits and the PACT Act at{" "}
        <a href="https://www.va.gov/" className="text-brand hover:underline">VA.gov</a>.
      </P>
    </InfoPage>
  );
}
