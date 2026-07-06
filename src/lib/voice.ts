// Shared voice for Operation Whole Health — Medic Mike's male voice, reused by
// the Medic Mike chat AND the book's read-aloud so they sound like the same man.
//
// v1 uses the browser's built-in SpeechSynthesis (free, works offline, but the
// voice quality is OS-dependent). When a premium voice (ElevenLabs/OpenAI) is
// wired for Medic Mike, route it through here and both features upgrade at once.

// Prefer a natural, military-sounding male English voice; fall back sensibly.
export function pickMaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const byName = [
    "Microsoft David", "Microsoft Guy", "Microsoft Mark", "Daniel",
    "Google UK English Male", "Alex", "Aaron", "Fred", "Reed", "Rocko",
  ];
  for (const n of byName) {
    const v = voices.find((x) => x.name.includes(n));
    if (v) return v;
  }
  const male = voices.find((v) => /\bmale\b/i.test(v.name) && /^en/i.test(v.lang));
  if (male) return male;
  return voices.find((v) => /^en-US/i.test(v.lang)) || voices.find((v) => /^en/i.test(v.lang)) || voices[0];
}

// Resolve the male voice now and again when the browser finishes loading voices
// (they arrive async). Returns a cleanup function.
export function onMaleVoice(cb: (v: SpeechSynthesisVoice | null) => void): () => void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    cb(null);
    return () => {};
  }
  const resolve = () => cb(pickMaleVoice(window.speechSynthesis.getVoices()));
  resolve();
  window.speechSynthesis.addEventListener("voiceschanged", resolve);
  return () => window.speechSynthesis.removeEventListener("voiceschanged", resolve);
}

export const ttsSupported = () =>
  typeof window !== "undefined" && "speechSynthesis" in window;

type SpeakOpts = {
  voice?: SpeechSynthesisVoice | null;
  rate?: number;
  pitch?: number;
  onIndex?: (i: number) => void; // absolute chunk index that just started
  onDone?: () => void;
};

// Speak an ordered list of text chunks (paragraphs/sentences) starting at
// `startIndex`. Chunking keeps long text from getting truncated by the browser
// and gives us a follow-along highlight via onIndex. Cancels anything playing.
export function speakChunks(chunks: string[], startIndex: number, opts: SpeakOpts = {}) {
  if (!ttsSupported()) return;
  window.speechSynthesis.cancel();
  const start = Math.max(0, Math.min(startIndex, chunks.length - 1));
  let last: SpeechSynthesisUtterance | null = null;
  for (let i = start; i < chunks.length; i++) {
    const text = chunks[i]?.trim();
    if (!text) continue;
    const u = new SpeechSynthesisUtterance(text);
    if (opts.voice) u.voice = opts.voice;
    u.rate = opts.rate ?? 0.97;
    u.pitch = opts.pitch ?? 0.95;
    u.onstart = () => opts.onIndex?.(i);
    last = u;
    window.speechSynthesis.speak(u);
  }
  // Fire onDone from whichever utterance is truly last (handles trailing empty
  // chunks); if nothing was queued at all, fire immediately.
  if (last) last.onend = () => opts.onDone?.();
  else opts.onDone?.();
}

export function stopSpeaking() {
  if (ttsSupported()) window.speechSynthesis.cancel();
}
export function pauseSpeaking() {
  if (ttsSupported()) window.speechSynthesis.pause();
}
export function resumeSpeaking() {
  if (ttsSupported()) window.speechSynthesis.resume();
}
