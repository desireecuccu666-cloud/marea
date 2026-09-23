"use client";
import { useEffect, useRef } from "react";

/**
 * Real-time channel over SSE. `onEvent(event, data)` fires for every
 * server push (msg / typing / hello). Auto-reconnect is built into EventSource.
 */
export function useLive(target: string | null, onEvent: (event: string, data: any) => void) {
  const cb = useRef(onEvent);
  cb.current = onEvent;

  useEffect(() => {
    if (!target) return;
    const es = new EventSource(`/api/live?target=${encodeURIComponent(target)}`);
    const handler = (e: MessageEvent) => {
      try {
        cb.current(e.type, JSON.parse(e.data));
      } catch {}
    };
    es.addEventListener("msg", handler);
    es.addEventListener("typing", handler);
    es.addEventListener("hello", handler);
    return () => es.close();
  }, [target]);
}
