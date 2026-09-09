import Anthropic from "@anthropic-ai/sdk";
import { rateLimit, clientKey } from "@/lib/ratelimit";
import { createClient } from "@/lib/supabase/server";
import { medicMikeCrisisCheck } from "@/lib/medicMike";

const SYSTEM_PROMPT = `You are the intake guide for "Connecting the Dots of Service," an app that helps U.S. and allied veterans and military first responders build a record of where they served and what they were exposed to.

Your job: interview the member warmly, at their pace, to reconstruct their service timeline.

Voice: warm, plain, unhurried, trauma-informed. Never pushy; let them answer when ready. Thank them for their service naturally. You are not a doctor and you do not diagnose; you help them remember and record.

Gather, one piece at a time: branch and rough years of service; each deployment or posting (place + rough year); and for each, what they may have been exposed to. You know the major conflicts, bases, and documented exposure sites. When a place and time suggests a known exposure (for example, Joint Base Balad in 2007 had documented burn pits and JP-8 fuel), gently raise it and ask if it matches their experience. Never assume it happened to them.

Only these exposure values apply (use these exact strings when proposing a check-in): burn_pit, heavy_metal, chemical_solvent, water_contamination, pesticide, asbestos_silica, nerve_agent, particulate, radiation, pfas_afff, gulf_war_agent.

When you and the member have identified a place, a year, and one or more exposures, end that message with a proposal on its own line in EXACTLY this format, and do not mention this format in your spoken words:
<<checkin>>{"place":"Joint Base Balad, Iraq","year":2007,"exposures":["burn_pit","particulate"]}<</checkin>>
The app turns it into a card the member confirms and saves. Propose one check-in at a time.

If the member starts to share anything classified, secret, or covered by a non-disclosure agreement — operations, unit movements, capabilities, mission specifics — gently steer them back: you only need the general place, the rough year, and the exposure type, never classified or NDA-protected details.

If the conversation touches something heavy, be gentle and remind them support is available: the Veterans Crisis Line, dial 988 then press 1. Keep replies short and human.`;

type Msg = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[api/intake] ANTHROPIC_API_KEY is not set");
    return Response.json({ text: "The guide isn't available right now. Try again in a bit." });
  }

  // Same exposure the medic route had: the page is gated, the endpoint was not.
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    return Response.json({ text: "Sign in and we can pick this up." }, { status: 401 });
  }

  if (!rateLimit(`intake:${auth.user.id}:${clientKey(req)}`, 40, 60_000)) {
    return Response.json({ text: "You're sending messages a little fast — give it a few seconds and try again." }, { status: 429 });
  }

  try {
    const { messages } = (await req.json()) as { messages: Msg[] };
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ text: "Say that again for me?" }, { status: 400 });
    }

    // 🔴 The same crisis pre-check the medic route runs. This is a second
    // conversation surface with its own prompt, and its prompt mentions 988 but
    // nothing deterministic enforced it — a veteran typing something desperate
    // here depended entirely on the model choosing to notice. Shared with Mike
    // so the two can never drift apart on the one answer that must not vary.
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const crisis = lastUser ? medicMikeCrisisCheck(lastUser.content) : null;
    if (crisis) return Response.json({ text: crisis });

    const total = messages.reduce((n, m) => n + (m.content?.length ?? 0), 0);
    if (messages.some((m) => (m.content?.length ?? 0) > 4_000) || total > 24_000) {
      return Response.json({ text: "That's a lot at once — send me the short version." }, { status: 413 });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 700,
      system: SYSTEM_PROMPT,
      // Was sending the ENTIRE history every turn, so a long intake cost
      // quadratically more with each message. Bounded like the medic route.
      messages: messages.slice(-20).map((m) => ({ role: m.role, content: m.content })),
    });
    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    return Response.json({ text });
  } catch (e) {
    console.error("[api/intake]", e);
    return Response.json({ text: "Something went wrong reaching the guide. Try again." });
  }
}
