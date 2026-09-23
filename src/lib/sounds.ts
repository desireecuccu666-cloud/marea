"use client";
/**
 * Zero-asset sound engine (WebAudio): UI sfx + generated ocean ambience.
 * Browsers require a user gesture before audio — call unlock() on first pointerdown.
 */

let ctx: AudioContext | null = null;
let enabled = false;
let ambient: { src: AudioBufferSourceNode; lfo: OscillatorNode } | null = null;
let unlocked = false;

type Ctor = typeof AudioContext;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      const W = window as unknown as { AudioContext?: Ctor; webkitAudioContext?: Ctor };
      const AC = W.AudioContext ?? W.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function blip(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.12, when = 0, slideTo?: number) {
  const c = ac();
  if (!c) return;
  try {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    const t0 = c.currentTime + when;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  } catch {}
}

export type Sfx = "pop" | "send" | "match" | "cash" | "coin" | "call" | "err";

export function playSfx(s: Sfx) {
  if (!enabled) return;
  if (!ac()) return;
  switch (s) {
    case "pop":
      blip(660, 0.09, "sine", 0.1);
      blip(990, 0.08, "sine", 0.07, 0.05);
      break;
    case "send":
      blip(440, 0.07, "triangle", 0.09);
      blip(720, 0.09, "triangle", 0.08, 0.06);
      break;
    case "match":
      blip(523, 0.12, "sine", 0.1);
      blip(659, 0.12, "sine", 0.1, 0.1);
      blip(784, 0.18, "sine", 0.1, 0.2);
      break;
    case "cash":
      blip(880, 0.08, "square", 0.05);
      blip(1318, 0.16, "square", 0.045, 0.07);
      break;
    case "coin":
      blip(988, 0.06, "sine", 0.09);
      blip(1319, 0.1, "sine", 0.08, 0.05);
      break;
    case "call":
      blip(392, 0.16, "sine", 0.09);
      blip(523, 0.22, "sine", 0.09, 0.16);
      break;
    case "err":
      blip(170, 0.18, "sawtooth", 0.06);
      break;
  }
}

/* ---------- generated ocean ambience (brown-ish noise + slow swell) ---------- */
export function startAmbient() {
  const c = ac();
  if (!c || ambient || !enabled) return;
  try {
    const len = c.sampleRate * 4;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filt = c.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = 460;
    filt.Q.value = 0.6;
    const gain = c.createGain();
    gain.gain.value = 0.045;
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.09;
    const lfoGain = c.createGain();
    lfoGain.gain.value = 0.028;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    src.connect(filt);
    filt.connect(gain);
    gain.connect(c.destination);
    src.start();
    lfo.start();
    ambient = { src, lfo };
  } catch {}
}

export function stopAmbient() {
  if (ambient) {
    try {
      ambient.src.stop();
      ambient.lfo.stop();
    } catch {}
    ambient = null;
  }
}

export function setSoundEnabled(on: boolean) {
  enabled = on;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("marea_sound", on ? "1" : "0");
    } catch {}
  }
  if (on) {
    startAmbient();
    blip(660, 0.06, "sine", 0.05);
  } else {
    stopAmbient();
  }
}

export function soundEnabled() {
  return enabled;
}

export function unlockAudio() {
  if (unlocked || typeof window === "undefined") return;
  unlocked = true;
  ac();
  if (enabled) startAmbient();
}

export function restoreSoundPreference() {
  if (typeof window === "undefined") return;
  try {
    enabled = localStorage.getItem("marea_sound") === "1";
  } catch {
    enabled = false;
  }
}
