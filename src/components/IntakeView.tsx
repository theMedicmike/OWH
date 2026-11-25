"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { EXPOSURE_LABEL } from "@/lib/education";
import { searchGazetteer } from "@/lib/gazetteer";
import { medicMikeCrisisCheck, medicMikeWithCrisisFooter } from "@/lib/medicMike";


type Proposal = {
  place: string;
  year: number;
  exposures: string[];
  status: "idle" | "saving" | "saved" | "saved_approx" | "error";
};

type Msg = { role: "user" | "assistant"; content: string; proposals?: Proposal[] };

const GREETING =
  "I'm your guide, and I'll help you build your service timeline at your pace. Nothing is shared without your say-so, and you can stop anytime. To start: which branch did you serve in, and roughly what years?";

function parseProposals(text: string): { clean: string; proposals: Proposal[] } {
  const proposals: Proposal[] = [];
  const re = /<<checkin>>([\s\S]*?)<<\/checkin>>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    try {
      const obj = JSON.parse(m[1].trim());
      if (obj.place && obj.year && Array.isArray(obj.exposures)) {
        proposals.push({ place: obj.place, year: obj.year, exposures: obj.exposures, status: "idle" });
      }
    } catch {
      // ignore malformed proposals
    }
  }
  const clean = text.replace(re, "").trim();
  return { clean, proposals };
}

// LOCAL ONLY. This previously queried Nominatim, which sent every deployment
// location a veteran typed — plus their IP — to a third party, from behind the
// OPSEC gate. Nothing about where a veteran served leaves this app. If the
// gazetteer doesn't know the place we return null and the check-in saves
// without coordinates, flagged for the veteran to place on the map.
function geocode(place: string): { lat: number; lng: number } | null {
  const segs = place.split(",").map((s) => s.trim()).filter(Boolean);
  const tries = [place, ...segs.slice(1).map((_, i) => segs.slice(i + 1).join(", "))];
  for (const q of Array.from(new Set(tries.filter(Boolean)))) {
    const hit = searchGazetteer(q, [], 1)[0];
    if (hit) return { lat: hit.lat, lng: hit.lng };
  }
  return null;
}

export default function IntakeView() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: GREETING }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, [supabase]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.content })) }),
      });
      const { text: reply } = await res.json();
      const { clean, proposals } = parseProposals(reply ?? "");
      setMessages((prev) => [...prev, { role: "assistant", content: clean, proposals }]);
    } catch {
      // Answered on the device: the server's crisis check first, else the crisis line on the fallback.
      const offline = medicMikeCrisisCheck(text) ?? medicMikeWithCrisisFooter("Sorry, I couldn't reach the guide just now. Try again in a moment.");
      setMessages((prev) => [...prev, { role: "assistant", content: offline }]);
    } finally {
      setBusy(false);
    }
  }

  async function saveProposal(mi: number, pi: number) {
    setMessages((prev) => {
      const copy = structuredClone(prev) as Msg[];
      copy[mi].proposals![pi].status = "saving";
      return copy;
    });
    const p = messages[mi].proposals![pi];
    const loc = geocode(p.place);
    // Never block the save: if we can't pin the exact spot, save it anyway and
    // let the member fine-tune the location on the map later.
    const coords = loc ?? { lat: 0, lng: 0 };
    let status: Proposal["status"] = "error";
    const { data: newId, error } = await supabase.rpc("log_check_in", {
      p_lng: coords.lng,
      p_lat: coords.lat,
      p_year: p.year,
      p_conflict: null,
      p_exposures: p.exposures,
    });
    if (!error && newId) {
      const patch: { place_name: string; notes?: string } = { place_name: p.place };
      if (!loc) patch.notes = "Location approximate — set the exact spot on the map.";
      await supabase.from("check_ins").update(patch).eq("id", newId);
      status = loc ? "saved" : "saved_approx";
    }
    setMessages((prev) => {
      const copy = structuredClone(prev) as Msg[];
      copy[mi].proposals![pi].status = status;
      return copy;
    });
  }

  return (
    <div>
      <div className="space-y-3">
        {messages.map((msg, mi) => (
          <div key={mi}>
            <div className={msg.role === "user" ? "flex justify-end" : "flex gap-2"}>
              {msg.role === "assistant" && (
                <div className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand/10 text-brand">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                    <circle cx="6" cy="19" r="3" /><circle cx="18" cy="5" r="3" /><path d="M9 19h6a3 3 0 0 0 3-3V8" />
                  </svg>
                </div>
              )}
              <div
                className={
                  msg.role === "user"
                    ? "max-w-[80%] rounded-2xl bg-brand px-4 py-2.5 text-[0.9375rem] leading-relaxed text-brand-foreground"
                    : "max-w-[85%] card px-4 py-2.5 text-[0.9375rem] leading-relaxed text-ink"
                }
              >
                {msg.content}
              </div>
            </div>

            {msg.proposals?.map((p, pi) => (
              <div key={pi} className="ml-9 mt-2 rounded-xl border border-line bg-canvas p-4">
                <div className="text-sm text-muted">Proposed check-in</div>
                <div className="mt-0.5 text-[0.9375rem] font-semibold text-ink">{p.place}</div>
                <div className="text-sm text-muted">Year {p.year}</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {p.exposures.map((e) => (
                    <span key={e} className="rounded-lg bg-brand/5 px-3 py-1 text-sm font-medium text-brand">
                      {EXPOSURE_LABEL[e] ?? e}
                    </span>
                  ))}
                </div>
                <div className="mt-3" aria-live="polite">
                  {!user ? (
                    <span className="text-[0.9375rem] text-muted">Sign in on the map to save this.</span>
                  ) : p.status === "saved" || p.status === "saved_approx" ? (
                    <span className="flex items-start gap-1.5 text-[0.9375rem] font-semibold text-success">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true"><path d="m5 12 4 4L19 7" /></svg>
                      <span>
                        Saved to your timeline.
                        {p.status === "saved_approx" && (
                          <span className="font-normal"> We couldn&apos;t pinpoint the exact spot, so you can set it on the map when you&apos;re ready.</span>
                        )}
                      </span>
                    </span>
                  ) : p.status === "error" ? (
                    <span role="alert" className="text-[0.9375rem] font-medium text-scarlet">Couldn&apos;t save just now. Please try again.</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => saveProposal(mi, pi)}
                      disabled={p.status === "saving"}
                      className="btn btn-primary"
                    >
                      {p.status === "saving" ? "Saving…" : "Save to my timeline"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
        {busy && <div className="ml-9 text-[0.9375rem] text-muted">typing…</div>}
        <div ref={endRef} />
      </div>

      <div className="mt-4 flex items-center gap-2 card p-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          aria-label="Your answer"
          placeholder="Type your answer…"
          className="field min-w-0 flex-1 border-transparent"
        />
        <button
          type="button"
          onClick={send}
          disabled={busy || !input.trim()}
          className="btn btn-primary btn-lg flex-none"
        >
          Send
        </button>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted">
        Your guide helps you remember and record; it does not diagnose. If anything feels heavy, the Veterans Crisis
        Line is one tap away: dial 988, then press 1.
      </p>
    </div>
  );
}
