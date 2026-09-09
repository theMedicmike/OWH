import Anthropic from "@anthropic-ai/sdk";
import { rateLimit, clientKey } from "@/lib/ratelimit";
import {
  MEDIC_MIKE_SYSTEM,
  medicMikeCrisisCheck,
  medicMikeFilterVaccineCausation,
  medicMikeSymptomRoute,
} from "@/lib/medicMike";
import { createClient } from "@/lib/supabase/server";

type Msg = { role: "user" | "assistant"; content: string };

// Inbound caps. The page this serves is behind the auth wall, but the endpoint
// was not — anyone could POST a context-window-sized prompt to it, on a
// nonprofit's card. A veteran never types 8,000 characters at Mike in one go.
const MAX_MESSAGE_CHARS = 4_000;
const MAX_TOTAL_CHARS = 24_000;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    // Never hand a veteran an environment-variable name. He can do nothing with
    // it, and it is read aloud by the text-to-speech voice.
    console.error("[api/medic] ANTHROPIC_API_KEY is not set");
    return Response.json({ text: "Medic Mike isn't available right now. Try me again in a bit." });
  }

  // Require a signed-in veteran. The pages that call this are gated by
  // AppShell, but the route itself was open to the internet: any script could
  // drain the nonprofit's Anthropic budget, and the per-instance rate limit in
  // lib/ratelimit is explicitly documented as "not a hard guarantee" because
  // Vercel spins new instances with fresh empty buckets.
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    return Response.json({ text: "Sign in and I'll be right here." }, { status: 401 });
  }

  // Key the limiter on the veteran, not the forwarded IP — an IP is shared on
  // a base or a VA hospital wifi, and is trivially spoofed.
  if (!rateLimit(`medic:${auth.user.id}:${clientKey(req)}`, 40, 60_000)) {
    return Response.json({ text: "Give me a couple seconds to catch up, then try me again." }, { status: 429 });
  }

  try {
    const { messages } = (await req.json()) as { messages: Msg[] };
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ text: "Say that again for me?" }, { status: 400 });
    }

    const lastUser = [...messages].reverse().find((m) => m.role === "user");

    // 🔴 CRISIS FIRST. Ahead of the symptom router, ahead of the model, ahead of
    // everything. The router's STANDALONE_DIAGNOSIS_ASK matches "what's wrong
    // with me", which is inside "I don't know what's wrong with me anymore. I
    // want to die." — so before this line, that message was answered with a
    // paragraph about clinicians and no crisis number at all. Static text; no
    // model call; nothing stored.
    const crisis = lastUser ? medicMikeCrisisCheck(lastUser.content) : null;
    if (crisis) return Response.json({ text: crisis });

    const oversize = messages.some((m) => (m.content?.length ?? 0) > MAX_MESSAGE_CHARS);
    const total = messages.reduce((n, m) => n + (m.content?.length ?? 0), 0);
    if (oversize || total > MAX_TOTAL_CHARS) {
      return Response.json({ text: "That's a lot at once — send me the short version and we'll work from there." }, { status: 413 });
    }

    // Council ruling 2026-08-14: symptom→claimability matching must be blocked
    // by a PRODUCT-LEVEL routing rule, not prompt language alone. This runs
    // BEFORE the model is called, so Mike never gets the chance to attempt the
    // inference — a prompt that drifts can't leak past a request never made.
    const routed = lastUser ? medicMikeSymptomRoute(lastUser.content) : null;
    if (routed) return Response.json({ text: routed });

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system: MEDIC_MIKE_SYSTEM,
      // Keep only the last 20 turns to stay fast and bounded.
      messages: messages.slice(-20).map((m) => ({ role: m.role, content: m.content })),
    });
    const raw = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    // The system prompt tells him never to imply a vaccine caused anything; this
    // is the backstop for when it doesn't listen. A prompt is not a guarantee.
    const text = medicMikeFilterVaccineCausation(raw);
    return Response.json({ text });
  } catch (e) {
    // Server-side only. A raw API error string in Mike's speech bubble gets read
    // aloud to a veteran by the browser's voice.
    console.error("[api/medic]", e);
    return Response.json({ text: "Something got between me and the signal. Try me again." });
  }
}
