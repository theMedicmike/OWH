"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../AuthProvider";
import { createRecording, deleteRecording, listRecordings, updateRecording, type FpRecording } from "@/lib/firstPage";
import { BackToHub, Notice, PrimaryButton, QuietButton, Stance, Toggle, useDictation } from "./Controls";

// The ten-minute story. Recorded on the veteran's own device, kept in his
// private folder, transcribed by the browser's own speech recognition as he
// talks. He corrects the words. He picks three lines for the page. No model
// hears it, writes it or rewrites it.

const PROMPTS = [
  "Where did you serve, and what were you around?",
  "What changed in your body, and when?",
  "What must the doctor know today?",
];

export default function StoryRecorder() {
  const { supabase, user } = useAuth();
  const [items, setItems] = useState<FpRecording[]>([]);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const [keepAudio, setKeepAudio] = useState(true);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [finalText, setFinalText] = useState("");
  const [interim, setInterim] = useState("");
  const [busy, setBusy] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const dict = useDictation((t) => setFinalText((x) => (x ? `${x} ${t}` : t)), setInterim);

  const refresh = useCallback(async () => {
    const r = await listRecordings(supabase);
    if (!r.ok) { setError(r.error); return; }
    setItems(r.data);
  }, [supabase]);
  useEffect(() => {
    if (!user) return;
    (async () => { await refresh(); })();
  }, [user, refresh]);

  async function start() {
    setError("");
    setFinalText(""); setInterim(""); setSeconds(0);
    chunksRef.current = [];
    const canRecordAudio = "MediaRecorder" in window && !!navigator.mediaDevices?.getUserMedia;
    if (keepAudio && canRecordAudio) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr = new MediaRecorder(stream);
        mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        mr.onstop = () => stream.getTracks().forEach((t) => t.stop());
        mr.start(1000);
        mediaRef.current = mr;
      } catch {
        setError("The microphone could not start for audio. The words will still be written down if your browser can hear them.");
        mediaRef.current = null;
      }
    }
    dict.start();
    setRecording(true);
    timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
  }

  async function stop() {
    setRecording(false);
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    dict.stop();
    const mr = mediaRef.current;
    mediaRef.current = null;
    let blob: Blob | null = null;
    if (mr && mr.state !== "inactive") {
      await new Promise<void>((resolve) => { mr.addEventListener("stop", () => resolve(), { once: true }); mr.stop(); });
      blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
    }
    setBusy(true);
    let storagePath: string | null = null;
    if (blob && blob.size > 0 && user) {
      const ext = (blob.type.split("/")[1] || "webm").split(";")[0];
      const path = `${user.id}/story-${Date.now()}.${ext}`;
      const up = await supabase.storage.from("records").upload(path, blob, { contentType: blob.type || "audio/webm" });
      if (up.error) setError(`The audio did not save (${up.error.message}); the words did.`);
      else storagePath = path;
    }
    const transcript = [finalText, interim].filter(Boolean).join(" ");
    const r = await createRecording(supabase, { storage_path: storagePath, duration_sec: seconds, transcript, consent_spoken: consent });
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    setFinalText(""); setInterim("");
    refresh();
  }

  async function play(r: FpRecording) {
    if (!r.storage_path) return;
    const { data } = await supabase.storage.from("records").createSignedUrl(r.storage_path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  if (!user) return <Notice>Sign in to build your First Page.</Notice>;
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0"), ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <BackToHub />
      <Stance />
      <Notice error={error} />

      <div className="card p-5">
        <div className="text-sm font-semibold text-ink">Your story, in your own words</div>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          Ten minutes on a good day. Someone you trust can sit with you. Three prompts, nothing else. The recording stays
          in your own private files, and the words your browser hears appear below so you can fix them. Nothing is
          sent to any AI.
        </p>
        <ol className="mt-3 space-y-1.5">
          {PROMPTS.map((p, i) => <li key={p} className="flex gap-2 text-sm text-ink"><span className="inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand text-[13px] font-bold text-brand-foreground">{i + 1}</span>{p}</li>)}
        </ol>
        <div className="mt-4 space-y-2">
          <Toggle checked={consent} onChange={setConsent} label='Before I start, I will say out loud: "I am recording myself for my own medical page."' />
          <Toggle checked={keepAudio} onChange={setKeepAudio} label="Keep the audio file too, not only the words" />
          {!dict.supported && <p className="text-[13px] text-warn">This browser cannot write down what it hears. The audio can still be kept, and you can type the words afterward. Chrome, Edge or Safari on a phone can write them down.</p>}
        </div>
        <div className="mt-4 flex items-center gap-3">
          {!recording ? (
            <PrimaryButton onClick={start} disabled={!consent || busy}>Start recording</PrimaryButton>
          ) : (
            <button type="button" onClick={stop} className="rounded-lg bg-scarlet px-4 py-2 text-sm font-semibold text-white">Stop and save</button>
          )}
          <span className="font-mono text-sm text-muted" aria-live="polite">{mm}:{ss}</span>
          {busy && <span className="text-[13px] text-muted">Saving…</span>}
        </div>
        {(recording || finalText) && (
          <div className="mt-3 rounded-lg border border-line bg-canvas p-3 text-[15px] leading-relaxed text-ink">
            {finalText} <span className="text-faint">{interim}</span>
            {!finalText && !interim && <span className="text-faint">Listening…</span>}
          </div>
        )}
      </div>

      <div className="card p-5">
        <div className="text-sm font-semibold text-ink">Your recordings</div>
        {items.length === 0 ? <p className="mt-1 text-[13px] text-faint">None yet.</p> : (
          <ul className="mt-2 divide-y divide-line">
            {items.map((r) => <RecordingRow key={r.id} r={r} onPlay={() => play(r)} onSave={async (t) => { await updateRecording(supabase, r.id, { transcript: t }); refresh(); }} onDelete={async () => { await deleteRecording(supabase, r); refresh(); }} />)}
          </ul>
        )}
        <p className="mt-3 text-[13px] leading-relaxed text-faint">Pick your three lines on the Visit page. You can delete a recording at any time; it is gone from our storage when you do.</p>
      </div>
    </div>
  );
}

function RecordingRow({ r, onPlay, onSave, onDelete }: { r: FpRecording; onPlay: () => void; onSave: (t: string) => Promise<void>; onDelete: () => Promise<void> }) {
  const [t, setT] = useState(r.transcript ?? "");
  const [saved, setSaved] = useState(false);
  return (
    <li className="space-y-2 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-muted">
        <span>{r.recorded_on}{r.duration_sec ? `, ${Math.floor(r.duration_sec / 60)} min ${r.duration_sec % 60} s` : ""}{r.consent_spoken ? ", consent said aloud" : ""}</span>
        <span className="flex gap-2">
          {r.storage_path && <QuietButton onClick={onPlay}>play</QuietButton>}
          <QuietButton danger onClick={onDelete}>delete</QuietButton>
        </span>
      </div>
      <textarea value={t} onChange={(e) => { setT(e.target.value); setSaved(false); }} rows={5} className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink" placeholder="The words the browser heard. Fix anything it got wrong." />
      <div className="flex items-center gap-3">
        <QuietButton onClick={async () => { await onSave(t); setSaved(true); }}>Save the words</QuietButton>
        {saved && <span className="text-[13px] text-success">Saved.</span>}
      </div>
    </li>
  );
}
