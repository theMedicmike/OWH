import Anthropic from "@anthropic-ai/sdk";
import { rateLimit, clientKey } from "@/lib/ratelimit";
import { MEDIC_MIKE_SYSTEM } from "@/lib/medicMike";

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
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system: MEDIC_MIKE_SYSTEM,
      // Keep only the last 20 turns to stay fast and bounded.
      messages: messages.slice(-20).map((m) => ({ role: m.role, content: m.content })),
    });
    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    return Response.json({ text });
  } catch (e) {
    return Response.json({ text: "Something got between me and the signal: " + (e as Error).message });
  }
}
