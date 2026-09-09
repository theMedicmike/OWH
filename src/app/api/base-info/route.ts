import Anthropic from "@anthropic-ai/sdk";
import { rateLimit, clientKey } from "@/lib/ratelimit";
import { createClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `You are a military historian writing a short, vivid, honorable profile of a place where Americans served, for a veteran-facing app. Your reader may have served there. Write so they feel seen and proud — and so they learn something worth knowing about the ground they stood on.

Given a place name, write 2-4 short paragraphs (about 140-200 words total) covering, where you genuinely know it:
- Origins: when and why the installation or place was established, and what it was named for.
- Service: its role across the eras and conflicts it supported, and the branches, units, or operations associated with it.
- Character: one or two genuinely memorable details — terrain, scale, a notable mission, what daily life or the mission there was like.
- Close with a single respectful line honoring those who served there.

Tone: warm, dignified, plainspoken, never flowery or jingoistic. Like a knowledgeable friend who deeply respects the military.

Hard rules:
- Accuracy over richness. If you are not reasonably sure of a specific date, name, or fact, stay general ("a forward operating base used during the Iraq War") rather than inventing specifics. Never fabricate unit names, dates, or events.
- For a vague or non-military place name, give honest general context for that region and era instead of guessing.
- No health, exposure, medical, or VA-claim content — this is place history only.
- No politics or opinions about whether a war was right or wrong.
- No headings, no bullet points, no preamble — just the flowing profile.`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ text: "" });
  }
  // Gated like the other two AI routes. This one also sends a place name the
  // veteran typed to the model vendor, so an open endpoint was both a cost
  // exposure and a way for anyone to use the nonprofit's key as a free model.
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return Response.json({ text: "" }, { status: 401 });

  if (!rateLimit(`base-info:${auth.user.id}:${clientKey(req)}`, 20, 60_000)) {
    return Response.json({ text: "" }, { status: 429 });
  }
  try {
    const { name } = (await req.json()) as { name: string };
    if (!name || name.trim().length < 2 || name.length > 200) return Response.json({ text: "" });
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
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
