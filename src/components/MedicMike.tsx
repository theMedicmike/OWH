"use client";

import { useEffect, useRef, useState } from "react";
import { MEDIC_MIKE_GREETING } from "@/lib/medicMike";

type Msg = { role: "user" | "assistant"; content: string };

// Minimal typings for the browser Web Speech API (not in the standard DOM lib).
interface SRResult { 0: { transcript: string }; isFinal: boolean }
interface SREvent { resultIndex: number; results: { length: number; [i: number]: SRResult } }
interface SRLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: SREvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
type SRCtor = new () => SRLike;

function pickMaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const byName = ["Microsoft David", "Microsoft Guy", "Microsoft Mark", "Daniel", "Google UK English Male", "Alex", "Aaron", "Fred", "Reed", "Rocko"];
  for (const n of byName) {
    const v = voices.find((x) => x.name.includes(n));
    if (v) return v;
  }
  const male = voices.find((v) => /\bmale\b/i.test(v.name) && /^en/i.test(v.lang));
  if (male) return male;
  return voices.find((v) => /^en-US/i.test(v.lang)) || voices.find((v) => /^en/i.test(v.lang)) || voices[0];
}

// Renders the real photo the moment /medic-mike.png exists; a medic badge until then.
function MikeAvatar({ size = 40 }: { size?: number }) {
  const [ok, setOk] = useState(true);
  const s = { width: size, height: size };
  if (ok) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/medic-mike.png" alt="Medic Mike" onError={() => setOk(false)}
        className="flex-none rounded-full object-cover ring-2 ring-accent/40" style={s} />
    );
  }
  return (
    <span className="flex flex-none items-center justify-center rounded-full bg-brand text-white ring-2 ring-accent/40" style={s}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" style={{ width: size * 0.5, height: size * 0.5 }}>
        <path d="M12 8v8M8 12h8" />
      </svg>
    </span>
  );
}

export default function MedicMike() {
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: MEDIC_MIKE_GREETING }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakOn, setSpeakOn] = useState(true);
  const [srSupported, setSrSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const recRef = useRef<SRLike | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<Msg[]>(messages);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
    setSrSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
    const hasTts = "speechSynthesis" in window;
    setTtsSupported(hasTts);
    if (hasTts) {
      const load = () => { voiceRef.current = pickMaleVoice(window.speechSynthesis.getVoices()); };
      load();
      window.speechSynthesis.onvoiceschanged = load;
    }
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      recRef.current?.stop();
    };
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  function speak(text: string) {
    if (!speakOn || !ttsSupported) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (voiceRef.current) u.voice = voiceRef.current;
      u.rate = 0.98;
      u.pitch = 0.95;
      window.speechSynthesis.speak(u);
    } catch { /* ignore */ }
  }

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || busy) return;
    setBusy(true);
    const next: Msg[] = [...messagesRef.current, { role: "user", content: text }];
    messagesRef.current = next;
    setMessages(next);
    setInput("");
    try {
      const res = await fetch("/api/medic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      const answer = (data?.text as string) || "I didn't quite catch that — mind saying it again?";
      const updated: Msg[] = [...messagesRef.current, { role: "assistant", content: answer }];
      messagesRef.current = updated;
      setMessages(updated);
      speak(answer);
    } catch {
      const updated: Msg[] = [...messagesRef.current, { role: "assistant", content: "I lost the signal for a second — try me again." }];
      messagesRef.current = updated;
      setMessages(updated);
    } finally {
      setBusy(false);
    }
  }

  function toggleMic() {
    if (!srSupported) return;
    if (listening) { recRef.current?.stop(); return; }
    const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;
    if (ttsSupported) window.speechSynthesis.cancel(); // don't let him talk over you
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    let final = "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      setInput((final + interim).trim());
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => {
      setListening(false);
      const t = final.trim();
      if (t) send(t);
    };
    recRef.current = rec;
    setListening(true);
    rec.start();
  }

  return (
    <div className="mx-auto flex h-[72vh] max-w-2xl flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-t-2xl bg-brand px-4 py-3 text-white">
        <MikeAvatar size={44} />
        <div className="min-w-0 flex-1">
          <div className="font-bold leading-tight">Medic Mike</div>
          <div className="text-xs text-white/70">Your guide — not a doctor, a lawyer, or the VA</div>
        </div>
        {ttsSupported && (
          <button
            type="button"
            onClick={() => setSpeakOn((v) => { if (v) window.speechSynthesis.cancel(); return !v; })}
            className="rounded-lg p-2 text-white/80 transition hover:bg-white/10"
            aria-label={speakOn ? "Turn Mike's voice off" : "Turn Mike's voice on"}
            title={speakOn ? "Voice on" : "Voice off"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M11 5 6 9H2v6h4l5 4V5z" />
              {speakOn ? <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" /> : <path d="M23 9l-6 6M17 9l6 6" />}
            </svg>
          </button>
        )}
      </div>

      {/* Conversation */}
      <div className="flex-1 space-y-4 overflow-y-auto border-x border-line bg-canvas p-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex items-end gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            {m.role === "assistant" && <MikeAvatar size={30} />}
            <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${m.role === "user" ? "bg-brand text-white" : "border border-line bg-white text-ink"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex items-end gap-2.5">
            <MikeAvatar size={30} />
            <div className="rounded-2xl border border-line bg-white px-4 py-2.5 text-sm text-muted">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.2s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.1s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex items-center gap-2 rounded-b-2xl border border-line bg-white p-3"
      >
        {srSupported && (
          <button
            type="button"
            onClick={toggleMic}
            aria-label={listening ? "Stop listening" : "Talk to Medic Mike"}
            className={`flex h-10 w-10 flex-none items-center justify-center rounded-full transition ${listening ? "animate-pulse bg-red-600 text-white" : "bg-brand/10 text-brand hover:bg-brand/20"}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
            </svg>
          </button>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={listening ? "Listening…" : "Talk to Medic Mike, or type…"}
          className="flex-1 rounded-full border border-line bg-canvas px-4 py-2.5 text-sm text-ink placeholder:text-faint focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/15"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Send"
          className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand text-white transition hover:bg-brand-600 disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </form>

      <p className="mt-2 px-1 text-center text-[11px] leading-relaxed text-faint">
        Medic Mike is an educational guide — not medical or legal advice, and not the VA. He helps you document and
        points you to an accredited VSO and your clinician. In crisis? Dial 988, then press 1.
        {!srSupported && " · Voice input works best in Chrome or Edge."}
      </p>
    </div>
  );
}
