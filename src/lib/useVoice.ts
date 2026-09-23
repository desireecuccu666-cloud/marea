"use client";
import { useEffect, useRef, useState } from "react";

/** MediaRecorder-based voice messages (max 20s), returned as data-URL. */
export function useVoice(onDone: (dataUrl: string) => void, onError?: () => void) {
  const [recording, setRecording] = useState(false);
  const [secs, setSecs] = useState(0);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const errRef = useRef(onError);
  errRef.current = onError;

  const cleanup = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    rec.current = null;
    setRecording(false);
    setSecs(0);
  };

  const start = async () => {
    if (rec.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      chunks.current = [];
      r.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      r.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunks.current, { type: r.mimeType || "audio/webm" });
        const fr = new FileReader();
        fr.onloadend = () => doneRef.current(String(fr.result));
        fr.readAsDataURL(blob);
        cleanup();
      };
      rec.current = r;
      r.start();
      setRecording(true);
      setSecs(0);
      timer.current = setInterval(() => {
        setSecs((s) => {
          if (s + 1 >= 20 && rec.current?.state === "recording") rec.current.stop();
          return Math.min(s + 1, 20);
        });
      }, 1000);
    } catch {
      errRef.current?.();
    }
  };

  const stop = () => {
    if (rec.current?.state === "recording") rec.current.stop();
  };

  useEffect(
    () => () => {
      if (rec.current?.state === "recording") rec.current.stop();
      if (timer.current) clearInterval(timer.current);
    },
    []
  );

  return { recording, secs, start, stop };
}
