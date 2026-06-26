import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You write short, factual background notes about military bases and the places service members were stationed, for a veteran-facing app.

Given a place name, write 2-3 short sentences of general background: when it was established or first used militarily, which branch/era it's associated with, and one or two genuinely interesting, respectful facts. Keep a warm, plain, honorable tone.

Hard rules:
- If you are not reasonably sure about a specific fact, do NOT invent it. It is better to be general ("a U.S. installation used during the Vietnam era") than to state a wrong date or detail.
- No health, exposure, medical, or VA-claim content here — this is location background only.
- No politics, no opinions about wars.
- 75 words maximum. No preamble, no headings — just the background sentences.`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ text: "" });
  }
  try {
    const { name } = (await req.json()) as { name: string };
    if (!name || name.trim().length < 2) return Response.json({ text: "" });
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 220,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Place: ${name}` }],
    });
    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return Response.json({ text });
  } catch {
    return Response.json({ text: "" });
  }
}
