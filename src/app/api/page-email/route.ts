import { createClient } from "@/lib/supabase/server";
import { rateLimit, clientKey } from "@/lib/ratelimit";

// "Send me the PDF": emails the veteran's own First Page PDF to the email on
// his own account, and to nobody else. There is no "to" field on purpose: the
// app never mails health information to a third party, and a typed address
// would let any account send any file to anyone from this sender. Sending it
// to a doctor or a spouse is his own act, through "Save the PDF" and his
// phone's share sheet.
//
// Mail host: Resend, named by Michael on 2026-11-27 (REST API, no SDK).
// OFF until both are set:
//   RESEND_API_KEY  read from the server environment and nowhere else. Never
//                   logged, never echoed, never written into the repo.
//   FROM_ADDRESS    below. Michael sets it, on a domain he has verified in Resend.
//
// This route is separate from the First Page itself: the sheet never calls it
// (firewall rule 16b). The PDF is built on the device and passes through here
// once, to the sender, on the veteran's tap. Nothing is stored.

// Michael sets this, e.g. "First Page <page@your-verified-domain>". Empty = off.
const FROM_ADDRESS = "";

const MAX_BYTES = 3_000_000;
const OFF = "Email is not set up yet. Use Save the PDF instead.";

function enabled() {
  return !!process.env.RESEND_API_KEY && !!FROM_ADDRESS;
}

export async function GET() {
  return Response.json({ enabled: enabled() });
}

export async function POST(req: Request) {
  if (!enabled()) return Response.json({ ok: false, error: "off", message: OFF }, { status: 503 });

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const to = auth?.user?.email;
  if (!auth?.user || !to) return Response.json({ ok: false, error: "signin", message: "Sign in to send it to your email." }, { status: 401 });

  if (!rateLimit(`page-email:${auth.user.id}:${clientKey(req)}`, 5, 3_600_000)) {
    return Response.json({ ok: false, error: "slow", message: "That is a few sends this hour. Try again later, or use Save the PDF." }, { status: 429 });
  }

  let pdf = "";
  let filename = "First-Page.pdf";
  try {
    const body = (await req.json()) as { pdf?: string; filename?: string };
    pdf = body.pdf ?? "";
    if (body.filename && /^[A-Za-z0-9._-]{1,80}\.pdf$/.test(body.filename)) filename = body.filename;
  } catch {
    return Response.json({ ok: false, error: "bad", message: "That did not send. Use Save the PDF instead." }, { status: 400 });
  }
  if (!pdf || pdf.length > (MAX_BYTES * 4) / 3 || !/^[A-Za-z0-9+/=]+$/.test(pdf) || !pdf.startsWith("JVBER")) {
    return Response.json({ ok: false, error: "bad", message: "That did not send. Use Save the PDF instead." }, { status: 400 });
  }

  let sent = false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [to],
        subject: "Your First Page",
        text: "Your First Page is attached as a PDF.",
        attachments: [{ filename, content: pdf }],
      }),
    });
    sent = r.ok;
  } catch {
    sent = false;
  }
  if (!sent) return Response.json({ ok: false, error: "send", message: "That did not send. Use Save the PDF instead." }, { status: 502 });
  return Response.json({ ok: true });
}
