import Anthropic from "@anthropic-ai/sdk";
import { rateLimit, clientKey } from "@/lib/ratelimit";
import { MEDIC_MIKE_SYSTEM, medicMikeFilterVaccineCausation, medicMikeSymptomRoute } from "@/lib/medicMike";

type Msg = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({
      text: "Medic Mike isn't connected yet. Add an Anthropic API key as ANTHROPIC_API_KEY in the environment, then restart the app.",
    });
  }
  if (!rateLimit(`medic:${clientKey(req)}`, 40, 60_000)) {
    return Response.json({ text: "Give me a couple seconds to catch up, then try me again." }, { status: 429 });
  }

  try {
    const { messages } = (await req.json()) as { messages: Msg[] };

    // Council ruling 2026-08-14: symptom→claimability matching must be blocked
    // by a PRODUCT-LEVEL routing rule, not prompt language alone. This runs
    // BEFORE the model is called, so Mike never gets the chance to attempt the
    // inference — a prompt that drifts can't leak past a request never made.
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
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
    return Response.json({ text: "Something got between me and the signal: " + (e as Error).message });
  }
}
